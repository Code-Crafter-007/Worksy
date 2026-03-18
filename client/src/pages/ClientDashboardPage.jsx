import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import { createProject, getClientProjects, updateProject } from '../services/projectService';
import { formatDisplayDate } from '../utils/formatDate';
import { formatRupees } from '../utils/formatCurrency';

const emptyForm = {
  title: '',
  description: '',
  required_skills: '',
  budget: '',
  deadline: '',
};

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('open');

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getClientProjects();
      setProjects(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createProject({
        ...form,
        budget: Number(form.budget),
        required_skills: form.required_skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      });
      setForm(emptyForm);
      await loadProjects();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (project) => {
    setEditingId(project.id);
    setEditStatus(project.status || 'open');
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      await updateProject(editingId, { status: editStatus });
      setEditingId(null);
      await loadProjects();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to update project.');
    }
  };

  const activeCount = useMemo(
    () => projects.filter((project) => project.status === 'open' || project.status === 'in_progress').length,
    [projects]
  );

  return (
    <section className="worksy-section">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="worksy-card h-fit">
          <p className="worksy-kicker">Client Dashboard</p>
          <h1 className="worksy-title">Post A New Project</h1>

          <form className="mt-6 space-y-4" onSubmit={handleCreate}>
            <label className="worksy-label">
              Title
              <input className="worksy-input" name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label className="worksy-label">
              Description
              <textarea className="worksy-input min-h-28" name="description" value={form.description} onChange={handleChange} required />
            </label>
            <label className="worksy-label">
              Required skills (comma separated)
              <input className="worksy-input" name="required_skills" value={form.required_skills} onChange={handleChange} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="worksy-label">
                Budget
                <input className="worksy-input" type="number" min="1" name="budget" value={form.budget} onChange={handleChange} required />
              </label>
              <label className="worksy-label">
                Deadline
                <input className="worksy-input" type="date" name="deadline" value={form.deadline} onChange={handleChange} required />
              </label>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center">
              {submitting ? 'Publishing...' : 'Post Project'}
            </PrimaryButton>
          </form>
        </div>

        <div className="space-y-5">
          <div className="worksy-card">
            <p className="worksy-kicker">Overview</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[color:var(--text-muted)]">
              <span>Total Projects: {projects.length}</span>
              <span>Active Projects: {activeCount}</span>
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? <p className="text-sm text-[color:var(--text-muted)]">Loading projects...</p> : null}

            {!loading && projects.length === 0 ? (
              <Card>
                <p className="text-sm text-[color:var(--text-muted)]">No projects yet. Create your first project.</p>
              </Card>
            ) : null}

            {projects.map((project) => (
              <Card key={project.id}>
                <p className="worksy-kicker">{project.status}</p>
                <h2 className="text-4xl leading-none text-[color:var(--primary-green)] worksy-heading">{project.title}</h2>
                <p className="mt-3 text-sm text-[color:var(--text-muted)]">{project.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]">
                  <span>Budget: {formatRupees(project.budget)}</span>
                  <span>Deadline: {formatDisplayDate(project.deadline)}</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {editingId === project.id ? (
                    <>
                      <select className="worksy-input max-w-44" value={editStatus} onChange={(event) => setEditStatus(event.target.value)}>
                        <option value="open">open</option>
                        <option value="in_progress">in_progress</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                      <PrimaryButton onClick={handleUpdate}>Save</PrimaryButton>
                      <button className="text-sm text-[color:var(--text-muted)]" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <PrimaryButton onClick={() => openEdit(project)}>Edit Status</PrimaryButton>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
