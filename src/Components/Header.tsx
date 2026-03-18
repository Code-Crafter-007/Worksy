import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./Logo";
import "./Header.css";

export default function Header(): JSX.Element | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Only show full header on dashboard pages
  const isDashboardPages = ["/dashboard", "/find-work", "/proposals", "/messages"].some(path => location.pathname.startsWith(path));

  if (!isDashboardPages) return null;

  return (
    <header className="header">
      <Logo />

      <div className="nav-center">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>
        {profile?.role === 'freelancer' && <NavLink to="/find-work" className={({ isActive }) => isActive ? "active" : ""}>Find Work</NavLink>}
        {profile?.role === 'freelancer' && <NavLink to="/proposals" className={({ isActive }) => isActive ? "active" : ""}>My Proposals</NavLink>}
        <NavLink to="/messages" className={({ isActive }) => isActive ? "active" : ""}>Messages</NavLink>
      </div>

      <div className="dash-user-actions">
        {profile && (
          <NavLink to="/profile" style={{ textDecoration: 'none' }}>
            <span className="user-name" style={{ cursor: 'pointer' }}>
              {profile.full_name} {profile.role ? `(${profile.role})` : ""}
            </span>
          </NavLink>
        )}
        <button className="dash-login-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
