import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./DashboardStyles.css";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const diffMs = new Date().getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString();
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  bid_accepted:   { icon: "✅", color: "#22c55e" },
  bid_rejected:   { icon: "❌", color: "#ef4444" },
  new_bid:        { icon: "📨", color: "#3b82f6" },
  work_submitted: { icon: "📦", color: "#f59e0b" },
  payment:        { icon: "💰", color: "#a855f7" },
  review:         { icon: "⭐", color: "#f59e0b" },
  message:        { icon: "💬", color: "#06b6d4" },
  default:        { icon: "🔔", color: "#6b7280" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
    setupRealtime();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  };

  const setupRealtime = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getMeta = (type: string) => TYPE_META[type] || TYPE_META["default"];

  if (loading) return <div className="dashboard-grid-page"><p style={{ padding: "40px" }}>Loading notifications...</p></div>;

  return (
    <div className="dashboard-grid-page">
      {/* Header */}
      <div className="dash-header-profile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <p style={{ color: "#888", fontSize: "14px", margin: "4px 0 0" }}>
              {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn-outline" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", margin: "16px 0 24px" }}>
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 18px",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: filter === f ? "#6366f1" : "rgba(255,255,255,0.1)",
              background: filter === f ? "rgba(99,102,241,0.15)" : "transparent",
              color: filter === f ? "#818cf8" : "#888",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: filter === f ? "600" : "400",
              transition: "all 0.2s",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "unread" && unreadCount > 0 && (
              <span style={{
                marginLeft: "6px",
                background: "#6366f1",
                color: "#fff",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "11px",
              }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <div className="panel-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</p>
          <p style={{ color: "#888" }}>
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((n) => {
            const meta = getMeta(n.type);
            return (
              <div
                key={n.id}
                className="panel-card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "16px 20px",
                  borderLeft: `3px solid ${n.is_read ? "transparent" : meta.color}`,
                  opacity: n.is_read ? 0.65 : 1,
                  transition: "all 0.2s",
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                {/* Icon */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: `${meta.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  flexShrink: 0,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <p style={{
                      fontWeight: n.is_read ? "400" : "600",
                      color: n.is_read ? "#aaa" : "#fff",
                      fontSize: "14px",
                      margin: 0,
                    }}>{n.title}</p>
                    <span style={{ color: "#555", fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p style={{ color: "#888", fontSize: "13px", margin: "4px 0 0" }}>{n.message}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div style={{
                    width: "8px", height: "8px",
                    borderRadius: "50%",
                    background: meta.color,
                    flexShrink: 0,
                    marginTop: "6px",
                  }} />
                )}

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  style={{
                    position: "absolute", top: "10px", right: "12px",
                    background: "none", border: "none",
                    color: "#444", cursor: "pointer", fontSize: "16px",
                    padding: "2px 6px", borderRadius: "4px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#444")}
                  title="Delete"
                >×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}