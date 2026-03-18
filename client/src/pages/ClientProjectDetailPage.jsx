import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { getProjectById } from '../services/projectService';
import { formatDisplayDate } from '../utils/formatDate';
import { formatRupees } from '../utils/formatCurrency';

export default function ClientProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    getProjectById(projectId).then(setProject).catch(() => setProject(null));
  }, [projectId]);

  if (!project) {
    return <div className="py-24 text-center text-sm text-[color:var(--text-muted)]">Project not found.</div>;
  }

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1000px] px-5 sm:px-8">
        <Card className="space-y-5">
          <div>
            <p className="worksy-kicker">Client Project Detail</p>
            <h1 className="worksy-title">{project.title}</h1>
          </div>
          <p className="text-sm text-[color:var(--text-muted)]">{project.description}</p>

          <div className="grid gap-3 sm:grid-cols-3 text-sm text-[color:var(--text-muted)]">
            <p>Budget: {formatRupees(project.budget)}</p>
            <p>Deadline: {formatDisplayDate(project.deadline)}</p>
            <p>Status: {project.status}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to={`/client/projects/${project.id}/bids`}><PrimaryButton>View Bids</PrimaryButton></Link>
            <Link to={`/client/projects/${project.id}/milestones`}><PrimaryButton>Milestones</PrimaryButton></Link>
            <Link to={`/client/messages/${project.id}`}><PrimaryButton>Messages</PrimaryButton></Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
