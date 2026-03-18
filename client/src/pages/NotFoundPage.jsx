import { Link } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';

export default function NotFoundPage() {
  return (
    <section className="worksy-section">
      <div className="mx-auto flex w-full max-w-[700px] flex-col items-center px-5 text-center sm:px-8">
        <p className="worksy-kicker">404</p>
        <h1 className="worksy-title">Page Not Found</h1>
        <p className="mt-3 text-[color:var(--text-muted)]">The page you are looking for does not exist.</p>
        <Link to="/" className="mt-6">
          <PrimaryButton>Back Home</PrimaryButton>
        </Link>
      </div>
    </section>
  );
}
