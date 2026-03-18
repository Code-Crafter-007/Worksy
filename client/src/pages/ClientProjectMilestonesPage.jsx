import { useParams } from 'react-router-dom';
import Card from '../components/Card';
import PhaseBadge from '../components/PhaseBadge';

export default function ClientProjectMilestonesPage() {
  const { projectId } = useParams();

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[900px] space-y-5 px-5 sm:px-8">
        <Card>
          <p className="worksy-kicker">Client Milestones</p>
          <h1 className="worksy-title">Project {projectId}</h1>
          <p className="mt-3 text-sm text-[color:var(--text-muted)]">
            Milestone design is ready for create/edit/delete/approve/reject. Backend lifecycle will be enabled in Phase 3.
          </p>
        </Card>
        <PhaseBadge phase="Phase 3" text="Milestone workflow UI is complete, but server execution is intentionally deferred." />
      </div>
    </section>
  );
}
