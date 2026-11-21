'use client';

import React from 'react';

export default function ScrollToCalculatorButton() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.getElementById('calculator');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
    >
      Calculate Your Savings
    </button>
  );
}
