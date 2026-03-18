import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectMarketplacePage from './pages/ProjectMarketplacePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ClientProjectsPage from './pages/ClientProjectsPage';
import ClientCreateProjectPage from './pages/ClientCreateProjectPage';
import ClientProjectDetailPage from './pages/ClientProjectDetailPage';
import ClientProjectBidsPage from './pages/ClientProjectBidsPage';
import ClientProjectMilestonesPage from './pages/ClientProjectMilestonesPage';
import ClientMessagesPage from './pages/ClientMessagesPage';
import ClientProfilePage from './pages/ClientProfilePage';
import FreelancerProjectsPage from './pages/FreelancerProjectsPage';
import FreelancerProjectDetailPage from './pages/FreelancerProjectDetailPage';
import FreelancerBidsPage from './pages/FreelancerBidsPage';
import FreelancerMilestonesPage from './pages/FreelancerMilestonesPage';
import FreelancerMessagesPage from './pages/FreelancerMessagesPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/marketplace" element={<ProjectMarketplacePage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

        <Route element={<ProtectedRoute roles={['client']} />}>
          <Route path="/client/projects" element={<ClientProjectsPage />} />
          <Route path="/client/projects/create" element={<ClientCreateProjectPage />} />
          <Route path="/client/projects/:projectId" element={<ClientProjectDetailPage />} />
          <Route path="/client/projects/:projectId/bids" element={<ClientProjectBidsPage />} />
          <Route path="/client/projects/:projectId/milestones" element={<ClientProjectMilestonesPage />} />
          <Route path="/client/messages/:projectId" element={<ClientMessagesPage />} />
          <Route path="/client/profile" element={<ClientProfilePage />} />
          <Route path="/client/dashboard" element={<Navigate to="/client/projects" replace />} />
        </Route>

        <Route element={<ProtectedRoute roles={['freelancer']} />}>
          <Route path="/freelancer/projects" element={<FreelancerProjectsPage />} />
          <Route path="/freelancer/projects/:projectId" element={<FreelancerProjectDetailPage />} />
          <Route path="/freelancer/bids" element={<FreelancerBidsPage />} />
          <Route path="/freelancer/milestones" element={<FreelancerMilestonesPage />} />
          <Route path="/freelancer/messages/:projectId" element={<FreelancerMessagesPage />} />
          <Route path="/freelancer/profile" element={<FreelancerProfilePage />} />
          <Route path="/freelancer/dashboard" element={<Navigate to="/freelancer/projects" replace />} />
        </Route>

        <Route path="/dashboard" element={<Navigate to="/marketplace" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
