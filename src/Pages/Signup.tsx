import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ThemeToggle from "../Components/ThemeToggle";
import "./Auth.css";

export default function Signup(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "freelancer">("freelancer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirm) { alert("Passwords do not match"); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
      alert("Signup successful! Please log in.");
      navigate("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout auth-layout--signup">
      {/* Left brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-badge">WORKSY — FREELANCER PLATFORM</div>
          <h1 className="auth-brand-headline">
            Got a skill?<br />
            <em>Find clients</em> who<br />
            <span className="auth-keyword">need you.</span>
          </h1>
          <p className="auth-brand-sub">
            Join 840+ freelancers already winning projects on Worksy. Sign up free and start bidding in minutes.
          </p>
          <div className="auth-brand-stats">
            <div className="auth-stat"><strong>₹2.4M</strong><span>Paid to Freelancers</span></div>
            <div className="auth-stat"><strong>10+</strong><span>Categories</span></div>
            <div className="auth-stat"><strong>840+</strong><span>Active Users</span></div>
          </div>
        </div>
        <div className="auth-brand-glow" aria-hidden="true" />
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-top">
          <Link to="/" className="auth-back-link">← Back to home</Link>
          <ThemeToggle />
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join Worksy — it's completely free.</p>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-name">Full Name</label>
            <input id="signup-name" type="text" placeholder="John Doe" className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="auth-field">
            <label className="auth-label">I am a…</label>
            <div className="auth-role-toggle">
              <button
                type="button"
                className={`role-btn ${role === "freelancer" ? "role-btn--active" : ""}`}
                onClick={() => setRole("freelancer")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Freelancer
              </button>
              <button
                type="button"
                className={`role-btn ${role === "client" ? "role-btn--active" : ""}`}
                onClick={() => setRole("client")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/>
                  <line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
                Client
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-email">Email</label>
            <input id="signup-email" type="email" placeholder="m@example.com" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="auth-fields-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
              <input id="signup-confirm" type="password" className="auth-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>

          <button id="signup-submit-btn" onClick={handleSignup} className="auth-btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Create Free Account ↗"}
          </button>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
