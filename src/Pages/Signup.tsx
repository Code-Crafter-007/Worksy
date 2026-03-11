// src/pages/Signup.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function Signup(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'client' | 'freelancer'>("freelancer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) throw error;

      alert("Signup successful! Please log in.");
      navigate("/");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">
          Enter your details below to create a WORKSY account
        </p>

        <label className="auth-label">Full Name</label>
        <input
          type="text"
          placeholder="John Doe"
          className="auth-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label className="auth-label">Role</label>
        <select
          className="auth-input"
          value={role}
          onChange={(e) => setRole(e.target.value as 'client' | 'freelancer')}
        >
          <option value="freelancer">Freelancer</option>
          <option value="client">Client</option>
        </select>

        <label className="auth-label">Email</label>
        <input
          type="email"
          placeholder="m@example.com"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="auth-label">Password</label>
        <input
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="auth-label">Confirm Password</label>
        <input
          type="password"
          className="auth-input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button onClick={handleSignup} className="auth-btn primary" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>

        <button className="auth-btn outline" disabled>
          Sign up with Google
        </button>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
