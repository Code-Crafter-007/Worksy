import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Dashboard.css";

/* ── Inline SVG Icons ─────────────────────────────────── */
const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconCoin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);
const IconLayersFolders = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
  </svg>
);
const IconBellOff = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconClipboard = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconRefreshCw = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

/* ── Status dot icons ─────────────────────────────────── */
const IconDot = ({ color }: { color: string }) => (
  <span style={{
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: color,
    flexShrink: 0,
  }} />
);

function timeAgo(dateString: string) {
  const diffHours = Math.floor((Date.now() - new Date(dateString).getTime()) / 3600000);
  if (diffHours === 0) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#4ade80",
  in_progress: "#60a5fa",
  not_started: "#6b6b7a",
  accepted: "#4ade80",
  rejected: "#ef4444",
  pending: "#f59e0b",
  submitted: "#a78bfa",
};

/* ── Skeleton loader ──────────────────────────────────── */
function DashSkeleton() {
  return (
    <div className="dash-page">
      <div className="skel-hero skel" />
      <div className="skel-stats">
        {[...Array(4)].map((_, i) => <div key={i} className="skel-stat skel" />)}
      </div>
      <div className="skel-two-col">
        <div className="skel-col-a skel" />
        <div className="skel-col-b">
          {[...Array(3)].map((_, i) => <div key={i} className="skel-bid skel" />)}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [totalBids, setTotalBids] = useState(0);
  const [acceptedBids, setAcceptedBids] = useState(0);
  const [inProgressBids, setInProgressBids] = useState(0);
  const [earned, setEarned] = useState(0);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false);
  const [isSubmitWorkOpen, setIsSubmitWorkOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [deliverableLink, setDeliverableLink] = useState("");

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (prof) setProfile(prof);

    const { data: allProposals } = await supabase
      .from("proposals").select("*, job:jobs(*)").eq("freelancer_id", user.id).order("created_at", { ascending: false });

    if (allProposals) {
      setTotalBids(allProposals.length);
      const accepted = allProposals.filter(p => p.status === "accepted");
      setAcceptedBids(accepted.length);
      const inProg = allProposals.filter(p => p.work_status === "in_progress");
      setInProgressBids(inProg.length);
      const completed = allProposals.filter(p => p.work_status === "completed");
      setEarned(completed.reduce((s, p) => s + p.bid_amount, 0) || accepted.reduce((s, p) => s + p.bid_amount, 0));
      setRecentProposals(allProposals.slice(0, 3));
      const latestActive = allProposals.find(p => p.status === "accepted" && p.work_status !== "completed");
      if (latestActive) {
        setActiveProject(latestActive);
        const { data: mData } = await supabase.from("milestones").select("*").eq("proposal_id", latestActive.id).order("created_at", { ascending: true });
        setMilestones(mData || []);
      }
    }

    const { data: actData } = await supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
    if (actData) setActivities(actData);
    setLoading(false);
  };

  const calculateProgress = () => {
    if (!milestones.length) return 0;
    return Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newMilestoneTitle) return;
    const { error } = await supabase.from("milestones").insert([{ proposal_id: activeProject.id, title: newMilestoneTitle, status: "not_started" }]);
    if (error) alert("Could not add milestone: " + error.message);
    else {
      setNewMilestoneTitle("");
      const { data } = await supabase.from("milestones").select("*").eq("proposal_id", activeProject.id).order("created_at", { ascending: true });
      if (data) setMilestones(data);
    }
  };

  const handleToggleMilestone = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "not_started" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "not_started";
    const { error } = await supabase.from("milestones").update({ status: nextStatus }).eq("id", id);
    if (!error) setMilestones(milestones.map(m => m.id === id ? { ...m, status: nextStatus } : m));
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !deliverableLink) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("proposals").update({ work_status: "submitted" }).eq("id", activeProject.id);
    if (error) alert("Error submitting work: " + error.message);
    else {
      if (user) await supabase.from("activity_logs").insert([{ user_id: user.id, action_type: "work_submitted", description: `You submitted deliverables to ${activeProject.job?.title}` }]);
      alert("Work submitted successfully!");
      setIsSubmitWorkOpen(false);
      setDeliverableLink("");
      fetchDashboardData();
    }
  };

  if (loading) return <DashSkeleton />;

  const progress = calculateProgress();

  return (
    <div className="dash-page">

      {/* ── WELCOME BANNER ─────────────────────────────── */}
      <div className="dash-welcome">
        <div>
          <p className="dash-welcome-eyebrow">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋</p>
          <h1 className="dash-welcome-name">{profile?.full_name || "Freelancer"}</h1>
          <p className="dash-welcome-sub">Here's what's happening with your work today.</p>
        </div>
        <button className="dash-find-btn" onClick={() => navigate("/find-work")}>
          Browse Jobs <IconArrowRight />
        </button>
      </div>

      {/* ── OVERVIEW STAT CARDS ─────────────────────────── */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--gray">
            <IconBriefcase />
          </div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Total Bids</span>
            <span className="dash-stat-value">{totalBids}</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--green">
            <IconCheckCircle />
          </div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Accepted</span>
            <span className="dash-stat-value dash-stat-value--green">{acceptedBids}</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--blue">
            <IconActivity />
          </div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">In Progress</span>
            <span className="dash-stat-value dash-stat-value--blue">{inProgressBids}</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon dash-stat-icon--purple">
            <IconCoin />
          </div>
          <div className="dash-stat-body">
            <span className="dash-stat-label">Earned</span>
            <span className="dash-stat-value">₹{earned.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN ─────────────────────────────────── */}
      <div className="dash-two-col">

        {/* LEFT: ACTIVE PROJECT */}
        <div className="dash-col">
          <div className="dash-section-head">
            <span className="dash-section-label">Active Project</span>
          </div>

          <div className="dash-card">
            {activeProject ? (
              <>
                <div className="dash-card-header">
                  <h3 className="dash-card-title">{activeProject.job?.title || "Project"}</h3>
                  <span className={`dash-badge dash-badge--${activeProject.work_status === "submitted" ? "purple" : "green"}`}>
                    {activeProject.work_status === "submitted" ? "Awaiting Review" : "Active"}
                  </span>
                </div>

                <p className="dash-card-meta">
                  Due {activeProject.job?.deadline ? new Date(activeProject.job.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Flexible"}
                </p>

                {/* Progress */}
                <div className="dash-progress-block">
                  <div className="dash-progress-labels">
                    <span>Overall progress</span>
                    <span className="dash-progress-pct">{progress}%</span>
                  </div>
                  <div className="dash-progress-track">
                    <div className="dash-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Milestones */}
                <div className="dash-milestones">
                  <p className="dash-milestones-label">Milestones</p>
                  {milestones.length > 0 ? (
                    <ul className="dash-milestone-list">
                      {milestones.map(m => (
                        <li key={m.id} className="dash-milestone-item">
                          <div className="dash-milestone-left">
                            <IconDot color={STATUS_COLORS[m.status] || "#6b6b7a"} />
                            <span className={m.status === "completed" ? "dash-milestone-done" : ""}>{m.title}</span>
                          </div>
                          <span className="dash-milestone-status" style={{ color: STATUS_COLORS[m.status] }}>
                            {m.status === "completed" ? "Done" : m.status === "in_progress" ? "In progress" : "To do"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dash-empty-sub">No milestones yet. Add your first one below.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="dash-card-actions">
                  <button className="dash-btn-outline" onClick={() => setIsUpdateProgressOpen(true)}>
                    <IconPlus /> Update Progress
                  </button>
                  <button className="dash-btn-outline" onClick={() => setIsSubmitWorkOpen(true)}>
                    <IconSend /> Submit Work
                  </button>
                </div>
              </>
            ) : (
              <div className="dash-empty-state">
                <div className="dash-empty-icon">
                  <IconLayersFolders />
                </div>
                <p className="dash-empty-title">No active projects</p>
                <p className="dash-empty-sub">Once a client accepts your bid, your project will appear here.</p>
                <button className="dash-btn-accent" onClick={() => navigate("/find-work")}>
                  Find Work <IconArrowRight />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: BID TRACKER */}
        <div className="dash-col">
          <div className="dash-section-head">
            <span className="dash-section-label">Recent Bids</span>
            <button className="dash-section-link" onClick={() => navigate("/proposals")}>View all</button>
          </div>

          {recentProposals.length > 0 ? (
            <div className="dash-bid-list">
              {recentProposals.map(p => (
                <div key={p.id} className="dash-card dash-bid-card">
                  <div className="dash-card-header">
                    <h4 className="dash-bid-title">{p.job?.title || "Project"}</h4>
                    <span className={`dash-badge dash-badge--${p.status}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </div>
                  <p className="dash-bid-meta">
                    Your bid: <strong>₹{p.bid_amount?.toLocaleString()}</strong>
                    <span className="dash-bid-sep">·</span>
                    Budget: ₹{p.job?.budget?.toLocaleString() || "—"}
                  </p>
                  {p.status === "pending" && (
                    <p className="dash-bid-sub">Applied {new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · Waiting for response</p>
                  )}
                  {p.status === "accepted" && (
                    <p className="dash-bid-sub dash-bid-sub--green">Client accepted your bid!</p>
                  )}
                  {p.status === "rejected" && (
                    <button className="dash-btn-outline dash-btn-full">
                      <IconRefreshCw /> Revise &amp; Rebid
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-card">
              <div className="dash-empty-state">
                <div className="dash-empty-icon">
                  <IconClipboard />
                </div>
                <p className="dash-empty-title">No bids placed yet</p>
                <p className="dash-empty-sub">Find a project you like and place your first bid.</p>
                <button className="dash-btn-accent" onClick={() => navigate("/find-work")}>
                  Browse Jobs <IconArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT ACTIVITY ────────────────────────────── */}
      <div className="dash-section-head dash-section-head--spaced">
        <span className="dash-section-label">Recent Activity</span>
      </div>

      <div className="dash-card dash-activity-card">
        {activities.length > 0 ? (
          <ul className="dash-activity-list">
            {activities.map((act, i) => {
              let dotColor = "#6b6b7a";
              if (act.action_type.includes("accepted") || act.action_type.includes("submitted")) dotColor = "#4ade80";
              else if (act.action_type.includes("progress") || act.action_type.includes("updated")) dotColor = "#60a5fa";
              else if (act.action_type.includes("bid") && !act.action_type.includes("rejected")) dotColor = "#f59e0b";
              else if (act.action_type.includes("reject")) dotColor = "#ef4444";

              return (
                <li key={act.id || i} className="dash-activity-item">
                  <div className="dash-activity-left">
                    <IconDot color={dotColor} />
                    <span className="dash-activity-text">{act.description}</span>
                  </div>
                  <span className="dash-activity-time">{timeAgo(act.created_at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="dash-empty-state">
            <div className="dash-empty-icon">
              <IconBellOff />
            </div>
            <p className="dash-empty-title">No activity yet</p>
            <p className="dash-empty-sub">Your recent actions — bids, updates, submissions — will appear here.</p>
          </div>
        )}
      </div>

      {/* ── MODALS ─────────────────────────────────────── */}
      {isUpdateProgressOpen && (
        <div className="modal-overlay" onClick={() => setIsUpdateProgressOpen(false)}>
          <div className="modal-content dash-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsUpdateProgressOpen(false)}>×</button>
            <h2 className="dash-modal-title">Update Milestones</h2>
            <p className="dash-modal-sub">Click a milestone to cycle through its status.</p>

            <ul className="dash-milestone-list" style={{ marginBottom: "20px" }}>
              {milestones.map(m => (
                <li key={m.id} className="dash-milestone-item dash-milestone-clickable" onClick={() => handleToggleMilestone(m.id, m.status)}>
                  <div className="dash-milestone-left">
                    <IconDot color={STATUS_COLORS[m.status] || "#6b6b7a"} />
                    <span className={m.status === "completed" ? "dash-milestone-done" : ""}>{m.title}</span>
                  </div>
                  <span className="dash-milestone-status" style={{ color: STATUS_COLORS[m.status] }}>
                    {m.status === "completed" ? "Done" : m.status === "in_progress" ? "In progress" : "To do"}
                  </span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddMilestone} className="dash-modal-form">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={e => setNewMilestoneTitle(e.target.value)}
                placeholder="New milestone title…"
                className="dash-modal-input"
                required
              />
              <button type="submit" className="dash-btn-accent-sm">
                <IconPlus /> Add
              </button>
            </form>
          </div>
        </div>
      )}

      {isSubmitWorkOpen && (
        <div className="modal-overlay" onClick={() => setIsSubmitWorkOpen(false)}>
          <div className="modal-content dash-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsSubmitWorkOpen(false)}>×</button>
            <h2 className="dash-modal-title">Submit Deliverables</h2>
            <p className="dash-modal-sub">Share a link to your final files. This marks the project as "Awaiting Review."</p>

            <form onSubmit={handleSubmitWork} className="bid-form">
              <div className="form-group">
                <label>Figma / GitHub / Drive Link</label>
                <input type="url" required placeholder="https://…" value={deliverableLink} onChange={e => setDeliverableLink(e.target.value)} />
              </div>
              <button type="submit" className="submit-bid-btn">
                <IconSend /> Submit Work
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
