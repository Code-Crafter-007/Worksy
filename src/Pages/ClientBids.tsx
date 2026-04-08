import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import "./ClientWorkspace.css";

type ProposalStatus = "pending" | "accepted" | "rejected";

export default function ClientBids() {
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const channelRef = useRef<any>(null);
    const selectedJobRef = useRef<string | null>(null);

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        setClientId(user.id);
        await fetchJobsAndProposals(user.id);

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        channelRef.current = supabase
            .channel(`client-bids:${user.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => {
                fetchJobsAndProposals(user.id, selectedJobRef.current);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
                fetchJobsAndProposals(user.id, selectedJobRef.current);
            })
            .subscribe();

        setLoading(false);
    };

    const fetchJobsAndProposals = async (userId: string, keepSelectedId?: string | null) => {
        const { data: jobData } = await supabase
            .from("jobs")
            .select("id, title, budget, status, created_at")
            .eq("client_id", userId)
            .order("created_at", { ascending: false });

        const myJobs = jobData || [];
        setJobs(myJobs);

        if (myJobs.length === 0) {
            setSelectedJobId(null);
            setProposals([]);
            return;
        }

        const nextSelectedId = keepSelectedId && myJobs.some((job) => job.id === keepSelectedId)
            ? keepSelectedId
            : myJobs[0].id;

        setSelectedJobId(nextSelectedId);
        selectedJobRef.current = nextSelectedId;
        await fetchProposalsForJob(nextSelectedId);
    };

    const fetchProposalsForJob = async (jobId: string) => {
        const { data } = await supabase
            .from("proposals")
            .select(`
                id,
                job_id,
                freelancer_id,
                bid_amount,
                cover_letter,
                status,
                created_at,
                freelancer:profiles!freelancer_id(id, full_name, avatar_url, headline, bio, skills)
            `)
            .eq("job_id", jobId)
            .order("created_at", { ascending: false });

        setProposals(data || []);
    };

    const handleSelectJob = async (jobId: string) => {
        setSelectedJobId(jobId);
        selectedJobRef.current = jobId;
        await fetchProposalsForJob(jobId);
    };

    const handleProposalStatus = async (proposal: any, nextStatus: ProposalStatus) => {
        if (!clientId) return;
        setUpdatingId(proposal.id);

        const { error } = await supabase.rpc("set_proposal_decision", {
            p_proposal_id: proposal.id,
            p_decision: nextStatus,
        });

        if (error) {
            alert(`Could not update proposal: ${error.message}`);
            setUpdatingId(null);
            return;
        }

        // Activity logs are best-effort. Proposal decision is already persisted by RPC.
        const actionText = nextStatus === "accepted" ? "accepted" : "rejected";
        await supabase.from("activity_logs").insert([
            {
                user_id: proposal.freelancer_id,
                action_type: `proposal_${actionText}`,
                description: `Client ${actionText} your proposal for this project.`,
            },
        ]);

        await fetchJobsAndProposals(clientId, proposal.job_id);
        setUpdatingId(null);
    };

    const pendingProposals = proposals.filter((proposal) => proposal.status === "pending");
    const acceptedProposal = proposals.find((proposal) => proposal.status === "accepted") || null;

    const getTimelineFromCoverLetter = (coverLetter: string) => {
        const firstLine = (coverLetter || "").split("\n")[0]?.trim();
        if (firstLine?.toLowerCase().startsWith("timeline:")) {
            return firstLine.slice(9).trim();
        }
        return "";
    };

    const getDescriptionFromCoverLetter = (coverLetter: string) => {
        const lines = (coverLetter || "").split("\n");
        if (lines[0]?.trim().toLowerCase().startsWith("timeline:")) {
            return lines.slice(1).join("\n").trim();
        }
        return coverLetter;
    };

    if (loading) {
        return (
            <div className="dashboard-grid-page client-workspace">
                <p style={{ padding: "40px" }}>Loading bids...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid-page client-workspace">
            <div className="dash-header-profile">
                <h2>Freelancer Bids</h2>
                <p className="text-gray">Review proposals, accept one freelancer, or reject bids per project.</p>
            </div>

            {jobs.length === 0 ? (
                <div className="panel-card">
                    <p className="text-gray">You do not have posted jobs yet. Post work first to receive bids.</p>
                </div>
            ) : (
                <div className="client-bids-layout">
                    <aside className="panel-card bid-jobs-panel">
                        <h3>Posted Jobs</h3>
                        <div className="bid-job-list">
                            {jobs.map((job) => (
                                <button
                                    key={job.id}
                                    className={`job-row-btn ${selectedJobId === job.id ? "active" : ""}`}
                                    onClick={() => handleSelectJob(job.id)}
                                >
                                    <span>{job.title}</span>
                                    <span className={`badge badge-${job.status === "open" ? "pending" : "accepted"}`}>{job.status}</span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <section className="panel-card bid-proposals-panel">
                        <h3>Received Proposals ({pendingProposals.length})</h3>

                        {acceptedProposal && (
                            <div className="accepted-proposal-card">
                                <h4>Accepted Freelancer</h4>
                                <div className="proposal-top">
                                    <div>
                                        <h4>{acceptedProposal.freelancer?.full_name || "Freelancer"}</h4>
                                        <p>{acceptedProposal.freelancer?.headline || "Freelancer"}</p>
                                    </div>
                                    <span className="badge badge-accepted">accepted</span>
                                </div>
                                <p className="proposal-amount">Bid: INR {acceptedProposal.bid_amount}</p>
                                {getTimelineFromCoverLetter(acceptedProposal.cover_letter) && (
                                    <p className="proposal-timeline">Timeline: {getTimelineFromCoverLetter(acceptedProposal.cover_letter)}</p>
                                )}
                                <p className="proposal-letter">{getDescriptionFromCoverLetter(acceptedProposal.cover_letter)}</p>
                                {acceptedProposal.freelancer?.bio && <p className="proposal-extra">About: {acceptedProposal.freelancer.bio}</p>}
                                {Array.isArray(acceptedProposal.freelancer?.skills) && acceptedProposal.freelancer.skills.length > 0 && (
                                    <div className="job-tags">
                                        {acceptedProposal.freelancer.skills.map((skill: string) => (
                                            <span key={skill} className="skill-tag">{skill}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {pendingProposals.length === 0 ? (
                            <p className="text-gray">No pending bids on this job.</p>
                        ) : (
                            <div className="proposal-grid">
                                {pendingProposals.map((proposal) => {
                                    const freelancer = proposal.freelancer;
                                    return (
                                        <div key={proposal.id} className="proposal-card-client">
                                            <div className="proposal-top">
                                                <div>
                                                    <h4>{freelancer?.full_name || "Freelancer"}</h4>
                                                    <p>{freelancer?.headline || "Freelancer"}</p>
                                                </div>
                                                <span className={`badge badge-${proposal.status}`}>
                                                    {proposal.status}
                                                </span>
                                            </div>
                                            <p className="proposal-amount">Bid: INR {proposal.bid_amount}</p>
                                            {getTimelineFromCoverLetter(proposal.cover_letter) && (
                                                <p className="proposal-timeline">Timeline: {getTimelineFromCoverLetter(proposal.cover_letter)}</p>
                                            )}
                                            <p className="proposal-letter">{getDescriptionFromCoverLetter(proposal.cover_letter)}</p>
                                            <div className="proposal-actions-row">
                                                <button
                                                    className="client-action-btn"
                                                    disabled={!!updatingId}
                                                    onClick={() => handleProposalStatus(proposal, "accepted")}
                                                >
                                                    {updatingId === proposal.id ? "Updating..." : "Accept"}
                                                </button>
                                                <button
                                                    className="client-action-btn reject"
                                                    disabled={!!updatingId}
                                                    onClick={() => handleProposalStatus(proposal, "rejected")}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
