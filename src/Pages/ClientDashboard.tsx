import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./DashboardStyles.css";
import "./ClientWorkspace.css";

export default function ClientDashboard() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({
        totalJobs: 0,
        openJobs: 0,
        pendingBids: 0,
        acceptedBids: 0,
    });
    const [recentJobs, setRecentJobs] = useState<any[]>([]);

    const channelRef = useRef<any>(null);

    useEffect(() => {
        initClientDashboard();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const initClientDashboard = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileData) {
            setProfile(profileData);
        }

        await fetchClientStats(user.id);

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        channelRef.current = supabase
            .channel(`client-dashboard:${user.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
                fetchClientStats(user.id);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => {
                fetchClientStats(user.id);
            })
            .subscribe();

        setLoading(false);
    };

    const fetchClientStats = async (clientId: string) => {
        const { data: jobs } = await supabase
            .from("jobs")
            .select("id, title, status, created_at")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false });

        const allJobs = jobs || [];
        const jobIds = allJobs.map((job: any) => job.id);

        let proposals: any[] = [];
        if (jobIds.length > 0) {
            const { data: proposalData } = await supabase
                .from("proposals")
                .select("id, status, job_id")
                .in("job_id", jobIds);
            proposals = proposalData || [];
        }

        const pendingBids = proposals.filter((proposal) => proposal.status === "pending").length;
        const acceptedBids = proposals.filter((proposal) => proposal.status === "accepted").length;

        setStats({
            totalJobs: allJobs.length,
            openJobs: allJobs.filter((job: any) => job.status === "open").length,
            pendingBids,
            acceptedBids,
        });

        setRecentJobs(allJobs.slice(0, 5));
    };

    if (loading) {
        return (
            <div className="dashboard-grid-page">
                <p style={{ padding: "40px" }}>Loading client dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid-page client-workspace">
            <div className="dash-header-profile">
                <h2>{profile?.full_name || "Client"}</h2>
                <p className="text-gray">Manage posted work and review freelancer bids in real-time.</p>
            </div>

            <p className="section-label">OVERVIEW</p>
            <div className="overview-stats">
                <div className="stat-card">
                    <span className="stat-label">Posted jobs</span>
                    <span className="stat-value">{stats.totalJobs}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Open jobs</span>
                    <span className="stat-value text-blue">{stats.openJobs}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Pending bids</span>
                    <span className="stat-value text-orange">{stats.pendingBids}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Accepted bids</span>
                    <span className="stat-value text-green">{stats.acceptedBids}</span>
                </div>
            </div>

            <div className="client-action-row">
                <Link to="/post-work" className="client-action-btn">+ Post New Work</Link>
                <Link to="/client-bids" className="client-action-btn secondary">Review Freelancer Bids</Link>
                <Link to="/client-projects" className="client-action-btn secondary">Track Accepted Projects</Link>
            </div>

            <p className="section-label mt-40">RECENTLY POSTED</p>
            <div className="panel-card">
                {recentJobs.length === 0 ? (
                    <p className="text-gray">No jobs posted yet.</p>
                ) : (
                    <ul className="client-job-list">
                        {recentJobs.map((job) => (
                            <li key={job.id}>
                                <span>{job.title}</span>
                                <span className={`badge badge-${job.status === "open" ? "pending" : "accepted"}`}>
                                    {job.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
