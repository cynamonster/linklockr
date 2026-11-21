'use client';

import React, { useState, useEffect } from 'react';

const platforms = [
  { cut: '20%', name: 'OnlyFans', highlight: 'text-sky-400' },
  { cut: '12%', name: 'Patreon', highlight: 'text-rose-400' },
  { cut: '20%', name: 'Fansly', highlight: 'text-cyan-400' },
  { cut: '10%', name: 'Gumroad', highlight: 'text-pink-400' },
  { cut: '30%', name: 'ManyVids', highlight: 'text-amber-400' },
  { cut: '15%', name: 'Payment Processors', highlight: 'text-emerald-400' },
];

export default function RotatingHeadline() {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % platforms.length);
        setIsAnimating(false);
      }, 300); // 300ms transition time
    }, 2800); // switch every 2.8s

    return () => clearInterval(interval);
  }, []);

  const current = platforms[index];

  return (
    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
      <span>Stop Losing</span>
      <br className="hidden sm:inline" />
      <span className="inline-block relative min-w-[220px] sm:min-w-[320px] text-left">
        <span
          className={`inline-block transition-all duration-300 ease-out transform ${
            isAnimating
              ? 'opacity-0 -translate-y-3 scale-95'
              : 'opacity-100 translate-y-0 scale-100'
          } ${current.highlight}`}
        >
          {current.cut} to {current.name}.
        </span>
      </span>{' '}
    </h1>
  );
}
