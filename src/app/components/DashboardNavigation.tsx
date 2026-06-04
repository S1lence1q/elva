import React from 'react';
import { motion } from 'motion/react';
import { Home, Compass, User } from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

export type DashboardTab = 'home' | 'discover' | 'profile';

interface DashboardNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  accentColor: AccentColor;
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  activeTab,
  onTabChange,
  accentColor,
}) => {
  const theme = ACCENT_THEMES[accentColor];

  const tabs: { id: DashboardTab; label: string; icon: React.FC<any> }[] = [
    { id: 'home', label: 'Home / Search', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'profile', label: 'My Hub', icon: User },
  ];

  return (
    <div className="flex justify-center mb-8 relative z-30 shrink-0">
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a0b10]/60 border border-white/[0.06] backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.55)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4.5 py-2.5 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase cursor-pointer select-none transition-all duration-300 ${
                isActive 
                  ? 'text-white' 
                  : 'text-white/35 hover:text-white/65 hover:bg-white/[0.02]'
              }`}
            >
              {/* Active animated backdrop indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute inset-0 rounded-full border border-white/[0.07] ${theme.bg} opacity-[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-1/3 right-1/3 h-[1.5px] rounded-full bg-white/40 shadow-[0_0_6px_rgba(255,255,255,0.15)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}

              <Icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? theme.text : 'text-current'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
