import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
  });
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
      const { user } = await register(form);
      if (user.role === 'client') navigate('/client/projects');
      else navigate('/freelancer/projects');
    } catch (apiError) {
      const statusCode = apiError.response?.status;
      const apiMessage = apiError.response?.data?.message;
      if (statusCode === 429) {
        setError('Too many email requests. Wait 60 seconds, then try again. If you already signed up, use Login instead.');
      } else {
        setError(apiMessage || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[560px] px-5 sm:px-8">
        <div className="worksy-card">
          <p className="worksy-kicker">Join Worksy</p>
          <h1 className="worksy-title">Create Your Account</h1>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="worksy-label">
              Full name
              <input className="worksy-input" type="text" name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label className="worksy-label">
              Email
              <input className="worksy-input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>

            <label className="worksy-label">
              Password
              <input className="worksy-input" type="password" name="password" minLength={6} value={form.password} onChange={handleChange} required />
            </label>

            <label className="worksy-label">
              I am joining as
              <select className="worksy-input" name="role" value={form.role} onChange={handleChange}>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </label>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <PrimaryButton type="submit" disabled={submitting} className="w-full justify-center">
              {submitting ? 'Creating account...' : 'Register'}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-sm text-[color:var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[color:var(--primary-green)]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
