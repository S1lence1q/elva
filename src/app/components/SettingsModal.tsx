import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, Sliders } from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

interface SettingsModalProps {
  onClose: () => void;
  backgroundStyle?: 'default' | 'particles' | 'liquid' | 'mesh';
  onBackgroundStyleChange?: (style: 'default' | 'particles' | 'liquid' | 'mesh') => void;
  themePreset?: 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset';
  onThemePresetChange?: (theme: 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset') => void;
  accentColor?: AccentColor;
  onAccentColorChange?: (color: AccentColor) => void;
  showVolumeSlider?: boolean;
  onShowVolumeSliderChange?: (show: boolean) => void;
  zenMode?: boolean;
  onZenModeChange?: (zen: boolean) => void;
  enable3DTilt?: boolean;
  onEnable3DTiltChange?: (enable: boolean) => void;
  showSettingsButton?: boolean;
  onShowSettingsButtonChange?: (show: boolean) => void;
  textureStyle?: 'paper' | 'dots' | 'none';
  onTextureStyleChange?: (style: 'paper' | 'dots' | 'none') => void;
}

function Toggle({ 
  checked, 
  onChange, 
  label, 
  description, 
  accentColor 
}: { 
  checked: boolean; 
  onChange: (c: boolean) => void; 
  label: string; 
  description: string; 
  accentColor: AccentColor; 
}) {
  const activeBgs = {
    emerald: 'bg-emerald-600/30 border-emerald-500/40',
    sand: 'bg-amber-600/30 border-amber-500/40',
    wine: 'bg-rose-600/30 border-rose-500/40',
    navy: 'bg-slate-600/30 border-slate-500/40'
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-white/12 transition-all duration-300 cursor-pointer" 
      onClick={() => onChange(!checked)}
    >
      <div className="text-left pr-4">
        <span className={`text-sm font-light block transition-colors ${checked ? 'text-white' : 'text-white/80'}`}>{label}</span>
        <span className="text-xs text-white/40 font-light">{description}</span>
      </div>
      <div className={`w-11 h-6 rounded-full shrink-0 relative border transition-colors duration-300 ${checked ? activeBgs[accentColor] : 'bg-white/10 border-white/5'}`}>
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full transition-all duration-300 ${checked ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.75)]' : 'bg-white/60'}`}
        />
      </div>
    </motion.div>
  );
}

export function SettingsModal({ 
  onClose, 
  backgroundStyle = 'default', 
  onBackgroundStyleChange,
  themePreset = 'dynamic',
  onThemePresetChange,
  accentColor = 'emerald',
  onAccentColorChange,
  showVolumeSlider = false,
  onShowVolumeSliderChange,
  zenMode = false,
  onZenModeChange,
  enable3DTilt = true,
  onEnable3DTiltChange,
  showSettingsButton = false,
  onShowSettingsButtonChange,
  textureStyle = 'paper',
  onTextureStyleChange
}: SettingsModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Close with Escape or Cmd/Ctrl+,
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || (e.code === 'Comma' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const theme = ACCENT_THEMES[accentColor];

  const headerIndicatorBgs = {
    emerald: 'bg-emerald-500',
    sand: 'bg-amber-500',
    wine: 'bg-rose-500',
    navy: 'bg-slate-500'
  };

  const activeBorder = {
    emerald: 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_12px_var(--theme-primary-fade)]',
    sand: 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_12px_var(--theme-primary-fade)]',
    wine: 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_12px_var(--theme-primary-fade)]',
    navy: 'bg-slate-900/25 border-slate-500/40 shadow-[0_0_12px_var(--theme-primary-fade)]'
  }[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-4 bg-[#070707]/50 backdrop-blur-3xl rounded-[32px] border border-white/12 overflow-hidden max-h-[90vh] flex flex-col shadow-[0_40px_128px_rgba(0,0,0,0.9)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-4 rounded-full ${headerIndicatorBgs[accentColor]} shadow-[0_0_10px_var(--theme-primary)]`} />
              <h2 className="text-xl font-light text-white/90 tracking-wide">Control Center</h2>
            </div>
            <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] mt-1 pl-3 font-medium">Nordic Immersive • v1.0</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/8 transition-all hover:scale-105 duration-200 cursor-pointer"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white/80 transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-none">
          {/* Color Theme Preset */}
          <div>
            <h3 className="text-xs font-semibold text-white/45 uppercase tracking-[0.12em] mb-3 px-1">Atmosfæriske Temaer</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onThemePresetChange?.('dynamic')}
                className={`col-span-2 flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  themePreset === 'dynamic'
                    ? `${activeBorder} bg-white/[0.04]`
                    : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                }`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-400 via-emerald-400 to-blue-400 shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.15)] animate-pulse" style={{ animationDuration: '3s' }} />
                  <div>
                    <span className={`text-sm block font-light ${themePreset === 'dynamic' ? 'text-white' : 'text-white/70'}`}>Dynamic Album Cover</span>
                    <span className="text-[10px] text-white/35 font-light mt-0.5 block leading-normal">Farverne morfer og tilpasser sig coveret i realtid</span>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onThemePresetChange?.('cyberpunk')}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  themePreset === 'cyberpunk'
                    ? `${activeBorder} bg-white/[0.04]`
                    : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f43f5e] via-[#06b6d4] to-[#8b5cf6] shrink-0 shadow-[0_0_8px_rgba(244,63,148,0.25)]" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'cyberpunk' ? 'text-white font-normal' : 'text-white/70'}`}>Cyberpunk</span>
                    <span className="text-[9px] text-white/35 truncate block font-light mt-0.5 uppercase tracking-wider">Neon Vibe</span>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onThemePresetChange?.('obsidian')}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  themePreset === 'obsidian'
                    ? `${activeBorder} bg-white/[0.04]`
                    : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#475569] via-[#020617] to-[#0f172a] shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.4)] border border-white/5" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'obsidian' ? 'text-white font-normal' : 'text-white/70'}`}>Obsidian</span>
                    <span className="text-[9px] text-white/35 truncate block font-light mt-0.5 uppercase tracking-wider">Deep Space</span>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onThemePresetChange?.('aurora')}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  themePreset === 'aurora'
                    ? `${activeBorder} bg-white/[0.04]`
                    : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#10b981] via-[#6366f1] to-[#059669] shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.25)]" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'aurora' ? 'text-white font-normal' : 'text-white/70'}`}>Aurora</span>
                    <span className="text-[9px] text-white/35 truncate block font-light mt-0.5 uppercase tracking-wider">Nordlys glow</span>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onThemePresetChange?.('sunset')}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                  themePreset === 'sunset'
                    ? `${activeBorder} bg-white/[0.04]`
                    : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f97316] via-[#7c3aed] to-[#d946ef] shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.25)]" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'sunset' ? 'text-white font-normal' : 'text-white/70'}`}>Sunset</span>
                    <span className="text-[9px] text-white/35 truncate block font-light mt-0.5 uppercase tracking-wider">Aftenrøde</span>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Aesthetic stack - unified card group */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white/45 uppercase tracking-[0.12em] px-1">Visuelle Præferencer</h3>
            <Toggle
              checked={textureStyle !== 'none'}
              onChange={(on) => onTextureStyleChange?.(on ? 'paper' : 'none')}
              label="Film Grain Texture"
              description="Subtil analog retro-støj for et mat, taktilt papir-look"
              accentColor={accentColor}
            />

            <Toggle 
              checked={zenMode} 
              onChange={(c) => onZenModeChange?.(c)} 
              label="Zen Mode" 
              description="Skjul automatisk kontroller ved inaktivitet for komplet ro"
              accentColor={accentColor}
            />
          </div>

          {/* Collapsible Advanced Customization Section */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowAdvanced(p => !p)}
              className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] hover:border-white/12 text-white/70 hover:text-white transition-all cursor-pointer font-light tracking-wide text-sm shrink-0"
            >
              <span className="flex items-center gap-2.5 font-light">
                <Sliders className={`w-4 h-4 text-white/30 transition-colors ${showAdvanced ? theme.text : ''}`} />
                Advanced Controls
              </span>
              <ChevronDown
                className={`w-4 h-4 text-white/30 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </motion.button>

            <AnimatePresence initial={false}>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="space-y-4 pt-4 pb-1">
                    {/* Accent Color Section inside Advanced */}
                    <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 space-y-3.5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.12em] block px-0.5">Manuelle Accentfarver</span>
                      <div className="grid grid-cols-4 gap-2">
                        {(['emerald', 'sand', 'wine', 'navy'] as AccentColor[]).map((color) => {
                          const isActive = accentColor === color;
                          
                          const swatchBgs = {
                            emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
                            sand: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
                            wine: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
                            navy: 'bg-slate-500 shadow-[0_0_12px_rgba(100,116,139,0.3)]'
                          };

                          const activeBorders = {
                            emerald: 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_12px_var(--theme-primary-fade)]',
                            sand: 'border-amber-500/40 bg-amber-950/20 shadow-[0_0_12px_var(--theme-primary-fade)]',
                            wine: 'border-rose-500/40 bg-rose-950/20 shadow-[0_0_12px_var(--theme-primary-fade)]',
                            navy: 'border-slate-500/40 bg-slate-900/25 shadow-[0_0_12px_var(--theme-primary-fade)]'
                          };

                          return (
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              key={color}
                              onClick={() => onAccentColorChange?.(color)}
                              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-300 ${
                                isActive
                                  ? activeBorders[color]
                                  : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/12'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full ${swatchBgs[color]} shrink-0`} />
                              <span className={`text-[10px] font-light truncate max-w-full tracking-wide ${isActive ? 'text-white font-normal' : 'text-white/50'}`}>
                                {color === 'emerald' ? 'Emerald' : color === 'sand' ? 'Sand' : color === 'wine' ? 'Wine' : 'Navy'}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Advanced Technical Toggles */}
                    <div className="space-y-2.5">
                      <Toggle 
                        checked={enable3DTilt} 
                        onChange={(c) => onEnable3DTiltChange?.(c)} 
                        label="3D Hover Effects" 
                        description="Tilt albumcoveret blødt efter musens bevægelse"
                        accentColor={accentColor}
                      />
                      <Toggle 
                        checked={showVolumeSlider} 
                        onChange={(c) => onShowVolumeSliderChange?.(c)} 
                        label="Persistent Volume" 
                        description="Vis fast lydstyrke-slider under afspilleren"
                        accentColor={accentColor}
                      />
                      <Toggle 
                        checked={showSettingsButton} 
                        onChange={(c) => onShowSettingsButtonChange?.(c)} 
                        label="Persistent Settings Icon" 
                        description="Vis et fast ⚙-ikon i afspillerens kontroller"
                        accentColor={accentColor}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Keyboard Shortcuts & System Trigger */}
          <div className="pt-5 border-t border-white/5 flex flex-col items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
                }, 150);
              }}
              className={`text-xs ${theme.text} ${theme.textHover} transition-colors flex items-center gap-1.5 font-light cursor-pointer py-1 px-3 rounded-full bg-white/[0.02] border border-white/8 hover:bg-white/[0.05]`}
            >
              <span>Keyboard Shortcuts Map (?)</span>
            </motion.button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('elva-reset-tour'));
              }}
              className="text-[10px] text-white/30 hover:text-white/50 transition-all cursor-pointer font-light mt-1.5 uppercase tracking-[0.12em]"
            >
              Reset Onboarding Tour
            </button>
            <p className="text-[9px] text-white/15 text-center font-light uppercase tracking-[0.2em] mt-1 select-none">
              Elva Music Player • Scandinavian Design
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
