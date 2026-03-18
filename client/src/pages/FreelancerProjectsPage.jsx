import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { getAllProjects } from '../services/projectService';

export default function FreelancerProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getAllProjects();
        setProjects(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Could not load projects.');
      }
    };

    loadProjects();
  }, []);

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1000px] px-5 sm:px-8">
        <div className="mb-6">
          <p className="worksy-kicker">Freelancer</p>
          <h1 className="worksy-title">Browse Projects</h1>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="space-y-3">
              <p className="worksy-kicker">{project.status}</p>
              <h2 className="text-lg font-semibold text-[color:var(--primary-green)]">{project.title}</h2>
              <p className="line-clamp-3 text-sm text-[color:var(--text-muted)]">{project.description}</p>
              <Link className="worksy-secondary-btn inline-flex" to={`/freelancer/projects/${project.id}`}>
                View Details
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
