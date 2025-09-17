'use client';

import { useEffect, useRef, useState } from 'react';

export function Particles() {
  const particlesRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const particlesContainer = particlesRef.current;
    if (!particlesContainer) return;

    // Clear existing particles
    particlesContainer.innerHTML = '';

    // Create particles
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.animationDuration = (8 + Math.random() * 8) + 's'; // Vary animation duration
      particle.style.animationDelay = (Math.random() * 5) + 's'; // Stagger start times
      particle.style.width = particle.style.height = (3 + Math.random() * 4) + 'px'; // Vary size
      particlesContainer.appendChild(particle);
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div 
        id="particles"
        className="fixed inset-0 overflow-hidden pointer-events-none z-[5]"
      />
    );
  }

  return (
    <div 
      ref={particlesRef}
      id="particles"
      className="fixed inset-0 overflow-hidden pointer-events-none z-[5]"
    />
  );
}