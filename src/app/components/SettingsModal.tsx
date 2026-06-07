import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Sliders, Moon, Layers, Maximize2, Edit3, Volume2, VolumeX, Volume1 } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { AccentColor, ACCENT_THEMES, ACCENT_SWATCH } from './themeUtils';

interface SettingsModalProps {
  onClose: () => void;
  backgroundStyle?: 'default' | 'particles' | 'liquid' | 'mesh';
  onBackgroundStyleChange?: (style: 'default' | 'particles' | 'liquid' | 'mesh') => void;
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
  enableCustomLyrics?: boolean;
  onEnableCustomLyricsChange?: (enable: boolean) => void;
  showVisualizer?: boolean;
  onShowVisualizerChange?: (show: boolean) => void;
  volume?: number;
  onVolumeChange?: (v: number) => void;
}

function QuickToggle({ 
  checked, 
  onChange, 
  label, 
  icon: Icon,
  accentColor 
}: { 
  checked: boolean; 
  onChange: (c: boolean) => void; 
  label: string; 
  icon: any;
  accentColor: AccentColor; 
}) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-300 text-left cursor-pointer w-full select-none ${
        checked 
          ? `bg-elva-accent-softer border-elva-accent text-white` 
          : 'bg-white/[0.015] border-white/[0.03] text-white/45 hover:bg-white/[0.03] hover:text-white/70 hover:border-white/[0.08]'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${checked ? 'text-elva-accent' : 'text-current'}`} />
      <span className="text-xs font-light tracking-wide truncate">{label}</span>
    </motion.button>
  );
}

export function SettingsModal({ 
  onClose, 
  backgroundStyle = 'mesh', 
  onBackgroundStyleChange,
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
  onTextureStyleChange,
  enableCustomLyrics = false,
  onEnableCustomLyricsChange,
  showVisualizer = false,
  onShowVisualizerChange,
  volume,
  onVolumeChange
}: SettingsModalProps) {
  const [localVolume, setLocalVolume] = useState(() => {
    const saved = localStorage.getItem('elva_player_volume');
    return saved !== null ? parseInt(saved, 10) : 70;
  });

  const displayVolume = volume !== undefined ? volume : localVolume;

  const handleVolumeChangeInternal = (val: number) => {
    if (onVolumeChange) {
      onVolumeChange(val);
    } else {
      setLocalVolume(val);
      localStorage.setItem('elva_player_volume', String(val));
      window.dispatchEvent(new CustomEvent('elva-volume-change', { detail: { volume: val } }));
    }
  };

  const toggleMute = () => {
    if (displayVolume > 0) {
      localStorage.setItem('elva_pre_mute_volume', String(displayVolume));
      handleVolumeChangeInternal(0);
    } else {
      const saved = localStorage.getItem('elva_pre_mute_volume');
      const restoreVol = saved ? parseInt(saved, 10) : 70;
      handleVolumeChangeInternal(restoreVol > 0 ? restoreVol : 70);
    }
  };
  
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] mx-4 elva-glass-chrome rounded-[32px] overflow-hidden flex flex-col p-5 shadow-[0_32px_96px_rgba(0,0,0,0.85)] gap-5 text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 select-none">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold">Quick Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/8 transition-all hover:scale-105 duration-200 cursor-pointer"
          >
            <X className="w-4 h-4 text-white/40 hover:text-white/80 transition-colors" />
          </button>
        </div>

        {/* Volume Controller Card */}
        <div className="bg-white/[0.015] border border-white/[0.03] rounded-2xl p-4 flex flex-col gap-3 text-left">
          <div className="flex items-center justify-between select-none">
            <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">Volume</span>
            <span className={`text-[10px] font-bold ${theme.text}`}>{displayVolume}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-white/40 hover:text-white/85 transition-colors shrink-0 cursor-pointer">
              {displayVolume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : displayVolume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <Slider.Root
              value={[displayVolume]}
              max={100}
              step={1}
              onValueChange={(val) => handleVolumeChangeInternal(val[0])}
              className="relative flex items-center flex-1 h-4 cursor-pointer group/slider select-none"
            >
              <Slider.Track className="relative h-[3.5px] w-full bg-white/10 rounded-full overflow-hidden">
                <Slider.Range className="absolute h-full bg-current" style={{ backgroundColor: 'var(--elva-accent)' }} />
              </Slider.Track>
              <Slider.Thumb className="block w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover/slider:opacity-100 focus:opacity-100 focus:outline-none transition-opacity duration-150 shadow-md" />
            </Slider.Root>
          </div>
        </div>

        {/* Toggles Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <QuickToggle 
            checked={zenMode} 
            onChange={(c) => onZenModeChange?.(c)} 
            label="Zen Mode" 
            icon={Moon}
            accentColor={accentColor}
          />
          <QuickToggle 
            checked={textureStyle !== 'none'} 
            onChange={(on) => onTextureStyleChange?.(on ? 'paper' : 'none')} 
            label="Film Grain" 
            icon={Layers}
            accentColor={accentColor}
          />
          <QuickToggle 
            checked={enable3DTilt} 
            onChange={(c) => onEnable3DTiltChange?.(c)} 
            label="3D Tilt" 
            icon={Maximize2}
            accentColor={accentColor}
          />
          <QuickToggle 
            checked={enableCustomLyrics} 
            onChange={(c) => onEnableCustomLyricsChange?.(c)} 
            label="Lyrics Editor" 
            icon={Edit3}
            accentColor={accentColor}
          />
        </div>

        {/* Accent Color card */}
        <div className="bg-white/[0.015] border border-white/[0.03] rounded-2xl p-4 flex flex-col gap-3.5 text-left">
          <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider select-none">Accent Color</span>
          <div className="flex items-center justify-between px-1">
            {(['emerald', 'sand', 'wine', 'navy'] as AccentColor[]).map((color) => {
              const isActive = accentColor === color;
              
              const swatch = ACCENT_SWATCH[color];

              return (
                <button
                  key={color}
                  onClick={() => onAccentColorChange?.(color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'scale-110 bg-white/5' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{
                    borderColor: isActive ? swatch.core : 'transparent',
                    boxShadow: 'none'
                  }}
                  title={ACCENT_THEMES[color].name}
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: swatch.core }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced settings button */}
        <button
          onClick={() => {
            onClose();
            // Close player if open by firing home, wait, then scroll to hub
            sessionStorage.setItem('elva_hub_active_tab', 'settings');
            window.dispatchEvent(new CustomEvent('elva-scroll-to-hub', { detail: { tab: 'settings' } }));
          }}
          className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/12 hover:border-elva-accent hover:text-elva-accent transition-all font-bold text-[10px] uppercase tracking-[0.18em] text-white/80 hover:text-white flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <Sliders className="w-3.5 h-3.5 text-current" />
          Advanced Settings
        </button>
      </motion.div>
    </motion.div>
  );
}
