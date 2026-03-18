import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import PhaseBadge from '../components/PhaseBadge';

export default function ClientMessagesPage() {
  const { projectId } = useParams();

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[900px] space-y-5 px-5 sm:px-8">
        <Card>
          <p className="worksy-kicker">Client Messages</p>
          <h1 className="worksy-title">Project Chat {projectId}</h1>
          <p className="mt-3 text-sm text-[color:var(--text-muted)]">Real-time messaging screen is designed and routed. Live socket messaging starts in Phase 4.</p>
        </Card>
        <PhaseBadge phase="Phase 4" text="Messaging route exists for role separation, but real-time behavior starts later." />
      </div>
    </section>
  );
}
