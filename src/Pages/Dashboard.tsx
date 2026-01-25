import Navbar from "../components/Dashboard/Navbar";
import OverviewStats from "../components/Dashboard/OverviewStats";
import QuickActions from "../components/Dashboard/QuickActions";

export default function Dashboard(): JSX.Element {
  return (
    <>
     <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-content">
        <OverviewStats />
        <QuickActions />
      </div>
    </div>
    </>
  );
}
