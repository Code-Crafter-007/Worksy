import { useEffect, useState } from "react";
import "./InteractiveBackground.css";

export default function InteractiveBackground() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="interactive-bg">
      <div 
        className="cursor-glow" 
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
    </div>
  );
}
