import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./HamburgerMenu.css";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onLogout: () => void;
}

export default function HamburgerMenu({ isOpen, onClose, profile, onLogout }: HamburgerMenuProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mob-backdrop ${isOpen ? "mob-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <nav className={`mob-menu ${isOpen ? "mob-menu--open" : ""}`} aria-label="Mobile navigation">
        <div className="mob-header">
          <span className="mob-title">WORKSY</span>
          <button className="mob-close" onClick={onClose} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="mob-links">
          <NavLink to="/dashboard" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
            Dashboard
          </NavLink>
          {profile?.role === "freelancer" && (
            <>
              <NavLink to="/find-work" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
                Find Work
              </NavLink>
              <NavLink to="/proposals" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
                My Proposals
              </NavLink>
            </>
          )}
          {profile?.role === "client" && (
            <>
              <NavLink to="/post-work" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
                Post Work
              </NavLink>
              <NavLink to="/client-bids" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
                Manage Bids
              </NavLink>
              <NavLink to="/client-projects" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
                Accepted Projects
              </NavLink>
            </>
          )}
          <NavLink to="/messages" className={({ isActive }) => `mob-link ${isActive ? "mob-link--active" : ""}`} onClick={onClose}>
            Messages
          </NavLink>
        </div>

        {profile && (
          <div className="mob-footer">
            <NavLink to="/profile" className="mob-profile-link" onClick={onClose}>
              <div className="mob-avatar">{profile.full_name?.charAt(0)}</div>
              <div>
                <div className="mob-profile-name">{profile.full_name}</div>
                <div className="mob-profile-role">{profile.role}</div>
              </div>
            </NavLink>
            <button className="mob-logout" onClick={() => { onLogout(); onClose(); }}>Logout</button>
          </div>
        )}
      </nav>
    </>
  );
}
