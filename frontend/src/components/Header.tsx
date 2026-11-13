import React, { useEffect, useState } from 'react';
import { ViewState } from '../types/khata';

interface HeaderProps {
  currentView: ViewState;
  onSelectView: (view: ViewState) => void;
  isListening: boolean;
  dspActive: boolean;
  onOpenCustomDomain: () => void;
  onResetDb: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  isListening,
  dspActive,
  onOpenCustomDomain,
  onResetDb
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const navItems: { id: ViewState; label: string; num: string }[] = [
    { id: 'console', label: 'LIVE CONSOLE', num: '01' },
    { id: 'ledger', label: 'BAHI-KHATA LEDGER', num: '02' },
    { id: 'judge', label: 'JUDGE STRESS-TEST', num: '03' },
    { id: 'privacy', label: 'PRIVACY POLICY', num: '04' },
    { id: 'terms', label: 'TERMS & CONDITIONS', num: '05' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#141413] border-b border-[#2D2D2A] text-[#F4F1EA] select-none w-full">
      {/* Topmost Technical Telemetry Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-1.5 bg-[#0E0E0D] border-b border-[#222220] font-mono-tech text-xs text-[#8E8A82] w-full">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className={`mech-led ${isListening ? 'active-red' : ''}`} />
            <span>MIC: {isListening ? 'STREAMING [RAW_IN]' : 'STANDBY'}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className={`mech-led ${dspActive ? 'active-green' : ''}`} />
            <span>DSP: {dspActive ? '120Hz-HPF+NOTCH' : 'OFF'}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="mech-led active-green" />
            <span>STORE: AES-GCM-256 [LOCAL_ONLY]</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="hover:text-[#C88A2B] transition-colors font-bold text-[#C88A2B]"
            title="Toggle Browser Fullscreen Mode"
          >
            {isFullscreen ? '[EXIT_FULLSCREEN]' : '[ENTER_FULLSCREEN]'}
          </button>
          <span className="text-[#3E3E3A]">|</span>
          <button
            type="button"
            onClick={onOpenCustomDomain}
            className="hover:text-[#C88A2B] transition-colors"
          >
            [DOMAIN: khata.yourdomain.in]
          </button>
          <span className="text-[#3E3E3A]">|</span>
          <button
            type="button"
            onClick={onResetDb}
            className="hover:text-[#D9381E] transition-colors"
            title="Reset IndexedDB to default Kirana seed data"
          >
            [RE-SEED_DB]
          </button>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-6 py-3 gap-3 w-full">
        {/* Brand & Hardware Mark */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 bg-[#D9381E] border border-[#A92610] flex items-center justify-center font-mono-tech font-bold text-sm text-white shadow-xs">
            VK
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono-tech font-bold text-base tracking-wider uppercase text-[#F4F1EA]">
                Voice Khata
              </span>
              <span className="text-[11px] font-mono-tech px-2 py-0.5 bg-[#262622] text-[#C88A2B] border border-[#3A3830]">
                HARDWARE_UI // TE_BRAUN
              </span>
            </div>
            <span className="text-xs text-[#736F66] font-mono-tech block mt-0.5">
              PS2 GNANI VOICE EVALUATION PLATFORM
            </span>
          </div>
        </div>

        {/* 3D Spatial Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5 font-mono-tech text-xs sm:text-sm">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`px-3.5 py-2 border transition-all ${
                  isActive
                    ? 'border-[#D9381E] bg-[#D9381E] text-white font-bold shadow-xs'
                    : 'border-[#262624] bg-[#181816] text-[#A8A49C] hover:text-[#F4F1EA] hover:border-[#383834]'
                }`}
              >
                <span className="text-[11px] opacity-75 mr-1.5">{item.num}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
