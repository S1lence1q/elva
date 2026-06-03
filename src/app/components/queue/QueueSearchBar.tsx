import { Search, Upload, X } from 'lucide-react';

interface QueueSearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function QueueSearchBar({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onUploadClick,
  onFileChange,
  searchInputRef,
  fileInputRef,
}: QueueSearchBarProps) {
  return (
    <div className="relative px-5 py-4 border-b border-white/[0.08] shrink-0 z-10 flex gap-2.5 bg-[#0a0b10]/25 items-center">
      <div className="relative flex-1">
        <button
          onClick={onSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-all cursor-pointer z-10"
          title="Execute search"
        >
          <Search className="w-4 h-4" />
        </button>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Search songs or paste links..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full pl-12 pr-10 py-3 rounded-2xl bg-[#0a0b10]/45 border border-white/[0.06] hover:border-white/12 focus:border-white/20 focus:bg-[#13141b]/60 text-white placeholder-white/30 text-sm focus:outline-none transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white/60 transition-colors z-10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        onClick={onUploadClick}
        className="w-[46px] h-[46px] p-0 rounded-2xl bg-[#0a0b10]/45 hover:bg-[#13141b]/60 border border-white/[0.06] hover:border-white/12 active:scale-95 transition-all text-white/50 hover:text-white shrink-0 cursor-pointer flex items-center justify-center shadow-sm"
        title="Upload custom audio file"
      >
        <Upload className="w-4 h-4" />
      </button>
      <input ref={fileInputRef} type="file" accept="audio/*" onChange={onFileChange} className="hidden" />
    </div>
  );
}
