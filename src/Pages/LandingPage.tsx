import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./LandingPage.css";
import { type JSX } from "react";

gsap.registerPlugin(ScrollTrigger);

const FEATURE_ICONS = {
  search: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  clipboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  barChart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  messageCircle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  checkSquare: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

const FEATURES = [
  {
    icon: FEATURE_ICONS.search,
    title: "Find Work",
    desc: "Browse hundreds of live freelance projects filtered by skill, budget, and recency. Apply with a competitive bid in seconds.",
  },
  {
    icon: FEATURE_ICONS.clipboard,
    title: "Post Projects",
    desc: "Clients post detailed job listings and receive proposals from vetted freelancers — all managed in one clean workspace.",
  },
  {
    icon: FEATURE_ICONS.barChart,
    title: "Track Everything",
    desc: "Your personal dashboard shows live bid status, milestones, earnings, and messages — so nothing slips through the cracks.",
  },
  {
    icon: FEATURE_ICONS.messageCircle,
    title: "Real-time Chat",
    desc: "Built-in messaging lets freelancers and clients collaborate smoothly inside the platform without switching tools.",
  },
  {
    icon: FEATURE_ICONS.checkSquare,
    title: "Milestone System",
    desc: "Break projects into milestones with clear delivery dates, keeping both parties aligned throughout the engagement.",
  },
  {
    icon: FEATURE_ICONS.star,
    title: "Smart Recommendations",
    desc: "Worksy matches jobs to your listed skills — surfacing the most relevant opportunities at the top of your feed.",
  },
];

const STATS = [
  { value: "1,240+", label: "Active Projects" },
  { value: "840+",   label: "Freelancers" },
  { value: "₹2.4M",  label: "Paid Out" },
  { value: "97%",    label: "On-time Delivery" },
];

const STEPS = [
  { step: "01", title: "Create your account", desc: "Sign up as a freelancer or client in under a minute." },
  { step: "02", title: "Set up your profile", desc: "Freelancers add skills; clients describe their typical projects." },
  { step: "03", title: "Post or Apply", desc: "Clients post jobs; freelancers discover and bid on them instantly." },
  { step: "04", title: "Collaborate & get paid", desc: "Track milestones, chat in-app, and close every project smoothly." },
];

// Marquee items — duplicated for seamless loop
const MARQUEE_ITEMS = [
  "Find Work", "Post Projects", "Track Milestones", "Real-time Chat",
  "Smart Bids", "Secure Payments", "Freelancer Dashboard", "Client Workspace",
  "Proposal Tracking", "Skill Matching", "Live Notifications", "Collaborate",
];

export default function LandingPage(): JSX.Element {
  const navigate = useNavigate();
  const heroRef    = useRef<HTMLElement>(null);
  const statsRef   = useRef<HTMLElement>(null);
  const featRef    = useRef<HTMLElement>(null);
  const stepsRef   = useRef<HTMLElement>(null);
  const ctaRef     = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(".lp-badge",      { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "back.out(1.4)" });
      gsap.fromTo(".lp-hero-title", { opacity: 0, y: 28 },  { opacity: 1, y: 0, duration: 0.7, delay: 0.35, ease: "power3.out" });
      gsap.fromTo(".lp-hero-sub",   { opacity: 0, y: 20 },  { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: "power2.out" });
      gsap.fromTo(".lp-hero-btns",  { opacity: 0, y: 18 },  { opacity: 1, y: 0, duration: 0.5, delay: 0.65, ease: "power2.out" });
      gsap.fromTo(".lp-side-left",  { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, delay: 0.8 });
      gsap.fromTo(".lp-side-right", { opacity: 0, x: 20 },  { opacity: 1, x: 0, duration: 0.6, delay: 0.8 });

      // Stats counters
      gsap.fromTo(".stat-item", { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.12,
        scrollTrigger: { trigger: statsRef.current, start: "top 82%" },
        ease: "back.out(1.4)"
      });

      // Feature cards stagger
      gsap.fromTo(".feature-card", { opacity: 0, y: 32, scale: 0.97 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.1,
        scrollTrigger: { trigger: featRef.current, start: "top 80%" },
        ease: "power2.out"
      });

      // Steps
      gsap.fromTo(".step-item", { opacity: 0, x: -24 }, {
        opacity: 1, x: 0, duration: 0.5, stagger: 0.13,
        scrollTrigger: { trigger: stepsRef.current, start: "top 80%" },
        ease: "power2.out"
      });

      // CTA
      gsap.fromTo(".lp-cta-inner", { opacity: 0, scale: 0.96, y: 16 }, {
        opacity: 1, scale: 1, y: 0, duration: 0.6,
        scrollTrigger: { trigger: ctaRef.current, start: "top 82%" },
        ease: "back.out(1.2)"
      });
    });

    return () => ctx.revert();
  }, []);

  // Duplicate items for seamless marquee
  const allMarqueeItems = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="lp-root">
      {/* Radial glow overlay */}
      <div className="lp-glow lp-glow-purple" aria-hidden="true" />
      <div className="lp-glow lp-glow-green"  aria-hidden="true" />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="lp-hero" ref={heroRef}>
        {/* Left social rail */}
        <aside className="lp-side lp-side-left" aria-label="Social links">
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="lp-rail-link">GitHub</a>
          <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="lp-rail-link">LinkedIn</a>
          <a href="https://twitter.com/" target="_blank" rel="noreferrer" className="lp-rail-link">Twitter</a>
        </aside>

        {/* Center content */}
        <div className="lp-hero-center">
          {/* Badge */}
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            WORKSY — FREELANCER PLATFORM
          </div>

          {/* Headline */}
          <h1 className="lp-hero-title">
            Your work,{" "}
            <span className="lp-keyword">tracked.</span>
            <br />
            <em className="lp-italic">Your bids,</em>{" "}
            <strong>winning.</strong>
          </h1>

          {/* Subheading */}
          <p className="lp-hero-sub">
            Worksy connects skill with opportunity — then makes sure<br className="lp-br-desktop" />
            the work actually gets done.
          </p>

          {/* CTAs */}
          <div className="lp-hero-btns">
            <button className="lp-btn-primary" id="landing-find-work-btn" onClick={() => navigate("/signup")}>
              Find Work ↗
            </button>
            <button className="lp-btn-ghost" id="landing-login-btn" onClick={() => navigate("/login")}>
              Login to Dashboard
            </button>
          </div>
        </div>

        {/* Right category rail */}
        <aside className="lp-side lp-side-right" aria-label="Platform features">
          <span className="lp-rail-tag">Find Work</span>
          <span className="lp-rail-tag">Post Jobs</span>
          <span className="lp-rail-tag">Track Bids</span>
          <span className="lp-rail-tag">Collaborate</span>
        </aside>

        {/* Floating doodles */}
        <div className="lp-doodles" aria-hidden="true">
          <svg className="lp-doodle lp-doodle-star" viewBox="0 0 24 24" fill="#ffb86c">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
          </svg>
          <svg className="lp-doodle lp-doodle-star2" viewBox="0 0 24 24" fill="#a78bfa">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
          </svg>
          <svg className="lp-doodle lp-doodle-laptop" viewBox="0 0 100 80" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinejoin="round">
            <rect x="10" y="20" width="80" height="45" rx="4"/>
            <path d="M5 65 L95 65 L80 75 L20 75 Z"/>
            <line x1="20" y1="35" x2="80" y2="35"/>
            <line x1="20" y1="45" x2="60" y2="45" strokeWidth="3"/>
          </svg>
          <svg className="lp-doodle lp-doodle-circle" viewBox="0 0 60 60" fill="none" stroke="var(--green)" strokeWidth="2">
            <circle cx="30" cy="30" r="25" strokeDasharray="6 4"/>
            <circle cx="30" cy="30" r="10"/>
          </svg>
        </div>
      </section>

      {/* ── MARQUEE STRIP ────────────────────────────────────── */}
      <div className="lp-marquee-wrap" aria-hidden="true">
        <div className="lp-marquee-track">
          {allMarqueeItems.map((item, i) => (
            <span className="lp-marquee-item" key={i}>
              <span className="lp-marquee-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="lp-stats" id="stats" ref={statsRef}>
        {STATS.map(({ value, label }) => (
          <div className="stat-item" key={label}>
            <span className="stat-value">{value}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </section>

      <div className="lp-divider"><div className="lp-divider-line" /></div>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="lp-features" id="features" ref={featRef}>
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">WHAT YOU GET</p>
          <h2 className="lp-section-title">Everything you need to freelance with confidence</h2>
        </div>
        <div className="features-grid">
          {FEATURES.map(({ icon, title, desc }) => (
            <article className="feature-card panel-card" key={title}>
              <div className="feature-icon feature-icon--svg">{icon}</div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="lp-steps" id="how-it-works" ref={stepsRef}>
        <div className="lp-section-header">
          <p className="lp-section-eyebrow">HOW IT WORKS</p>
          <h2 className="lp-section-title">From signup to paid — in four steps</h2>
        </div>
        <div className="steps-list">
          {STEPS.map(({ step, title, desc }) => (
            <div className="step-item" key={step}>
              <span className="step-number">{step}</span>
              <div>
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section className="lp-cta" ref={ctaRef}>
        <div className="lp-cta-inner panel-card">
          <p className="lp-cta-eyebrow">READY TO START?</p>
          <h2 className="lp-cta-title">Build something<br /><em>remarkable.</em></h2>
          <p className="lp-cta-sub">Join 840+ freelancers and clients already on Worksy.</p>
          <div className="lp-cta-btns">
            <button className="lp-btn-primary" id="cta-signup-btn" onClick={() => navigate("/signup")}>Create Free Account ↗</button>
            <button className="lp-btn-ghost" id="cta-login-btn" onClick={() => navigate("/login")}>Login</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span className="lp-footer-brand">WORKSY</span>
          <span className="lp-footer-copy">© {new Date().getFullYear()} Worksy. All rights reserved.</span>
          <div className="lp-footer-links">
            <button className="lp-footer-link" onClick={() => navigate("/login")}>Login</button>
            <button className="lp-footer-link" onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
