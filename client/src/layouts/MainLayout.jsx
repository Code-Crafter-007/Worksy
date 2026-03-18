import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PrimaryButton from '../components/PrimaryButton';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/marketplace', label: 'Marketplace' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();

  const roleLinks =
    user?.role === 'client'
      ? [
          { to: '/client/projects', label: 'My Projects' },
          { to: '/client/profile', label: 'Profile' },
        ]
      : user?.role === 'freelancer'
      ? [
          { to: '/freelancer/projects', label: 'Projects' },
          { to: '/freelancer/bids', label: 'My Bids' },
          { to: '/freelancer/profile', label: 'Profile' },
        ]
      : [];

  return (
    <div className="min-h-screen bg-[color:var(--bg-light)] text-[color:var(--text-dark)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--dark-green)]/10 bg-[color:var(--bg-light)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="text-4xl leading-none worksy-heading text-[color:var(--primary-green)]">
            Worksy
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold uppercase tracking-[0.12em] ${
                    isActive ? 'text-[color:var(--primary-green)]' : 'text-[color:var(--text-muted)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {roleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold uppercase tracking-[0.12em] ${
                    isActive ? 'text-[color:var(--primary-green)]' : 'text-[color:var(--text-muted)]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-[color:var(--text-muted)] sm:block">{user.name}</span>
                <PrimaryButton onClick={logout}>Logout</PrimaryButton>
              </>
            ) : (
              <>
                <Link className="text-sm font-semibold text-[color:var(--primary-green)]" to="/login">
                  Login
                </Link>
                <Link to="/register">
                  <PrimaryButton>Get Started</PrimaryButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-[color:var(--dark-green)]/10 bg-[color:var(--bg-light)]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-5 py-8 text-sm text-[color:var(--text-muted)] sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Worksy - Built for modern freelancing collaboration.</p>
          <div className="flex gap-4 uppercase tracking-[0.12em]">
            <Link to="/">Terms</Link>
            <Link to="/">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
