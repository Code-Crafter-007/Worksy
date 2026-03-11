// src/App.tsx

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Particles from "./Components/Particles";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Header from "./Components/Header";
import Dashboard from "./Pages/Dashboard";
import FindWork from "./Pages/FindWork";
import MyProposals from "./Pages/MyProposals";
import Messages from "./Pages/Messages";


import "./App.css";

export default function App(): JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <BrowserRouter>
      <div className="page">
        {mounted && (
          <div className="particles-bg">
            <Particles
              particleColors={["#dbdbdb"]}
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleBaseSize={200}
              moveParticlesOnHover
              alphaParticles={false}
              disableRotation={false}
              pixelRatio={window.devicePixelRatio || 1}
            />
          </div>
        )}
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
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
