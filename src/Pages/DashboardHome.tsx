import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Dashboard from "./Dashboard.tsx";
import ClientDashboard from "./ClientDashboard.tsx";
import "./Dashboard.css";

function PageSpinner() {
  return (
    <div className="dash-page">
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "80px 0", color: "var(--text-muted)", fontSize: "14px" }}>
        <div style={{ width: "22px", height: "22px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "fw-spin 0.7s linear infinite" }} />
        Loading your dashboard…
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"client" | "freelancer" | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (isMounted) { setRole(null); setLoading(false); } return; }
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (isMounted) { setRole(data?.role === "client" ? "client" : "freelancer"); setLoading(false); }
    };
    loadRole();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <PageSpinner />;
  if (role === "client") return <ClientDashboard />;
  return <Dashboard />;
}
