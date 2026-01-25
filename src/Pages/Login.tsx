// src/pages/Login.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Auth.css";

export default function Login(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/dashboard"); // change later if needed
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Login to your account</h2>
        <p className="auth-subtitle">
          Enter your email below to login to your account
        </p>

        <label className="auth-label">Email</label>
        <input
          type="email"
          placeholder="m@example.com"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="auth-row">
          <label className="auth-label">Password</label>
          <span className="auth-link">Forgot your password?</span>
        </div>
        <input
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} className="auth-btn primary">
          Login
        </button>

        <button className="auth-btn outline" disabled>
          Login with Google
        </button>

        <p className="auth-footer">
          Don’t have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
