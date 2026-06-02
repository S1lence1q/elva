import { Edit2 } from 'lucide-react';
import { AccentColor, ACCENT_THEMES } from '../themeUtils';

interface ProfileHeaderProps {
  username: string;
  avatar: string;
  accentColor: AccentColor;
  totalListeningMinutes: number;
  uniqueSongsCount: number;
  totalPlayCount: number;
  onEditProfile: () => void;
}

export function ProfileHeader({
  username,
  avatar,
  accentColor,
  totalListeningMinutes,
  uniqueSongsCount,
  totalPlayCount,
  onEditProfile
}: ProfileHeaderProps) {
  const theme = ACCENT_THEMES[accentColor];

  return (
    <div className="rounded-3xl border border-white/5 bg-[#0f0f12]/35 backdrop-blur-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
      <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full ${theme.bgFade} blur-2xl opacity-20`} />

      {/* Left Side: Avatar & Username */}
      <div className="flex items-center gap-5 relative z-10 shrink-0 select-none">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 border border-white/15 bg-gradient-to-tr shadow-lg bg-[#0f0f12] group-hover:border-white/30 transition-all duration-300">
            {avatar === 'initials' ? (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-white/[0.04] to-white/[0.12] backdrop-blur-md relative overflow-hidden">
                <span className="text-xl font-extrabold text-white tracking-tighter">
                  {username.trim() ? username.trim().charAt(0).toUpperCase() : 'M'}
                </span>
              </div>
            ) : (
              <div className={`w-full h-full rounded-full bg-gradient-to-tr ${avatar}`} />
            )}
          </div>
          {/* Soft pulsing halo */}
          <div className="absolute inset-0 rounded-full bg-white/5 -z-10 blur-md group-hover:bg-white/10 transition-all duration-300" />
        </div>

        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-white/30">Music Curator</span>
          <div className="flex items-center gap-2.5">
            <h2 
              className="text-2xl font-normal text-white/95 tracking-wide leading-tight truncate max-w-[180px] md:max-w-[240px]" 
              style={{ fontFamily: '"Kaobe", serif' }}
              title={username}
            >
              {username}
            </h2>
            <button
              onClick={onEditProfile}
              className="p-1.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all duration-300 cursor-pointer"
              title="Customize Profile Space"
            >
              <Edit2 className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Sleek typographic Metric Pillars */}
      <div className="flex items-center gap-6 relative z-10 shrink-0 md:border-l md:border-white/5 md:pl-8 py-1">
        <div className="text-center group min-w-[70px]">
          <p className="text-xl font-medium text-white tracking-tight leading-none">{totalListeningMinutes}m</p>
          <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mt-1.5">Minutes</p>
        </div>

        <div className="h-6 w-px bg-white/5" />

        <div className="text-center group min-w-[70px]">
          <p className="text-xl font-medium text-white tracking-tight leading-none">{uniqueSongsCount}</p>
          <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mt-1.5">Songs</p>
        </div>

        <div className="h-6 w-px bg-white/5" />

        <div className="text-center group min-w-[70px]">
          <p className="text-xl font-medium text-white tracking-tight leading-none">{totalPlayCount}</p>
          <p className="text-[9px] uppercase tracking-wider text-white/35 font-bold mt-1.5">Plays</p>
        </div>
      </div>
    </div>
  );
}
