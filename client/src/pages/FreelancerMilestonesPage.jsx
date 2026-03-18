import Card from '../components/Card';
import PhaseBadge from '../components/PhaseBadge';

export default function FreelancerMilestonesPage() {
  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[900px] space-y-5 px-5 sm:px-8">
        <Card>
          <p className="worksy-kicker">Freelancer Milestones</p>
          <h1 className="worksy-title">My Milestones</h1>
          <p className="mt-3 text-sm text-[color:var(--text-muted)]">
            Freelancer milestone list and completion requests are intentionally routed now and enabled in Phase 3.
          </p>
        </Card>
        <PhaseBadge phase="Phase 3" text="Milestone execution is deferred even though route-level UX is available." />
      </div>
    </section>
  );
}
