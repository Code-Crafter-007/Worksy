import { type JSX } from "react";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

export default function HomePage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Background SVG Canvas */}
      <div className="doodle-layer">
        {/* Star Sparkle */}
        <svg className="doodle doodle-star" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="#ffb86c" />
        </svg>

        {/* Lower Right Sparkle */}
        <svg className="doodle doodle-star-right" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="#9381ff" />
        </svg>

        {/* Floating Laptop */}
        <svg className="doodle doodle-laptop" viewBox="0 0 100 80" fill="none" stroke="#8be9fd" strokeWidth="2" strokeLinejoin="round">
          <rect x="10" y="20" width="80" height="45" rx="4" />
          <path d="M5 65 L95 65 L80 75 L20 75 Z" />
          <line x1="20" y1="35" x2="80" y2="35" />
          <line x1="20" y1="45" x2="60" y2="45" strokeWidth="3" fill="none"/>
        </svg>

        {/* Floating Database / Coins */}
        <svg className="doodle doodle-db" viewBox="0 0 60 80" fill="none" stroke="#50fa7b" strokeWidth="2">
          <ellipse cx="30" cy="20" rx="25" ry="10" />
          <path d="M5 20 V40 C5 45.5 16.2 50 30 50 C43.8 50 55 45.5 55 40 V20" />
          <path d="M5 40 V60 C5 65.5 16.2 70 30 70 C43.8 70 55 65.5 55 60 V40" />
          <text x="26" y="24" fontSize="12" fill="#50fa7b" stroke="none">₹</text>
        </svg>

        {/* Floating Target / Gear */}
        <svg className="doodle doodle-target" viewBox="0 0 40 40" fill="none" stroke="#6272a4" strokeWidth="2" strokeLinejoin="round">
          <circle cx="20" cy="20" r="10" />
          <path d="M20 5 L20 2 M20 38 L20 35 M5 20 L2 20 M38 20 L35 20 M9.5 9.5 L7 7 M33 33 L30.5 30.5 M9.5 30.5 L7 33 M33 7 L30.5 9.5" />
        </svg>
      </div>

      {/* Oversized background glow */}
      <div className="bg-glow-purple"></div>

      <header className="hero-section">
        <div className="hero-badge-wrapper">
          <div className="hero-badge">WORKSY — FREELANCER DASHBOARD</div>
          <svg className="doodle-check" viewBox="0 0 40 40" fill="none" stroke="#50fa7b" strokeWidth="2" strokeDasharray="4 4">
            <circle cx="20" cy="20" r="18" />
            <path d="M12 20 L18 26 L28 14" strokeWidth="3" strokeDasharray="none" strokeLinecap="round" />
          </svg>
        </div>
        
        <h1 className="hero-title">
          Your work, <span className="text-glow-purple">tracked.</span><br/>
          Your bids, <span className="text-glow-green">winning.</span>
        </h1>
        
        <p className="hero-subtitle">
          Worksy connects skill with opportunity — then makes sure<br/>
          the work actually gets done.
        </p>

        <div className="hero-buttons">
          <button className="btn-primary-purple" onClick={() => navigate("/find-work")}>Find work ↗</button>
          <button className="btn-secondary-dark" onClick={() => navigate("/dashboard")}>View dashboard</button>
        </div>
      </header>

      <div className="stats-divider-wrapper">
         <div className="stats-divider"></div>
         {/* Arrow pointing to delivery */}
         <svg className="doodle-arrow" viewBox="0 0 50 30" fill="none" stroke="#ff79c6" strokeWidth="2" strokeLinecap="round">
            <path d="M5 25 Q25 5 45 20" />
            <path d="M45 20 L38 20 M45 20 L42 12" />
         </svg>
      </div>

      <section className="stats-row">
        <div className="stat-col">
          <h3>1,240+</h3>
          <p>Active projects</p>
        </div>
        <div className="stat-col">
          <h3>840+</h3>
          <p>Freelancers</p>
        </div>
        <div className="stat-col">
          <h3>₹2.4M</h3>
          <p>Paid out</p>
        </div>
        <div className="stat-col stat-highlight">
          <h3>97%</h3>
          <p>On-time delivery</p>
        </div>
      </section>
    </div>
  );
}
