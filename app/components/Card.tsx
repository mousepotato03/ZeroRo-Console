import React from 'react';

interface CardProps {
  title?: string; // Title is optional for cards that might not need one
  children: React.ReactNode;
  className?: string; // Allows for additional custom styling
}

export default function Card({ title, children, className }: CardProps) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 ${className}`}>
      {title && <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>}
      {children}
    </div>
  );
}
