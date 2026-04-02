// src/App.tsx

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InteractiveBackground from "./Components/InteractiveBackground";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Header from "./Components/Header";
import Dashboard from "./Pages/Dashboard";
import FindWork from "./Pages/FindWork";
import MyProposals from "./Pages/MyProposals";
import Messages from "./Pages/Messages";
import Profile from "./Pages/Profile";
import PublicProfile from "./Pages/PublicProfile";
import MilestonesPage from "./Pages/MilestonesPage";

import "./App.css";

export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <BrowserRouter>
      <div className="page">
        {mounted && <InteractiveBackground />}
        <Header />

        <div className="content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* <Route path="/" element={<HomePage />} /> REMOVED DUPLICATE */}

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/find-work" element={<FindWork />} />
            <Route path="/proposals" element={<MyProposals />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/milestones" element={<MilestonesPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
