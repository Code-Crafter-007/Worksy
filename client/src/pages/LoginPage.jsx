import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { user } = await login(form);
      if (user.role === 'client') navigate('/client/projects');
      else if (user.role === 'freelancer') navigate('/freelancer/projects');
      else navigate('/');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[560px] px-5 sm:px-8">
        <div className="worksy-card">
          <p className="worksy-kicker">Welcome Back</p>
          <h1 className="worksy-title">Login To Worksy</h1>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="worksy-label">
              Email
              <input className="worksy-input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>

            <label className="worksy-label">
              Password
              <input className="worksy-input" type="password" name="password" value={form.password} onChange={handleChange} required />
            </label>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center">
              {submitting ? 'Signing in...' : 'Login'}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-sm text-[color:var(--text-muted)]">
            No account yet?{' '}
            <Link to="/register" className="font-semibold text-[color:var(--primary-green)]">
              Register
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
