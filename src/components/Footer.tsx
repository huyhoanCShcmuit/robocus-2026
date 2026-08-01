import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative z-20 bg-white py-1 px-3 flex items-center justify-center border-t-2 border-slate-200 shadow-2xl shrink-0">
      <img
        src="/footer.png"
        alt="ROBOCUS 2026 Banner Footer"
        className="w-full h-auto max-h-12 sm:max-h-16 md:max-h-20 object-contain mx-auto shrink-0 pointer-events-none"
      />
    </footer>
  );
};
