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
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide uppercase cursor-pointer select-none transition-all duration-300 ${
                isActive 
                  ? 'text-white' 
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.01]'
              }`}
            >
              {/* Active animated backdrop indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute inset-0 rounded-full border border-white/10 ${theme.bg} opacity-20`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className={`absolute bottom-0 left-1/3 right-1/3 h-[2px] rounded-full ${theme.bg}`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
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
