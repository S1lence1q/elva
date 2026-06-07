import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sliders, Layers, Maximize2, Settings, RefreshCw, Keyboard } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { AccentColor, ACCENT_THEMES, ACCENT_SWATCH } from '../themeUtils';
import { showMiniHUD } from '../../utils/hudUtils';

interface AdvancedSettingsTabProps {
  accentColor: AccentColor;
  onAccentColorChange?: (color: AccentColor) => void;
  textureStyle: 'paper' | 'dots' | 'none';
  onTextureStyleChange?: (style: 'paper' | 'dots' | 'none') => void;
  backgroundStyle: 'default' | 'particles' | 'liquid' | 'mesh';
  onBackgroundStyleChange?: (style: 'default' | 'particles' | 'liquid' | 'mesh') => void;
  zenMode: boolean;
  onZenModeChange?: (zen: boolean) => void;
  showVolumeSlider: boolean;
  onShowVolumeSliderChange?: (show: boolean) => void;
  enable3DTilt: boolean;
  onEnable3DTiltChange?: (enable: boolean) => void;
  showSettingsButton: boolean;
  onShowSettingsButtonChange?: (show: boolean) => void;
  enableCustomLyrics: boolean;
  onEnableCustomLyricsChange?: (enable: boolean) => void;
  peekProgressStyle: 'none' | 'line' | 'border';
  onPeekProgressStyleChange: (style: 'none' | 'line' | 'border') => void;
  showVisualizer: boolean;
  onShowVisualizerChange?: (show: boolean) => void;
}

function SettingsToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
  description: string;
  accentColor: AccentColor;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300 cursor-pointer select-none"
    >
      <div className="text-left pr-4">
        <span className="text-xs font-semibold text-white/90 block">{label}</span>
        <span className="text-[10px] text-white/40 font-light mt-1 block leading-normal">{description}</span>
      </div>
      <div
        className={`w-10 h-5.5 rounded-full shrink-0 relative border transition-all duration-300 ${
          checked ? 'bg-elva-accent-soft border-elva-accent' : 'bg-white/5 border-white/5'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 18 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full transition-shadow duration-300 ${
            checked ? 'bg-white shadow-[0_0_10px_var(--elva-accent)]' : 'bg-white/40'
          }`}
        />
      </div>
    </div>
  );
}

export const AdvancedSettingsTab: React.FC<AdvancedSettingsTabProps> = ({
  accentColor,
  onAccentColorChange,
  textureStyle,
  onTextureStyleChange,
  zenMode,
  onZenModeChange,
  showVolumeSlider,
  onShowVolumeSliderChange,
  enable3DTilt,
  onEnable3DTiltChange,
  showSettingsButton,
  onShowSettingsButtonChange,
  enableCustomLyrics,
  onEnableCustomLyricsChange,
  peekProgressStyle,
  onPeekProgressStyleChange,
}) => {
  const theme = ACCENT_THEMES[accentColor];

  const [crossfade, setCrossfade] = useState<number>(() => {
    const saved = localStorage.getItem('elva_crossfade_duration');
    return saved !== null ? parseFloat(saved) : 3.0;
  });

  const handleCrossfadeChange = (val: number) => {
    setCrossfade(val);
    localStorage.setItem('elva_crossfade_duration', String(val));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
    >
      <div className="space-y-8">
        <div className="rounded-3xl elva-glass-elevated p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2 select-none">
            <Sliders className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Audio Preferences</h3>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/[0.015] border border-white/[0.03] flex flex-col gap-3 hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-semibold text-white/95">Crossfade Duration</span>
              <span className={`text-xs font-bold ${theme.text}`}>
                {crossfade === 0 ? 'Off (Gapless)' : `${crossfade}s`}
              </span>
            </div>
            <div className="flex items-center gap-3 py-1">
              <span className="text-[9px] text-white/30 w-5 select-none font-bold">Off</span>
              <Slider.Root
                value={[crossfade]}
                max={12}
                step={1}
                onValueChange={(val) => handleCrossfadeChange(val[0])}
                className="relative flex items-center flex-1 h-4 cursor-pointer group/slider select-none"
              >
                <Slider.Track className="relative h-[3.5px] w-full bg-white/10 rounded-full overflow-hidden">
                  <Slider.Range className="absolute h-full bg-current" style={{ backgroundColor: 'var(--elva-accent)' }} />
                </Slider.Track>
                <Slider.Thumb className="block w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover/slider:opacity-100 focus:opacity-100 focus:outline-none transition-opacity duration-150 shadow-md" />
              </Slider.Root>
              <span className="text-[9px] text-white/30 w-6 text-right select-none font-bold">12s</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl elva-glass-elevated p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2 select-none">
            <Settings className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Interface Toggles</h3>
          </div>

          <div className="space-y-3">
            <SettingsToggle
              checked={showVolumeSlider}
              onChange={onShowVolumeSliderChange || (() => {})}
              label="Always Show Volume Slider"
              description="Keep the volume controller visible at the bottom of player controls."
              accentColor={accentColor}
            />
            <SettingsToggle
              checked={showSettingsButton}
              onChange={onShowSettingsButtonChange || (() => {})}
              label="Persistent Settings Gear"
              description="Keep the gear icon permanently visible in the player controls overlay."
              accentColor={accentColor}
            />
            <SettingsToggle
              checked={enableCustomLyrics}
              onChange={onEnableCustomLyricsChange || (() => {})}
              label="Custom Lyrics Editor"
              description="Show an edit/upload button in the lyrics drawer to edit song lyrics manually."
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="rounded-3xl elva-glass-elevated p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2 select-none">
            <Layers className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">Visual Settings</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300 select-none">
              <div className="text-left pr-4">
                <span className="text-xs font-semibold text-white/90 block">Film Grain & Noise</span>
                <span className="text-[10px] text-white/40 font-light mt-1 block leading-normal">
                  Overlay analog noise for a paper-like, tactile appearance.
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] rounded-xl p-1 shrink-0">
                {(['paper', 'dots', 'none'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => onTextureStyleChange?.(style)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      textureStyle === style
                        ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                        : 'text-white/30 hover:text-white/60 border border-transparent'
                    }`}
                  >
                    {style === 'paper' ? 'Grain' : style === 'dots' ? 'Dots' : 'Off'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300 select-none">
              <div className="text-left pr-4">
                <span className="text-xs font-semibold text-white/90 block">Progress Indicator</span>
                <span className="text-[10px] text-white/40 font-light mt-1 block leading-normal">
                  Style of the progress bar shown on the artwork card when controls are hidden.
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] rounded-xl p-1 shrink-0">
                {([
                  { value: 'none', label: 'Off' },
                  { value: 'line', label: 'Classic' },
                  { value: 'border', label: 'Glowing' }
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onPeekProgressStyleChange?.(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      peekProgressStyle === opt.value
                        ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                        : 'text-white/30 hover:text-white/60 border border-transparent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <SettingsToggle
              checked={enable3DTilt}
              onChange={onEnable3DTiltChange || (() => {})}
              label="3D Artwork Tilt Hover"
              description="Subtly tilt the album cover artwork according to your mouse pointer placement."
              accentColor={accentColor}
            />
            <SettingsToggle
              checked={zenMode}
              onChange={onZenModeChange || (() => {})}
              label="Inactivity Zen Mode"
              description="Automatically hide playback controls after 3 seconds of inactivity during play."
              accentColor={accentColor}
            />
          </div>
        </div>

        <div className="rounded-3xl elva-glass-elevated p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2 select-none">
            <Maximize2 className={`w-4 h-4 ${theme.text}`} />
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">System Utilities</h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5 select-none">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('elva-reset-tour'));
                showMiniHUD('Tour reset! Ready to start next play.');
              }}
              className="group flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.06] text-white/45 hover:text-white transition-all duration-300 cursor-pointer h-24 text-center"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 text-white/40 group-hover:text-white" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Reset Tour</span>
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
              }}
              className="group flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.06] text-white/45 hover:text-white transition-all duration-300 cursor-pointer h-24 text-center"
            >
              <Keyboard className="w-4 h-4 text-white/40 group-hover:text-white transition-all" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Keyboard Map</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.015] border border-white/[0.03] space-y-3">
            <span className="text-[9px] font-bold text-white/35 uppercase tracking-wider block">Accent Tone Swatches</span>
            <div className="grid grid-cols-4 gap-2.5">
              {(['emerald', 'sand', 'wine', 'navy'] as AccentColor[]).map((color) => {
                const isActive = accentColor === color;
                const swatch = ACCENT_SWATCH[color];
                return (
                  <button
                    key={color}
                    onClick={() => onAccentColorChange?.(color)}
                    className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'border-elva-accent bg-elva-accent-softer shadow-elva-accent-glow'
                        : 'bg-white/[0.015] border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.06]'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: swatch.core }}
                    />
                    <span className={`text-[9px] font-semibold truncate max-w-full tracking-wide uppercase ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
