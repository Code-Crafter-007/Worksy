import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import PhaseBadge from '../components/PhaseBadge';

export default function FreelancerMessagesPage() {
  const { projectId } = useParams();

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[900px] space-y-5 px-5 sm:px-8">
        <Card>
          <p className="worksy-kicker">Freelancer Messages</p>
          <h1 className="worksy-title">Project Chat {projectId}</h1>
          <p className="mt-3 text-sm text-[color:var(--text-muted)]">Message thread shell is available. Real-time delivery begins in Phase 4.</p>
        </Card>
        <PhaseBadge phase="Phase 4" text="Messaging behavior is intentionally disabled for Phase 2 scope." />
      </div>
    </section>
  );
}
