"use client";

import React from 'react';
import { LiquidGlass } from './LiquidGlass';

interface LiquidGlassTitleProps {
  text: string;
  className?: string;
  fontSize?: string;
  margin?: string;
  enableFloat?: boolean;
  enableGlossy?: boolean;
  fontFamily?: string;
  fontWeight?: number;
}

export const LiquidGlassTitle: React.FC<LiquidGlassTitleProps> = ({
  text,
  className = '',
  fontSize = 'text-[9rem] md:text-[15rem]',
  margin = 'mb-24',
  enableFloat = true,
  enableGlossy = true,
  fontFamily = '"Nunito", sans-serif',
  fontWeight = 1000,
}) => {
  return (
    <div
      className={`animate-in fade-in zoom-in duration-1000 slide-in-from-top-10 ${margin} relative ${className}`}
      style={enableFloat ? { animation: 'float 6s ease-in-out infinite' } : undefined}
    >
      <LiquidGlass className={`${fontSize} leading-none tracking-tight`}>
        <span style={{ fontFamily, fontWeight }}>{text}</span>
      </LiquidGlass>

      {enableGlossy && (
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[70%] h-[30%] bg-gradient-to-b from-white/60 to-transparent rounded-full blur-2xl -z-10"></div>
      )}
    </div>
  );
};
