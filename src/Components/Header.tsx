import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import HamburgerMenu from "./HamburgerMenu";
import "./Header.css";

const DASHBOARD_PATHS = ["/dashboard", "/find-work", "/proposals", "/post-work", "/client-bids", "/client-projects", "/messages", "/profile"];

export default function Header(): JSX.Element | null {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scroll-aware header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isDashboard = DASHBOARD_PATHS.some(p => location.pathname.startsWith(p));
  const isPublicLanding = location.pathname === "/";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // Don't render header on auth pages (they have their own nav)
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
