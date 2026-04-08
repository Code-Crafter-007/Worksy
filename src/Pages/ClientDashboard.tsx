import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Dashboard.css";
import "./ClientWorkspace.css";

const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconPlusCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconLayers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
);

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, pendingBids: 0, acceptedBids: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initClientDashboard();
    return () => { if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; } };
  }, []);

  const initClientDashboard = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profileData) setProfile(profileData);
    await fetchClientStats(user.id);
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    channelRef.current = supabase
      .channel(`client-dashboard:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => fetchClientStats(user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => fetchClientStats(user.id))
      .subscribe();
    setLoading(false);
  };

  const fetchClientStats = async (clientId: string) => {
    const { data: jobs } = await supabase.from("jobs").select("id, title, status, created_at").eq("client_id", clientId).order("created_at", { ascending: false });
    const allJobs = jobs || [];
    const jobIds = allJobs.map((j: any) => j.id);
    let proposals: any[] = [];
    if (jobIds.length > 0) {
      const { data: proposalData } = await supabase.from("proposals").select("id, status, job_id").in("job_id", jobIds);
      proposals = proposalData || [];
    }
    setStats({
      totalJobs: allJobs.length,
      openJobs: allJobs.filter((j: any) => j.status === "open").length,
      pendingBids: proposals.filter(p => p.status === "pending").length,
      acceptedBids: proposals.filter(p => p.status === "accepted").length,
    });
    setRecentJobs(allJobs.slice(0, 5));
  };

  if (loading) return (
    <div className="dash-page">
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "80px 0", color: "var(--text-muted)", fontSize: "14px" }}>
        <div style={{ width: "22px", height: "22px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "fw-spin 0.7s linear infinite" }} />
        Loading dashboard…
      </div>
    </div>
  );

  return (
    <div className="dash-page client-workspace">
      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <p className="dash-welcome-eyebrow">Client Dashboard</p>
          <h1 className="dash-welcome-name">{profile?.full_name || "Client"}</h1>
          <p className="dash-welcome-sub">Manage your posted work and review freelancer bids in real time.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--gray"><IconBriefcase /></div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Posted Jobs</span>
            <span className="dash-stat-value">{stats.totalJobs}</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--blue"><IconBox /></div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Open Jobs</span>
            <span className="dash-stat-value dash-stat-value--blue">{stats.openJobs}</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--purple"><IconUsers /></div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Pending Bids</span>
            <span className="dash-stat-value">{stats.pendingBids}</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--green"><IconCheckCircle /></div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Accepted Bids</span>
            <span className="dash-stat-value dash-stat-value--green">{stats.acceptedBids}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="client-action-row" style={{ marginBottom: "28px" }}>
        <Link to="/post-work" className="dash-btn-accent" style={{ textDecoration: "none" }}>
          <IconPlusCircle /> Post New Work
        </Link>
        <Link to="/client-bids" className="dash-btn-outline" style={{ textDecoration: "none", maxWidth: "200px" }}>
          <IconList /> Review Bids
        </Link>
        <Link to="/client-projects" className="dash-btn-outline" style={{ textDecoration: "none", maxWidth: "200px" }}>
          <IconLayers /> Track Projects
        </Link>
      </div>

      {/* Recently posted */}
      <div className="dash-section-head dash-section-head--spaced">
        <span className="dash-section-label">Recently Posted</span>
      </div>
      <div className="dash-card">
        {recentJobs.length === 0 ? (
          <div className="dash-empty-state">
            <div className="dash-empty-icon"><IconBriefcase /></div>
            <p className="dash-empty-title">No jobs posted yet</p>
            <p className="dash-empty-sub">Post your first job to start receiving freelancer bids.</p>
            <Link to="/post-work" className="dash-btn-accent" style={{ textDecoration: "none" }}>
              <IconPlusCircle /> Post a Job
            </Link>
          </div>
        ) : (
          <ul className="client-job-list">
            {recentJobs.map((job) => (
              <li key={job.id}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{job.title}</span>
                <span className={`dash-badge dash-badge--${job.status === "open" ? "green" : "orange"}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
