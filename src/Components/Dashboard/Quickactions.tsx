import { type JSX } from "react";
import "./QuickActions.css";

export default function QuickActions(): JSX.Element {
  return (
    <section className="quick-actions">
      <button className="quick-btn">Post a Job</button>
      <button className="quick-btn">Browse Jobs</button>
      <button className="quick-btn">My Bids</button>
      <button className="quick-btn">Messages</button>
    </section>
  );
}
