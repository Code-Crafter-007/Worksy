import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "./ClientWorkspace.css";

type WorkStatus = "not_started" | "in_progress" | "submitted" | "completed" | null;
type JobStatus = "open" | "in_progress" | "completed" | "cancelled";
type MilestoneStatus = "not_started" | "in_progress" | "completed";

interface MilestoneItem {
    id: string;
    proposal_id: string;
    title: string;
    status: MilestoneStatus;
}

interface AcceptedProjectRow {
    proposalId: string;
    jobId: string;
    title: string;
    budget: number;
    bidAmount: number;
    acceptedAt: string;
    deadline: string | null;
    jobStatus: JobStatus;
    workStatus: WorkStatus;
    freelancerName: string;
    freelancerHeadline: string | null;
    milestones: MilestoneItem[];
    progress: number;
}

function getProgressFromStatus(status: WorkStatus, jobStatus: JobStatus): number {
    if (jobStatus === "completed" || status === "completed") return 100;
    if (status === "submitted") return 90;
    if (status === "in_progress") return 50;
    if (status === "not_started") return 0;
    return 10;
}

function getProgressLabel(status: WorkStatus, jobStatus: JobStatus): string {
    if (jobStatus === "completed" || status === "completed") return "Completed";
    if (status === "submitted") return "Submitted for review";
    if (status === "in_progress") return "In progress";
    if (status === "not_started") return "Not started";
    return "Active";
}

export default function ClientAcceptedProjects() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<AcceptedProjectRow[]>([]);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        initPage();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const initPage = async () => {
        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        await fetchAcceptedProjects(user.id);

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        channelRef.current = supabase
            .channel(`client-accepted-projects:${user.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => {
                fetchAcceptedProjects(user.id);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
                fetchAcceptedProjects(user.id);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "milestones" }, () => {
                fetchAcceptedProjects(user.id);
            })
            .subscribe();

        setLoading(false);
    };

    const fetchAcceptedProjects = async (clientId: string) => {
        const { data: acceptedRows, error } = await supabase
            .from("proposals")
            .select(`
                id,
                bid_amount,
                status,
                work_status,
                created_at,
                job:jobs!job_id(id, title, budget, deadline, status, client_id),
                freelancer:profiles!freelancer_id(full_name, headline)
            `)
            .eq("status", "accepted")
            .eq("job.client_id", clientId)
            .order("created_at", { ascending: false });

        if (error || !acceptedRows || acceptedRows.length === 0) {
            setProjects([]);
            return;
        }

        const proposalIds = acceptedRows.map((row: any) => row.id as string);

        const { data: milestoneRows } = await supabase
            .from("milestones")
            .select("id, proposal_id, title, status")
            .in("proposal_id", proposalIds)
            .order("created_at", { ascending: true });

        const milestoneMap: Record<string, MilestoneItem[]> = {};
        (milestoneRows || []).forEach((milestone: any) => {
            const item: MilestoneItem = {
                id: milestone.id,
                proposal_id: milestone.proposal_id,
                title: milestone.title,
                status: milestone.status,
            };
            if (!milestoneMap[item.proposal_id]) {
                milestoneMap[item.proposal_id] = [];
            }
            milestoneMap[item.proposal_id].push(item);
        });

        const normalized: AcceptedProjectRow[] = acceptedRows
            .filter((row: any) => row.job)
            .map((row: any) => {
                const projectMilestones = milestoneMap[row.id] || [];
                const completedCount = projectMilestones.filter((milestone) => milestone.status === "completed").length;
                const progress = projectMilestones.length > 0
                    ? Math.round((completedCount / projectMilestones.length) * 100)
                    : getProgressFromStatus(row.work_status ?? null, row.job.status);

                return {
                    proposalId: row.id,
                    jobId: row.job.id,
                    title: row.job.title,
                    budget: Number(row.job.budget || 0),
                    bidAmount: Number(row.bid_amount || 0),
                    acceptedAt: row.created_at,
                    deadline: row.job.deadline,
                    jobStatus: row.job.status,
                    workStatus: row.work_status ?? null,
                    freelancerName: row.freelancer?.full_name || "Freelancer",
                    freelancerHeadline: row.freelancer?.headline || null,
                    milestones: projectMilestones,
                    progress,
                };
            });

        setProjects(normalized);
    };

    if (loading) {
        return (
            <div className="dashboard-grid-page client-workspace">
                <p style={{ padding: "40px" }}>Loading accepted projects...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid-page client-workspace">
            <div className="dash-header-profile">
                <h2>Accepted Projects</h2>
                <p className="text-gray">Track projects where you accepted a bid and monitor freelancer progress.</p>
            </div>

            {projects.length === 0 ? (
                <div className="panel-card">
                    <p className="text-gray">No accepted projects yet. Accept a freelancer bid to start tracking progress here.</p>
                </div>
            ) : (
                <div className="accepted-projects-grid">
                    {projects.map((project) => {
                        const statusLabel = getProgressLabel(project.workStatus, project.jobStatus);
                        return (
                            <article key={project.proposalId} className="panel-card accepted-project-card">
                                <div className="accepted-project-head">
                                    <div>
                                        <h3>{project.title}</h3>
                                        <p className="text-gray">Freelancer: {project.freelancerName}</p>
                                        {project.freelancerHeadline && (
                                            <p className="text-gray accepted-headline">{project.freelancerHeadline}</p>
                                        )}
                                    </div>
                                    <span className={`badge ${project.progress >= 100 ? "badge-accepted" : "badge-pending"}`}>
                                        {statusLabel}
                                    </span>
                                </div>

                                <div className="accepted-meta-row">
                                    <span>Bid: INR {project.bidAmount.toLocaleString()}</span>
                                    <span>Budget: INR {project.budget.toLocaleString()}</span>
                                    <span>
                                        Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Flexible"}
                                    </span>
                                </div>

                                <div className="accepted-progress-block">
                                    <div className="progress-labels">
                                        <span>Overall progress</span>
                                        <span>{project.progress}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${project.progress}%` }} />
                                    </div>
                                </div>

                                <div className="accepted-milestones-block">
                                    <p className="milestones-subtitle">Milestones</p>
                                    {project.milestones.length === 0 ? (
                                        <p className="text-gray">No milestones added yet.</p>
                                    ) : (
                                        <ul className="milestone-list compact-milestones">
                                            {project.milestones.map((milestone) => (
                                                <li key={milestone.id}>
                                                    <div className="milestone-item">
                                                        <span className={`dot bg-${milestone.status === "completed" ? "green" : milestone.status === "in_progress" ? "blue" : "gray"}`} />
                                                        <span>{milestone.title}</span>
                                                    </div>
                                                    <span className={`ms-status text-${milestone.status === "completed" ? "green" : milestone.status === "in_progress" ? "blue" : "gray"}`}>
                                                        {milestone.status === "completed" ? "Done" : milestone.status === "in_progress" ? "In progress" : "To do"}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <p className="accepted-at text-gray">Accepted on {new Date(project.acceptedAt).toLocaleDateString()}</p>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
