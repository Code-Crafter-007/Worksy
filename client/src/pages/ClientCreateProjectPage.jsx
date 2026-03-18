import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';
import { createProject } from '../services/projectService';

const initialState = {
  title: '',
  description: '',
  required_skills: '',
  budget: '',
  deadline: '',
};

export default function ClientCreateProjectPage() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createProject({
        ...form,
        budget: Number(form.budget),
        required_skills: form.required_skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      });
      navigate('/client/projects');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[760px] px-5 sm:px-8">
        <div className="worksy-card">
          <p className="worksy-kicker">Client</p>
          <h1 className="worksy-title">Create Project</h1>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="worksy-label">Title
              <input className="worksy-input" name="title" value={form.title} onChange={onChange} required />
            </label>
            <label className="worksy-label">Description
              <textarea className="worksy-input min-h-28" name="description" value={form.description} onChange={onChange} required />
            </label>
            <label className="worksy-label">Required Skills
              <input className="worksy-input" name="required_skills" value={form.required_skills} onChange={onChange} placeholder="react,node,supabase" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="worksy-label">Budget
                <input className="worksy-input" name="budget" type="number" min="1" value={form.budget} onChange={onChange} required />
              </label>
              <label className="worksy-label">Deadline
                <input className="worksy-input" name="deadline" type="date" value={form.deadline} onChange={onChange} required />
              </label>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <PrimaryButton type="submit" className="w-full justify-center" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Project'}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </section>
  );
}
