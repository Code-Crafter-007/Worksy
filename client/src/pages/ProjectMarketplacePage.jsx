import { useEffect, useState } from 'react';
import ProjectCard from '../components/ProjectCard';
import { getProjects } from '../services/projectService';

export default function ProjectMarketplacePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <p className="worksy-kicker">Marketplace</p>
        <h1 className="worksy-title">Discover Freelance Opportunities</h1>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? <p className="text-sm text-[color:var(--text-muted)]">Loading projects...</p> : null}
          {!loading &&
            projects.map((project) => <ProjectCard key={project.id} project={project} showAction />)}
        </div>
      </div>
    </section>
  );
}
