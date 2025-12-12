"use client";

import React from 'react';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* SVG Filters & Gradients */}
      {/* Using inline SVG with 0 dimensions to define filters globally for this component instance */}
      <svg width="0" height="0" className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="liquid-glass-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -5" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="goo" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <linearGradient id="liquid-glass-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="50%" stopColor="rgba(230,245,255,0.6)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Base Layer */}
      <div
        className="relative z-10 select-none"
        style={{
            color: 'transparent',
            backgroundImage: 'url(#liquid-glass-gradient)',
            background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(220,245,255,0.7) 40%, rgba(255,255,255,0.2) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            filter: 'drop-shadow(0 15px 25px rgba(0,60,80,0.3))',
            WebkitTextStroke: '0.025em rgba(255,255,255,0.6)',
            strokeLinejoin: 'round'
        }}
      >
        {children}
      </div>

      {/* Distortion Overlay Layer */}
      <div
        className="absolute top-0 left-0 right-0 w-full h-full select-none pointer-events-none mix-blend-soft-light"
        style={{
            color: 'rgba(255,255,255,0.9)',
            filter: 'url(#liquid-glass-filter)',
            WebkitTextStroke: '0.0125em rgba(255,255,255,0.3)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
