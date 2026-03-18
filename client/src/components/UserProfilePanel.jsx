import Card from './Card';
import { useAuth } from '../hooks/useAuth';

export default function UserProfilePanel({ title = 'Profile' }) {
  const { user } = useAuth();

  return (
    <Card>
      <p className="worksy-kicker">Common Profile</p>
      <h1 className="worksy-title">{title}</h1>

      <div className="mt-6 grid gap-3 text-sm">
        <div className="rounded-xl border border-[color:var(--dark-green)]/10 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Name</p>
          <p className="mt-1 text-base font-semibold text-[color:var(--primary-green)]">{user?.name || '-'}</p>
        </div>

        <div className="rounded-xl border border-[color:var(--dark-green)]/10 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Email</p>
          <p className="mt-1 text-base font-semibold text-[color:var(--primary-green)]">{user?.email || '-'}</p>
        </div>

        <div className="rounded-xl border border-[color:var(--dark-green)]/10 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Role</p>
          <p className="mt-1 text-base font-semibold capitalize text-[color:var(--primary-green)]">{user?.role || '-'}</p>
        </div>
      </div>
    </Card>
  );
}
