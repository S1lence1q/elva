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
    <div className="relative flex gap-2.5 items-center">
      <div className="relative flex-1">
        <button
          onClick={onSearch}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors cursor-pointer z-10"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Search or paste a link..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full pl-11 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.07] hover:border-white/[0.12] focus:border-white/[0.18] focus:bg-white/[0.07] text-white placeholder-white/25 text-sm focus:outline-none transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/55 transition-colors z-10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        onClick={onUploadClick}
        className="w-10 h-10 p-0 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.12] active:scale-95 transition-all text-white/35 hover:text-white/65 shrink-0 cursor-pointer flex items-center justify-center"
        title="Upload audio file"
      >
        <Upload className="w-3.5 h-3.5" />
      </button>
      <input ref={fileInputRef} type="file" accept="audio/*" onChange={onFileChange} className="hidden" />
    </div>
  );
}
