import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from './themeUtils';

interface SettingsModalProps {
  onClose: () => void;
  backgroundStyle?: 'default' | 'particles' | 'liquid' | 'mesh';
  onBackgroundStyleChange?: (style: 'default' | 'particles' | 'liquid' | 'mesh') => void;
  themePreset?: 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset';
  onThemePresetChange?: (theme: 'dynamic' | 'cyberpunk' | 'obsidian' | 'aurora' | 'sunset') => void;
  accentColor?: AccentColor;
  onAccentColorChange?: (color: AccentColor) => void;
  showVisualizer?: boolean;
  onShowVisualizerChange?: (show: boolean) => void;
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
    <div 
      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" 
      onClick={() => onChange(!checked)}
    >
      <div className="text-left pr-4">
        <span className={`text-sm block transition-colors ${checked ? 'text-white' : 'text-white/80'}`}>{label}</span>
        <span className="text-xs text-white/40 font-light">{description}</span>
      </div>
      <div className={`w-12 h-6 rounded-full shrink-0 relative border transition-colors duration-300 ${checked ? activeBgs[accentColor] : 'bg-white/10 border-white/5'}`}>
        <motion.div
          animate={{ x: checked ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </div>
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
  showVisualizer = false,
  onShowVisualizerChange,
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
    emerald: 'bg-emerald-950/20 border-emerald-500/40',
    sand: 'bg-amber-950/20 border-amber-500/40',
    wine: 'bg-rose-950/20 border-rose-500/40',
    navy: 'bg-slate-900/25 border-slate-500/40'
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
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-4 bg-[#0a0a0a]/60 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-4 rounded-full ${headerIndicatorBgs[accentColor]}`} />
            <h2 className="text-xl font-light text-white/80 tracking-wide">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Accent Color Section */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3 px-1">Accent Color</h3>
            <div className="grid grid-cols-4 gap-2">
              {(['emerald', 'sand', 'wine', 'navy'] as AccentColor[]).map((color) => {
                const isActive = accentColor === color;
                
                const swatchBgs = {
                  emerald: 'bg-emerald-500',
                  sand: 'bg-amber-500',
                  wine: 'bg-rose-500',
                  navy: 'bg-slate-500'
                };

                const activeBorders = {
                  emerald: 'border-emerald-500/40 bg-emerald-950/20',
                  sand: 'border-amber-500/40 bg-amber-950/20',
                  wine: 'border-rose-500/40 bg-rose-950/20',
                  navy: 'border-slate-500/40 bg-slate-900/25'
                };

                return (
                  <button
                    key={color}
                    onClick={() => onAccentColorChange?.(color)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? activeBorders[color]
                        : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${swatchBgs[color]} shrink-0`} />
                    <span className={`text-[10px] font-light truncate max-w-full ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {color === 'emerald' ? 'Emerald' : color === 'sand' ? 'Sand' : color === 'wine' ? 'Wine' : 'Navy'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3 px-1">Background Style</h3>
            <div className="space-y-2">
              <button
                onClick={() => onBackgroundStyleChange?.('default')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  backgroundStyle === 'default'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="text-left">
                  <span className={`text-sm block font-light ${backgroundStyle === 'default' ? 'text-white' : 'text-white/70'}`}>Default</span>
                  <span className="text-xs text-white/40">Subtle ambient gradients</span>
                </div>
              </button>

              <button
                onClick={() => onBackgroundStyleChange?.('particles')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  backgroundStyle === 'particles'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="text-left">
                  <span className={`text-sm block font-light ${backgroundStyle === 'particles' ? 'text-white' : 'text-white/70'}`}>Particles</span>
                  <span className="text-xs text-white/40">Floating particles & waves</span>
                </div>
              </button>

              <button
                onClick={() => onBackgroundStyleChange?.('liquid')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  backgroundStyle === 'liquid'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="text-left">
                  <span className={`text-sm block font-light ${backgroundStyle === 'liquid' ? 'text-white' : 'text-white/70'}`}>Liquid (Classic)</span>
                  <span className="text-xs text-white/40">Large flowing gradients</span>
                </div>
              </button>

              <button
                onClick={() => onBackgroundStyleChange?.('mesh')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  backgroundStyle === 'mesh'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="text-left">
                  <span className={`text-sm block font-light ${backgroundStyle === 'mesh' ? 'text-white' : 'text-white/85'}`}>Fluid Mesh</span>
                  <span className="text-xs text-white/40 font-light">Spotify-style ultra melting colors</span>
                </div>
              </button>
            </div>
          </div>

          {/* Color Theme Preset */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3 px-1">Theme Preset</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onThemePresetChange?.('dynamic')}
                className={`col-span-2 flex items-center justify-between p-3 rounded-xl border transition-all ${
                  themePreset === 'dynamic'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-400 via-emerald-400 to-blue-400 shrink-0" />
                  <div>
                    <span className={`text-sm block font-light ${themePreset === 'dynamic' ? 'text-white' : 'text-white/70'}`}>Dynamic Cover</span>
                    <span className="text-xs text-white/40 font-light">Colors extracted from active album art</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onThemePresetChange?.('cyberpunk')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  themePreset === 'cyberpunk'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f43f5e] via-[#06b6d4] to-[#8b5cf6] shrink-0" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'cyberpunk' ? 'text-white' : 'text-white/70'}`}>Cyberpunk</span>
                    <span className="text-[10px] text-white/40 truncate block font-light">Neon Vibe</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onThemePresetChange?.('obsidian')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  themePreset === 'obsidian'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#475569] via-[#020617] to-[#0f172a] shrink-0" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'obsidian' ? 'text-white' : 'text-white/70'}`}>Obsidian</span>
                    <span className="text-[10px] text-white/40 truncate block font-light">Deep Space</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onThemePresetChange?.('aurora')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  themePreset === 'aurora'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#10b981] via-[#6366f1] to-[#059669] shrink-0" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'aurora' ? 'text-white' : 'text-white/70'}`}>Aurora</span>
                    <span className="text-[10px] text-white/40 truncate block font-light">Emerald Aurora</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onThemePresetChange?.('sunset')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  themePreset === 'sunset'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left overflow-hidden">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f97316] via-[#7c3aed] to-[#d946ef] shrink-0" />
                  <div className="truncate">
                    <span className={`text-sm block truncate font-light ${themePreset === 'sunset' ? 'text-white' : 'text-white/70'}`}>Sunset</span>
                    <span className="text-[10px] text-white/40 truncate block font-light">Sunset Horizon</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Background Texture Section */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3 px-1">Background Texture</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onTextureStyleChange?.('paper')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all gap-1.5 cursor-pointer ${
                  textureStyle === 'paper'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <span className={`text-xs block font-semibold ${textureStyle === 'paper' ? 'text-white' : 'text-white/60'}`}>Organic Paper</span>
                <span className="text-[9px] text-white/35 font-light">Subtle tactile pulp</span>
              </button>

              <button
                onClick={() => onTextureStyleChange?.('dots')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all gap-1.5 cursor-pointer ${
                  textureStyle === 'dots'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <span className={`text-xs block font-semibold ${textureStyle === 'dots' ? 'text-white' : 'text-white/60'}`}>Halftone Dots</span>
                <span className="text-[9px] text-white/35 font-light">Rotated print dots</span>
              </button>

              <button
                onClick={() => onTextureStyleChange?.('none')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all gap-1.5 cursor-pointer ${
                  textureStyle === 'none'
                    ? activeBorder
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                }`}
              >
                <span className={`text-xs block font-semibold ${textureStyle === 'none' ? 'text-white' : 'text-white/60'}`}>Pure Glass</span>
                <span className="text-[9px] text-white/35 font-light">Clean glass layers</span>
              </button>
            </div>
          </div>

          {/* Interface Preferences */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3 px-1">Interface & Experience</h3>
            <div className="space-y-3">
              <Toggle 
                checked={showVisualizer} 
                onChange={(c) => onShowVisualizerChange?.(c)} 
                label="360° Audio Visualizer Ring" 
                description="Glow-reactive radial spectrum wave behind album cover"
                accentColor={accentColor}
              />
              <Toggle 
                checked={zenMode} 
                onChange={(c) => onZenModeChange?.(c)} 
                label="Zen Mode" 
                description="Auto-hide UI controls when the mouse is idle"
                accentColor={accentColor}
              />
              <Toggle 
                checked={showVolumeSlider} 
                onChange={(c) => onShowVolumeSliderChange?.(c)} 
                label="External Volume Slider" 
                description="Show a persistent volume slider outside the artwork"
                accentColor={accentColor}
              />
              <Toggle 
                checked={enable3DTilt} 
                onChange={(c) => onEnable3DTiltChange?.(c)} 
                label="3D Hover Effects" 
                description="Tilt the artwork card when moving the mouse"
                accentColor={accentColor}
              />
              <Toggle 
                checked={showSettingsButton} 
                onChange={(c) => onShowSettingsButtonChange?.(c)} 
                label="Show Settings Button" 
                description="Show a persistent Settings button in the bottom controls row"
                accentColor={accentColor}
              />
            </div>
          </div>

          {/* Keyboard Shortcuts Trigger */}
          <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                setTimeout(() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
                }, 150);
              }}
              className={`text-xs ${theme.text} ${theme.textHover} transition-colors flex items-center gap-1.5 font-light cursor-pointer`}
            >
              <span>Keyboard Shortcuts Map (?)</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('elva-reset-tour'));
              }}
              className="text-[10px] text-white/30 hover:text-white/50 transition-colors cursor-pointer font-light mt-0.5 uppercase tracking-[0.1em]"
            >
              Reset Onboarding Tour
            </button>
            <p className="text-[10px] text-white/20 text-center font-light uppercase tracking-wider mt-1">
              Elva v1.0 • Nordic Immersive
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
