import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Dashboard from "./Dashboard.tsx";
import ClientDashboard from "./ClientDashboard.tsx";

export default function DashboardHome() {
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<"client" | "freelancer" | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                if (isMounted) {
                    setRole(null);
                    setLoading(false);
                }
                return;
            }

            const { data } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (isMounted) {
                setRole(data?.role === "client" ? "client" : "freelancer");
                setLoading(false);
            }
        };

        loadRole();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="dashboard-grid-page">
                <p style={{ padding: "40px" }}>Loading dashboard...</p>
            </div>
        );
    }

    if (role === "client") {
        return <ClientDashboard />;
    }

    return <Dashboard />;
}
