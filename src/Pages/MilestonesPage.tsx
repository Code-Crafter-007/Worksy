import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./DashboardStyles.css";

interface Milestone {
  id: string;
  proposal_id: string;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "completed";
  due_date: string | null;
  created_at: string;
}

interface ActiveProposal {
  id: string;
  bid_amount: number;
  work_status: string;
  status: string;
  freelancer_id: string;
  job?: { title: string; client_id: string };
  freelancer?: { full_name: string };
}

const STATUS_ORDER = ["not_started", "in_progress", "completed"] as const;

const STATUS_META = {
  not_started: { label: "To Do",      color: "#6b7280", bg: "rgba(107,114,128,0.12)", dot: "bg-gray" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", dot: "bg-blue" },
  completed:   { label: "Done",        color: "#22c55e", bg: "rgba(34,197,94,0.12)",  dot: "bg-green" },
};

export default function MilestonesPage() {
  const [proposals, setProposals] = useState<ActiveProposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("freelancer");
  const [loading, setLoading] = useState(true);
  const [milestonesLoading, setMilestonesLoading] = useState(false);

  // Add form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  const progress = milestones.length === 0 ? 0
    : Math.round((milestones.filter(m => m.status === "completed").length / milestones.length) * 100);

  useEffect(() => { fetchProposals(); }, []);

  useEffect(() => {
    if (selectedProposalId) fetchMilestones(selectedProposalId);
  }, [selectedProposalId]);

  const fetchProposals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = prof?.role || "freelancer";
    setUserRole(role);

    let q;
    if (role === "freelancer") {
      q = supabase
        .from("proposals")
        .select("*, job:jobs(title, client_id)")
        .eq("freelancer_id", user.id)
        .eq("status", "accepted")
        .neq("work_status", "completed");
    } else {
      q = supabase
        .from("proposals")
        .select("*, job:jobs!inner(title, client_id), freelancer:profiles!proposals_freelancer_id_fkey(full_name)")
        .eq("status", "accepted")
        .eq("jobs.client_id", user.id)
        .neq("work_status", "completed");
    }

    const { data } = await q;
    if (data) {
      setProposals(data);
      if (data.length > 0) setSelectedProposalId(data[0].id);
    }
    setLoading(false);
  };

  const fetchMilestones = async (proposalId: string) => {
    setMilestonesLoading(true);
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: true });
    if (data) setMilestones(data);
    setMilestonesLoading(false);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedProposalId) return;
    setAdding(true);

    const { data, error } = await supabase.from("milestones").insert([{
      proposal_id: selectedProposalId,
      title: newTitle,
      description: newDesc || null,
      due_date: newDue || null,
      status: "not_started",
    }]).select().single();

    if (error) alert("Error: " + error.message);
    else {
      setMilestones(prev => [...prev, data]);

      // Notify the other party
      const proposal = proposals.find(p => p.id === selectedProposalId);
      if (proposal) {
        const notifyId = userRole === "freelancer" ? proposal.job?.client_id : proposal.freelancer_id;
        if (notifyId) {
          await supabase.from("notifications").insert([{
            user_id: notifyId,
            type: "milestone",
            title: "New Milestone Added 📋",
            message: `A new milestone "${newTitle}" was added to "${proposal.job?.title}".`,
          }]);
        }
      }

      setNewTitle(""); setNewDesc(""); setNewDue("");
      setShowAddForm(false);
    }
    setAdding(false);
  };

  const handleCycleStatus = async (milestone: Milestone) => {
    if (userRole === "client") return; // only freelancer changes status
    const currentIdx = STATUS_ORDER.indexOf(milestone.status);
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length];

    const { error } = await supabase
      .from("milestones")
      .update({ status: nextStatus })
      .eq("id", milestone.id);

    if (!error) {
      setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, status: nextStatus } : m));

      // Log activity
      if (nextStatus === "completed") {
        await supabase.from("activity_logs").insert([{
          user_id: userId,
          action_type: "milestone_completed",
          description: `Milestone "${milestone.title}" marked as completed.`,
        }]);

        // Notify client
        const proposal = proposals.find(p => p.id === selectedProposalId);
        if (proposal?.job?.client_id) {
          await supabase.from("notifications").insert([{
            user_id: proposal.job.client_id,
            type: "milestone",
            title: "Milestone Completed ✅",
            message: `"${milestone.title}" on "${proposal.job.title}" is marked done!`,
          }]);
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    await supabase.from("milestones").delete().eq("id", id);
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

  if (loading) return <div className="dashboard-grid-page"><p style={{ padding: "40px" }}>Loading...</p></div>;

  return (
      <div className="dashboard-grid-page" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div className="dash-header-profile">
        <h2>Milestones</h2>
        <p style={{ color: "#888", fontSize: "14px", margin: "4px 0 0" }}>
          Track deliverables and project checkpoints
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "40px", marginBottom: "12px" }}>📋</p>
          <p style={{ color: "#888" }}>No active projects to manage milestones for.</p>
        </div>
      ) : (
        <>
          {/* Project selector (if multiple) */}
          {proposals.length > 1 && (
            <div style={{ marginBottom: "20px" }}>
              <p className="section-label">SELECT PROJECT</p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {proposals.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProposalId(p.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: selectedProposalId === p.id ? "#6366f1" : "rgba(255,255,255,0.1)",
                      background: selectedProposalId === p.id ? "rgba(99,102,241,0.15)" : "transparent",
                      color: selectedProposalId === p.id ? "#818cf8" : "#aaa",
                      cursor: "pointer",
                      fontSize: "13px",
                      transition: "all 0.2s",
                    }}
                  >
                    {p.job?.title || p.id.slice(0, 8)}
                    {userRole === "client" && p.freelancer && (
                      <span style={{ color: "#555", marginLeft: "6px" }}>· {p.freelancer.full_name}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project info + progress */}
          {selectedProposal && (
            <div className="panel-card" style={{ padding: "20px 24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>{selectedProposal.job?.title}</h3>
                  {userRole === "client" && selectedProposal.freelancer && (
                    <p style={{ color: "#888", fontSize: "13px", margin: "4px 0 0" }}>
                      Freelancer: {selectedProposal.freelancer.full_name}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>Overall progress</p>
                  <p style={{ color: progress === 100 ? "#22c55e" : "#818cf8", fontWeight: "700", fontSize: "22px", margin: "2px 0 0" }}>
                    {progress}%
                  </p>
                </div>
              </div>
              <div className="progress-bar-bg" style={{ marginTop: "14px" }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progress}%`,
                    background: progress === 100 ? "#22c55e" : undefined,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p style={{ color: "#666", fontSize: "12px", marginTop: "6px" }}>
                {milestones.filter(m => m.status === "completed").length} of {milestones.length} milestones completed
              </p>
            </div>
          )}

          {/* Milestones list */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <p className="section-label" style={{ margin: 0 }}>MILESTONES</p>
            <button
              className="btn-outline"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ fontSize: "13px", padding: "6px 14px" }}
            >
              {showAddForm ? "Cancel" : "+ Add Milestone"}
            </button>
          </div>

          {/* Add milestone form */}
          {showAddForm && (
            <div className="panel-card" style={{ padding: "20px", marginBottom: "16px" }}>
              <form onSubmit={handleAddMilestone} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Milestone title, e.g. Wireframes"
                  className="filter-input"
                  required
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="filter-input"
                />
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="date"
                    value={newDue}
                    onChange={e => setNewDue(e.target.value)}
                    className="filter-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="submit-bid-btn"
                    style={{ width: "auto", padding: "10px 20px" }}
                    disabled={adding}
                  >
                    {adding ? "Adding..." : "+ Add"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {milestonesLoading ? (
            <p style={{ color: "#888" }}>Loading milestones...</p>
          ) : milestones.length === 0 ? (
            <div className="panel-card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "#888" }}>No milestones yet. Add one above to start tracking!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {milestones.map(m => {
                const meta = STATUS_META[m.status];
                const isOverdue = m.due_date && m.status !== "completed" && new Date(m.due_date) < new Date();
                return (
                  <div
                    key={m.id}
                    className="panel-card"
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      borderLeft: `3px solid ${meta.color}`,
                    }}
                  >
                    {/* Status dot / toggle */}
                    <button
                      onClick={() => handleCycleStatus(m)}
                      title={userRole === "freelancer" ? "Click to change status" : ""}
                      style={{
                        width: "28px", height: "28px",
                        borderRadius: "50%",
                        background: meta.bg,
                        border: `2px solid ${meta.color}`,
                        cursor: userRole === "freelancer" ? "pointer" : "default",
                        flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px",
                        transition: "all 0.2s",
                        marginTop: "2px",
                      }}
                    >
                      {m.status === "completed" ? "✓" : m.status === "in_progress" ? "▶" : "○"}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <p style={{
                          fontWeight: "600",
                          color: m.status === "completed" ? "#666" : "#fff",
                          textDecoration: m.status === "completed" ? "line-through" : "none",
                          margin: 0,
                          fontSize: "14px",
                        }}>{m.title}</p>
                        <span style={{
                          padding: "3px 10px", borderRadius: "12px",
                          fontSize: "11px", fontWeight: "600",
                          color: meta.color, background: meta.bg,
                          whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {meta.label}
                        </span>
                      </div>

                      {m.description && (
                        <p style={{ color: "#888", fontSize: "13px", margin: "4px 0 0" }}>{m.description}</p>
                      )}

                      {m.due_date && (
                        <p style={{
                          fontSize: "12px",
                          color: isOverdue ? "#ef4444" : "#666",
                          margin: "4px 0 0",
                        }}>
                          {isOverdue ? "⚠ Overdue · " : "Due "}
                          {new Date(m.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Delete (freelancer only) */}
                    {userRole === "freelancer" && m.status === "not_started" && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        style={{
                          background: "none", border: "none",
                          color: "#444", cursor: "pointer",
                          fontSize: "18px", padding: "0 4px",
                          transition: "color 0.2s", flexShrink: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#444")}
                        title="Delete"
                      >×</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Freelancer hint */}
          {userRole === "freelancer" && milestones.length > 0 && (
            <p style={{ color: "#555", fontSize: "12px", marginTop: "14px", textAlign: "center" }}>
              💡 Click the circle on any milestone to cycle its status: To Do → In Progress → Done
            </p>
          )}
        </>
      )}
    </div>
  );
}