import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full relative z-10 bg-white py-1 sm:py-1.5 px-2 flex items-center justify-center border-t-2 border-slate-200 shadow-xl">
      <img
        src="/footer.png"
        alt="ROBOCUS 2026 Banner Footer"
        className="w-full h-auto max-h-24 sm:max-h-28 md:max-h-32 object-contain mx-auto"
      />
    </footer>
  );
};
