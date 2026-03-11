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
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data));
      }
    });
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
        {profile && <span className="user-name">{profile.full_name}</span>}
        <button className="dash-login-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
