import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import HamburgerMenu from "./HamburgerMenu";
import "./Header.css";
import { type JSX } from "react";
const DASHBOARD_PATHS = ["/dashboard", "/find-work", "/proposals", "/post-work", "/client-bids", "/client-projects", "/messages", "/profile", "/milestones", "/payments", "/reviews", "/notifications"];

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export default function Header(): JSX.Element | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
        fetchUnreadCount(user.id);
        setupRealtimeNotifications(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
        fetchUnreadCount(session.user.id);
      } else {
        setProfile(null);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Refetch unread count when navigating away from notifications page
  useEffect(() => {
    if (location.pathname !== "/notifications") {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) fetchUnreadCount(user.id);
      });
    }
  }, [location.pathname]);

  const fetchUnreadCount = async (userId: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const setupRealtimeNotifications = (userId: string) => {
    supabase
      .channel("header-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        setUnreadCount(prev => prev + 1);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchUnreadCount(userId);
      })
      .subscribe();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isDashboard = DASHBOARD_PATHS.some(p => location.pathname.startsWith(p));
  const isPublicLanding = location.pathname === "/";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  if (isAuthPage) return null;

  return (
    <>
      <header className={`header ${scrolled ? "header--scrolled" : ""} ${isDashboard ? "header--dashboard" : "header--public"}`}>
        {/* Logo */}
        <div className="header-logo" onClick={() => navigate("/")}>
          <Logo />
        </div>

        {/* Center nav — public */}
        {isPublicLanding && (
          <nav className="nav-center nav-public">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#stats" className="nav-link">Stats</a>
          </nav>
        )}

        {/* Center nav — dashboard */}
        {isDashboard && (
          <nav className="nav-center">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>Dashboard</NavLink>
            {profile?.role === "freelancer" && (
              <>
                <NavLink to="/find-work" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>Find Work</NavLink>
                <NavLink to="/proposals" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>My Proposals</NavLink>
              </>
            )}
            {profile?.role === "client" && (
              <>
                <NavLink to="/post-work" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>Post Work</NavLink>
                <NavLink to="/client-bids" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>Manage Bids</NavLink>
                <NavLink to="/client-projects" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>Projects</NavLink>
              </>
            )}
            <NavLink to="/messages" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>Messages</NavLink>
          </nav>
        )}

        {/* Right actions */}
        <div className="header-actions">
          <ThemeToggle />

          {isPublicLanding && (
            <>
              <button className="header-btn-ghost" onClick={() => navigate("/login")}>Login</button>
              <button className="header-btn-primary" onClick={() => navigate("/signup")}>Get Started ↗</button>
            </>
          )}

          {isDashboard && profile && (
            <>
              {/* Notification Bell */}
              <button
                className="header-bell-btn"
                onClick={() => navigate("/notifications")}
                aria-label="Notifications"
                style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <IconBell />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "0px",
                    right: "0px",
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "700",
                    borderRadius: "10px",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <NavLink to="/profile" className="header-user-chip">
                <span className="header-avatar">{profile.full_name?.charAt(0)}</span>
                <span className="header-username desktop-only">{profile.full_name}</span>
              </NavLink>
              <button className="header-btn-ghost desktop-only" onClick={handleLogout}>Logout</button>

              {/* Hamburger (mobile only) */}
              <button
                className="hamburger-btn mobile-only"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
              >
                <span className="hamburger-bar" />
                <span className="hamburger-bar" />
                <span className="hamburger-bar hamburger-bar--short" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile slide-in menu */}
      {isDashboard && (
        <HamburgerMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          profile={profile}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}