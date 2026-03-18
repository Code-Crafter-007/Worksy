import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { getProjects } from '../services/projectService';
import { formatRupees } from '../utils/formatCurrency';

export default function FreelancerDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await getProjects({ search, status });
        setProjects(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Could not load projects.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [search, status]);

  const openProjects = useMemo(() => projects.filter((project) => project.status === 'open').length, [projects]);

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1200px] space-y-6 px-5 sm:px-8">
        <div className="worksy-card">
          <p className="worksy-kicker">Freelancer Dashboard</p>
          <h1 className="worksy-title">Find Your Next Project</h1>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px]">
            <input
              className="worksy-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or description"
            />
            <select className="worksy-input" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <p className="mt-4 text-sm text-[color:var(--text-muted)]">Open opportunities: {openProjects}</p>
          {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <p className="text-sm text-[color:var(--text-muted)]">Loading projects...</p> : null}
          {!loading &&
            projects.map((project) => (
              <Card key={project.id} className="flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="worksy-kicker">{project.status}</p>
                  <h2 className="text-4xl leading-none text-[color:var(--primary-green)] worksy-heading">{project.title}</h2>
                  <p className="mt-3 text-sm text-[color:var(--text-muted)]">{project.description}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-[color:var(--text-muted)]">Budget: {formatRupees(project.budget)}</p>
                  <Link to={`/projects/${project.id}`}>
                    <PrimaryButton className="w-full justify-center">View & Place Bid</PrimaryButton>
                  </Link>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
