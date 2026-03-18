import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { deleteProject, getClientProjects, patchProject } from '../services/projectService';

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getClientProjects();
      setProjects(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const updateStatus = async (projectId, status) => {
    try {
      await patchProject(projectId, { status });
      await loadProjects();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not update status.');
    }
  };

  const removeProject = async (projectId) => {
    try {
      await deleteProject(projectId);
      await loadProjects();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not delete project.');
    }
  };

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[1200px] space-y-6 px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="worksy-kicker">Client</p>
            <h1 className="worksy-title">Manage Projects</h1>
          </div>
          <Link to="/client/projects/create">
            <PrimaryButton>Post Project</PrimaryButton>
          </Link>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="text-sm text-[color:var(--text-muted)]">Loading projects...</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {!loading &&
            projects.map((project) => (
              <Card key={project.id} className="space-y-4">
                <div>
                  <p className="worksy-kicker">{project.status}</p>
                  <h2 className="text-4xl leading-none text-[color:var(--primary-green)] worksy-heading">{project.title}</h2>
                  <p className="mt-2 text-sm text-[color:var(--text-muted)]">{project.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to={`/client/projects/${project.id}`}>
                    <PrimaryButton>View</PrimaryButton>
                  </Link>
                  <Link to={`/client/projects/${project.id}/bids`}>
                    <PrimaryButton>View Bids</PrimaryButton>
                  </Link>
                  <Link to={`/client/projects/${project.id}/milestones`}>
                    <PrimaryButton>Milestones</PrimaryButton>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button className="worksy-secondary-btn" onClick={() => updateStatus(project.id, 'open')}>Open</button>
                  <button className="worksy-secondary-btn" onClick={() => updateStatus(project.id, 'in_progress')}>In Progress</button>
                  <button className="worksy-secondary-btn" onClick={() => updateStatus(project.id, 'completed')}>Completed</button>
                  <button className="worksy-secondary-btn" onClick={() => removeProject(project.id)}>Delete</button>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </section>
  );
}
