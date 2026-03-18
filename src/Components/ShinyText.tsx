import React from 'react';
import './ShinyText.css';

export default function ShinyText({ text, disabled = false, speed = 3, className = '' }: { text: string, disabled?: boolean, speed?: number, className?: string }) {
  const animationDuration = `${speed}s`;
  return (
    <div
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </div>
  );
}
