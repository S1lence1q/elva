import React from 'react';
import { motion } from 'motion/react';
import { X, ChevronDown } from 'lucide-react';
import { STOREFRONT_COUNTRIES } from '../../utils/chartFeeds';

interface ProfileCustomizerModalProps {
  onClose: () => void;
  tempName: string;
  setTempName: (name: string) => void;
  tempAvatar: string;
  setTempAvatar: (avatar: string) => void;
  tempCountry: string;
  setTempCountry: (country: string) => void;
  onSave: () => void;
}

const PRESET_GRADIENTS = [
  'from-amber-400 via-rose-500 to-indigo-600',
  'from-emerald-400 via-cyan-500 to-blue-600',
  'from-slate-800 via-neutral-900 to-zinc-700',
  'from-pink-400 via-purple-500 to-indigo-500',
  'from-teal-400 via-slate-500 to-amber-200'
];

export function ProfileCustomizerModal({
  onClose,
  tempName,
  setTempName,
  tempAvatar,
  setTempAvatar,
  tempCountry,
  setTempCountry,
  onSave
}: ProfileCustomizerModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onClick={(e) => e.stopPropagation()}
      className="relative bg-[#09090c]/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-7 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 flex flex-col gap-6 text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-white/90">Customize Space</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Edit Avatar */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Avatar Aurora Glow</span>
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          {/* Monogram Selector */}
          <button
            onClick={() => setTempAvatar('initials')}
            className={`w-9 h-9 rounded-full overflow-hidden border transition-all ${
              tempAvatar === 'initials'
                ? 'border-white scale-110 shadow-lg bg-white/20'
                : 'border-white/10 bg-white/5 opacity-50 hover:opacity-100'
            } cursor-pointer flex items-center justify-center`}
            title="Monogram Initials"
          >
            <span className="text-[11px] font-extrabold text-white">
              {tempName.trim() ? tempName.trim().charAt(0).toUpperCase() : 'M'}
            </span>
          </button>

          {/* Gradient Presets */}
          {PRESET_GRADIENTS.map((grad, idx) => (
            <button
              key={idx}
              onClick={() => setTempAvatar(grad)}
              className={`w-9 h-9 rounded-full overflow-hidden border transition-all ${
                tempAvatar === grad
                  ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'border-white/10 opacity-50 hover:opacity-100'
              } cursor-pointer bg-gradient-to-tr ${grad}`}
              title={`Aurora preset ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Edit Username */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Curator Name</span>
        <input
          type="text"
          placeholder="Enter name..."
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          maxLength={20}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 transition-all font-medium"
        />
      </div>

      {/* Edit Storefront Country */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Music Storefront Country</span>
        <div className="relative">
          <select
            value={tempCountry}
            onChange={(e) => setTempCountry(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white/25 transition-all font-medium appearance-none cursor-pointer"
          >
            {STOREFRONT_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#09090c] text-white">
                {c.flag} {c.name} ({c.code.toUpperCase()})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-white/40" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4 mt-1 select-none">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-2xl text-xs text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer font-bold uppercase tracking-wider"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-5 py-2.5 rounded-2xl text-xs text-black bg-white hover:bg-white/90 transition-all cursor-pointer font-extrabold uppercase tracking-wider shadow-lg"
        >
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
