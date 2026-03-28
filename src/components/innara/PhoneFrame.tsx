"use client";

import { type ReactNode, useState, useEffect, createContext, useContext } from 'react';

interface PhoneFrameProps {
  children: ReactNode;
}

// Context to let children know they're inside a phone frame
export const PhoneFrameContext = createContext<boolean>(false);
export const useIsInPhoneFrame = () => useContext(PhoneFrameContext);

export function PhoneFrame({ children }: PhoneFrameProps) {
  const baseScreenW = 390;
  const baseScreenH = 844;
  const framePadding = 14 * 2;
  const baseW = baseScreenW + framePadding;
  const baseH = baseScreenH + framePadding;
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const maxW = window.innerWidth - 24;
      const maxH = window.innerHeight - 24;
      const next = Math.min(1.2, maxW / baseW, maxH / baseH);
      setScale(Number.isFinite(next) ? next : 1);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [baseW, baseH]);

  const screenBackground = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(215 85% 70% / 0.75) 0%, hsl(225 75% 75% / 0.55) 30%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />
      <div
        className="absolute top-1/3 -right-16 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(225 80% 72% / 0.65) 0%, hsl(235 70% 78% / 0.45) 30%, transparent 70%)',
          filter: 'blur(35px)'
        }}
      />
      <div
        className="absolute bottom-10 left-10 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(235 75% 75% / 0.55) 0%, hsl(245 65% 80% / 0.35) 30%, transparent 70%)',
          filter: 'blur(30px)'
        }}
      />
    </div>
  );

  // Mobile: render children directly without any frame
  if (!isDesktop) {
    return (
      <PhoneFrameContext.Provider value={true}>
        <div
          className="min-h-screen relative overflow-hidden phone-frame-container"
          style={{
            background: 'linear-gradient(180deg, hsl(220 60% 96%) 0%, hsl(225 55% 94%) 50%, hsl(230 50% 92%) 100%)'
          }}
        >
          {screenBackground}
          <div className="relative h-screen">
            {children}
          </div>
        </div>
      </PhoneFrameContext.Provider>
    );
  }

  // Desktop: render children inside iPhone frame
  return (
    <PhoneFrameContext.Provider value={true}>
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div
        className="relative"
        style={{ width: baseW * scale, height: baseH * scale }}
      >
        <div
          className="relative bg-[#1a1a1a] rounded-[55px] p-[14px] shadow-2xl"
          style={{
            width: `${baseW}px`,
            height: `${baseH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.1),
              0 25px 50px -12px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.1)
            `
          }}
        >
          {/* Side buttons - Volume */}
          <div className="absolute left-[-3px] top-[120px] w-[3px] h-[30px] bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute left-[-3px] top-[160px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute left-[-3px] top-[230px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
          {/* Side button - Power */}
          <div className="absolute right-[-3px] top-[180px] w-[3px] h-[80px] bg-[#2a2a2a] rounded-r-sm" />

          {/* Screen bezel */}
          <div className="relative bg-black rounded-[42px] overflow-hidden w-full h-full">
            {/* Dynamic Island */}
            <div className="absolute top-[12px] left-1/2 -translate-x-1/2 z-50">
              <div
                className="bg-black rounded-full px-6 py-[6px] flex items-center gap-2"
                style={{
                  minWidth: '126px',
                  boxShadow: 'inset 0 0 2px rgba(255,255,255,0.1)'
                }}
              >
                <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a2e] relative">
                  <div className="absolute inset-[2px] rounded-full bg-[#0d0d1a]" />
                  <div className="absolute top-[2px] left-[2px] w-[2px] h-[2px] rounded-full bg-[#2a2a4a] opacity-50" />
                </div>
              </div>
            </div>

            {/* Screen content area */}
            <div
              className="relative w-full h-full overflow-hidden flex flex-col"
              style={{
                background: 'linear-gradient(180deg, hsl(220 60% 96%) 0%, hsl(225 55% 94%) 50%, hsl(230 50% 92%) 100%)'
              }}
            >
              {screenBackground}
              {/* Status bar */}
              <div className="z-40 flex-shrink-0 flex items-center justify-between px-8 pt-[14px] pb-1 bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-white text-sm font-semibold">
                  {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-1">
                  <div className="flex items-end gap-[2px] mr-1">
                    <div className="w-[3px] h-[4px] bg-white rounded-sm" />
                    <div className="w-[3px] h-[6px] bg-white rounded-sm" />
                    <div className="w-[3px] h-[8px] bg-white rounded-sm" />
                    <div className="w-[3px] h-[10px] bg-white rounded-sm" />
                  </div>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 18 10.6 18.5 12 18.5s2.6-.5 3.5-1.4l1.4-1.4c-1.3-1.3-3.1-2.1-5-2.1s-3.6.8-4.9 2.1zM2.8 10.8l1.4 1.4c2.1-2.1 5-3.4 7.8-3.4s5.7 1.3 7.8 3.4l1.4-1.4c-2.5-2.5-5.8-3.9-9.2-3.9s-6.7 1.4-9.2 3.9z"/>
                  </svg>
                  <div className="flex items-center ml-1">
                    <div className="w-[22px] h-[11px] border border-white rounded-[3px] p-[1px]">
                      <div className="h-full w-[80%] bg-white rounded-[1px]" />
                    </div>
                    <div className="w-[1px] h-[4px] bg-white ml-[1px] rounded-r-sm" />
                  </div>
                </div>
              </div>

              {/* App content */}
              <div className="relative flex-1 min-h-0 phone-frame-container">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Reflection effect */}
        <div
          className="absolute inset-0 rounded-[55px] pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
        />
      </div>
    </div>
    </PhoneFrameContext.Provider>
  );
}
