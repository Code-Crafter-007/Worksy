import { useNavigate } from "react-router-dom"

export default function HomePage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Worksy</h1>
        <p>A freelance bidding platform built for structured execution</p>

        <div className="hero-actions">
          <button onClick={() => navigate("/login")}>
            Post a Project
          </button>
          <button onClick={() => navigate("/login")}>
            Find Work
          </button>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <ul>
          <li>Clients post projects with clear requirements</li>
          <li>Freelancers bid with price and timeline</li>
          <li>Work progresses through tracked milestones</li>
        </ul>
      </section>

      <section className="why-worksy">
        <h2>Why Worksy</h2>
        <ul>
          <li>Milestone-based execution</li>
          <li>Transparent progress tracking</li>
          <li>Accountability for everyone</li>
        </ul>
      </section>

      <section className="roles">
        <div>
          <h3>For Clients</h3>
          <p>Post work, compare bids, track delivery</p>
        </div>

        <div>
          <h3>For Freelancers</h3>
          <p>Find projects, bid fairly, work with clarity</p>
        </div>
      </section>

      <section className="cta">
        <h2>Start with Worksy</h2>
        <button onClick={() => navigate("/login")}>
          Get Started
        </button>
      </section>
    </div>
  )
}
