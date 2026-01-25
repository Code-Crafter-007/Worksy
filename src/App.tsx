// src/App.tsx

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Particles from "./components/Particles";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";


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
            <Route path="/dashboard" element={<Dashboard />} />

          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
