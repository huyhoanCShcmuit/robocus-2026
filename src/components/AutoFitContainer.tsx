import React, { useState, useEffect, useRef } from 'react';

interface AutoFitContainerProps {
  children: React.ReactNode;
}

export const AutoFitContainer: React.FC<AutoFitContainerProps> = ({ children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const handleResize = () => {
      if (!outerRef.current || !innerRef.current) return;

      // Temporarily remove transform to measure natural size
      innerRef.current.style.transform = 'none';

      const outerH = outerRef.current.clientHeight;
      const innerH = innerRef.current.scrollHeight;

      if (outerH > 0 && innerH > 0) {
        if (innerH > outerH) {
          // Scale down to fit exact outer height with a 2% buffer
          const fitScale = (outerH / innerH) * 0.98;
          setScale(fitScale);
        } else {
          setScale(1);
        }
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (outerRef.current) resizeObserver.observe(outerRef.current);
    if (innerRef.current) resizeObserver.observe(innerRef.current);

    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [children]);

  return (
    <div ref={outerRef} className="w-full h-full flex-1 min-h-0 flex flex-col justify-center items-center overflow-hidden relative">
      <div
        ref={innerRef}
        className="w-full flex flex-col items-center justify-center transition-transform duration-300 ease-out origin-center"
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};
