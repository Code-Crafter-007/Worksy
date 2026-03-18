import UserProfilePanel from '../components/UserProfilePanel';

export default function ClientProfilePage() {
  return (
    <section className="worksy-section">
      <div className="mx-auto w-full max-w-[760px] px-5 sm:px-8">
        <UserProfilePanel title="Client Profile" />
      </div>
    </section>
  );
}
