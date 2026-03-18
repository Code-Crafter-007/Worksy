import { Link } from 'react-router-dom';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { formatDisplayDate } from '../utils/formatDate';
import { formatRupees } from '../utils/formatCurrency';

export default function ProjectCard({ project, showAction = true }) {
  const { user } = useAuth();

  const actionPath =
    user?.role === 'freelancer'
      ? `/freelancer/projects/${project.id}`
      : user?.role === 'client'
      ? `/client/projects/${project.id}`
      : `/projects/${project.id}`;

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          {project.status || 'open'}
        </p>
        <h3 className="text-4xl leading-none text-[color:var(--primary-green)] worksy-heading">
          {project.title}
        </h3>
        <p className="line-clamp-3 text-sm text-[color:var(--text-muted)]">{project.description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[color:var(--dark-green)]">
          <span className="rounded-full border border-[color:var(--dark-green)]/20 px-3 py-1">
            Budget: {formatRupees(project.budget)}
          </span>
          <span className="rounded-full border border-[color:var(--dark-green)]/20 px-3 py-1">
            Deadline: {formatDisplayDate(project.deadline)}
          </span>
        </div>

        {showAction ? (
          <Link to={actionPath} className="block">
            <PrimaryButton className="w-full justify-center">View Project</PrimaryButton>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
