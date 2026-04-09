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
    freelancerId: string;
    freelancerName: string;
    freelancerHeadline: string | null;
    milestones: MilestoneItem[];
    progress: number;
    deliveredWorkUrl: string | null;
    deliveredWorkNotes: string | null;
    escrowStatus: 'pending' | 'held' | 'released' | 'refunded' | 'none';
    escrowId: string | null;
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
            .on("postgres_changes", { event: "*", schema: "public", table: "escrow_payments" }, () => {
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
                freelancer_id,
                bid_amount,
                status,
                work_status,
                delivered_work_url,
                delivered_work_notes,
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
        const jobIds = acceptedRows.map((row: any) => row.job.id as string);

        const { data: milestoneRows } = await supabase
            .from("milestones")
            .select("id, proposal_id, title, status")
            .in("proposal_id", proposalIds)
            .order("created_at", { ascending: true });

        const { data: escrowRows } = await supabase
            .from("escrow_payments")
            .select("id, project_id, freelancer_id, status")
            .in("project_id", jobIds);

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

                const escrow = escrowRows?.find((e: any) => e.project_id === row.job.id && e.freelancer_id === row.freelancer_id);

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
                    freelancerId: row.freelancer_id,
                    freelancerName: row.freelancer?.full_name || "Freelancer",
                    freelancerHeadline: row.freelancer?.headline || null,
                    milestones: projectMilestones,
                    progress,
                    deliveredWorkUrl: row.delivered_work_url || null,
                    deliveredWorkNotes: row.delivered_work_notes || null,
                    escrowStatus: escrow ? escrow.status : 'none',
                    escrowId: escrow ? escrow.id : null
                };
            });

        setProjects(normalized);
    };

    const handleFundEscrow = async (project: AcceptedProjectRow) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Ensure Razorpay SDK is loaded
        const res = await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('create-escrow-order', {
                body: {
                    projectId: project.jobId,
                    clientId: user.id,
                    freelancerId: project.freelancerId,
                    amount: project.bidAmount
                }
            });

            if (error) throw new Error(error.message || JSON.stringify(error));

            const { order, escrow } = data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkey',
                amount: order.amount,
                currency: order.currency,
                name: 'Worksy Escrow Secure',
                description: `Fund Escrow for ${project.title}`,
                order_id: order.id,
                handler: async function (response: any) {
                    const { error: confirmError } = await supabase.functions.invoke('confirm-escrow-payment', {
                        body: {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            escrow_id: escrow.id
                        }
                    });

                    if (confirmError) alert('Payment recorded, but failed to confirm escrow status.');
                    else alert('Escrow funded successfully! Funds are held until work is approved.');
                    
                    fetchAcceptedProjects(user.id);
                },
                theme: { color: '#8A2BE2' }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any){
                    alert(response.error.description);
            });
            rzp.open();
        } catch (err: any) {
            alert('Error funding escrow: ' + err.message);
        }
    };

    const handleReleaseEscrow = async (project: AcceptedProjectRow) => {
        if (!project.escrowId) return;
        const confirmRelease = window.confirm("Are you sure you want to release the funds to the freelancer? This assumes you have approved their work.");
        if (!confirmRelease) return;
        
        try {
            const { error } = await supabase.functions.invoke('release-escrow', {
                body: { escrow_id: project.escrowId }
            });
            if (error) throw new Error(error.message || JSON.stringify(error));
            alert("Funds successfully released! The project is now complete.");
            initPage();
        } catch (err: any) {
            alert("Failed to release escrow: " + err.message);
        }
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
                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                                        <span className={`badge ${project.progress >= 100 ? "badge-accepted" : "badge-pending"}`}>
                                            {statusLabel}
                                        </span>
                                        {(project.escrowStatus === 'none' || project.escrowStatus === 'pending') && (
                                            <button onClick={() => handleFundEscrow(project)} className="btn-primary-purple" style={{padding: '6px 12px', fontSize: '12px'}}>
                                                {project.escrowStatus === 'pending' ? 'Retry Fund Escrow' : 'Fund Escrow'}
                                            </button>
                                        )}
                                        {project.escrowStatus === 'held' && project.workStatus !== 'submitted' && (
                                            <span className="badge" style={{background: '#e0f7fa', color: '#006064'}}>Awaiting Work Submission</span>
                                        )}
                                        {project.escrowStatus === 'held' && project.workStatus === 'submitted' && (
                                            <button onClick={() => handleReleaseEscrow(project)} className="btn-primary-purple" style={{padding: '6px 12px', fontSize: '12px', background: '#4CAF50'}}>Approve & Release Payment</button>
                                        )}
                                        {project.escrowStatus === 'released' && (
                                            <span className="badge" style={{background: '#c8e6c9', color: '#1b5e20'}}>Payment Released ✓</span>
                                        )}
                                    </div>
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

                                {project.workStatus === 'submitted' && project.escrowStatus === 'held' && (
                                    <div style={{ marginTop: '20px', padding: '16px', background: '#f5f5ff', borderRadius: '8px', border: '1px solid #d0c4f5' }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4a148c' }}>📦 Freelancer's Final Deliverables</p>
                                        {project.deliveredWorkNotes && (
                                            <div style={{ marginBottom: '12px', color: '#555', fontSize: '14px', fontStyle: 'italic', background: 'white', padding: '10px', borderRadius: '6px' }}>
                                                "{project.deliveredWorkNotes}"
                                            </div>
                                        )}
                                        {project.deliveredWorkUrl && (
                                            <a href={project.deliveredWorkUrl} target="_blank" rel="noreferrer" className="btn-outline-blue" style={{ display: 'inline-block', fontSize: '13px', textDecoration: 'none' }}>
                                                View Attached Work Link ↗
                                            </a>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
