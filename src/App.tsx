// src/App.tsx

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import InteractiveBackground from "./Components/InteractiveBackground";
import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Header from "./Components/Header";
import DashboardHome from "./Pages/DashboardHome";
import FindWork from "./Pages/FindWork";
import MyProposals from "./Pages/MyProposals";
import Messages from "./Pages/Messages";
import Profile from "./Pages/Profile";
import PublicProfile from "./Pages/PublicProfile";
import ClientPostWork from "./Pages/ClientPostWork";
import ClientBids from "./Pages/ClientBids";
import ClientAcceptedProjects from "./Pages/ClientAcceptedProjects";

import "./App.css";

export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="page">
          <div className="noise-layer" aria-hidden="true" />
          {mounted && <InteractiveBackground />}
          <Header />

          <div className="content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/find-work" element={<FindWork />} />
              <Route path="/proposals" element={<MyProposals />} />
              <Route path="/post-work" element={<ClientPostWork />} />
              <Route path="/client-bids" element={<ClientBids />} />
              <Route path="/client-projects" element={<ClientAcceptedProjects />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
