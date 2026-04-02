import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function BlurText({ text, className = '', delay = 0 }: { text: string, className?: string, delay?: number }) {
  const container = useRef<HTMLSpanElement>(null);
  
  useGSAP(() => {
    if (container.current) {
      gsap.fromTo(
        container.current.children,
        { filter: 'blur(10px)', opacity: 0, y: 10 },
        { filter: 'blur(0px)', opacity: 1, y: 0, stagger: 0.05, duration: 0.5, delay }
      );
    }
  }, { scope: container });
  
  const letters = text.split('');
  return (
    <span ref={container} className={className} style={{ display: 'inline-block' }}>
      {letters.map((letter, i) => (
        <span key={i} style={{ display: 'inline-block', whiteSpace: letter === ' ' ? 'pre' : 'normal' }}>
          {letter}
        </span>
      ))}
    </span>
  );
}
