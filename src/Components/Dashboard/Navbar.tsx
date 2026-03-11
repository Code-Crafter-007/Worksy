import type { JSX } from "react";
import "./Navbar.css";

export default function DashboardNavbar(): JSX.Element {
  return (
    <nav className="dash-nav">
      {/* Left */}
      <div className="dash-nav-left">
        <span className="dash-brand"></span>
      </div>

      {/* Center */}
      <div className="dash-nav-center">
        <span className="dash-link">Dashboard</span>
        <span className="dash-link">Jobs</span>
        <span className="dash-link">Bids</span>
        <span className="dash-link">Messages</span>
      </div>

      {/* Right */}
      <div className="dash-nav-right">
        <button className="dash-login-btn">Login</button>
      </div>
    </nav>
  );
}
