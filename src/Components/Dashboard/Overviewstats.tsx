import "./OverviewStats.css";

export default function OverviewStats(): JSX.Element {
  return (
    <section className="overview-section">
      <div className="overview-card">
        <span className="overview-label">Earnings</span>
        <span className="overview-value">$2,450</span>
      </div>

      <div className="overview-card">
        <span className="overview-label">Active Jobs</span>
        <span className="overview-value">5</span>
      </div>

      <div className="overview-card">
        <span className="overview-label">Open Bids</span>
        <span className="overview-value">12</span>
      </div>

      <div className="overview-card">
        <span className="overview-label">Messages</span>
        <span className="overview-value">3</span>
      </div>
    </section>
  );
}
