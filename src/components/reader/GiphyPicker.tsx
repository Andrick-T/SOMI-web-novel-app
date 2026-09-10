import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
  giphyRepository,
  type GiphyGif,
} from "../../services/repositories/giphyRepository";

type GiphyPickerProps = {
  onSelect: (gif: GiphyGif) => void;
  onClose: () => void;
  background: string;
  textColor: string;
};

export default function GiphyPicker({
  onSelect,
  onClose,
  background,
  textColor,
}: GiphyPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrending = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await giphyRepository.trending();
      setGifs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load GIFs.");
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (value: string) => {
    const normalized = value.trim();

    if (!normalized) {
      await loadTrending();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await giphyRepository.search(normalized);
      setGifs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search GIFs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTrending();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchGifs(query);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden border shadow-2xl"
      style={{
        background,
        color: textColor,
        borderColor: `${textColor}20`,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-3 border-b"
        style={{
          borderColor: `${textColor}15`,
        }}
      >
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: `${textColor}08`,
          }}
        >
          <Search
            size={15}
            style={{
              color: `${textColor}60`,
            }}
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search GIFs"
            maxLength={50}
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{
              color: textColor,
            }}
            aria-label="Search GIFs"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 active:scale-90"
              aria-label="Clear GIF search"
            >
              <X
                size={14}
                style={{
                  color: `${textColor}60`,
                }}
              />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
          style={{
            background: `${textColor}10`,
          }}
          aria-label="Close GIF picker"
        >
          <X size={16} />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto p-2">
        {loading && (
          <div
            className="py-10 text-center text-xs"
            style={{
              color: `${textColor}60`,
            }}
          >
            Loading GIFs…
          </div>
        )}

        {!loading && error && (
          <div className="py-10 px-4 text-center">
            <p
              className="text-xs"
              style={{
                color: `${textColor}70`,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div
            className="py-10 text-center text-xs"
            style={{
              color: `${textColor}60`,
            }}
          >
            No GIFs found.
          </div>
        )}

        {!loading && !error && gifs.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif)}
                className="relative aspect-square overflow-hidden rounded-lg bg-black/10 active:scale-[0.97] transition-transform"
                title={gif.title || "Select GIF"}
              >
                <img
                  src={gif.previewUrl}
                  alt={gif.title || "GIF"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attribution */}
      <div
        className="px-3 py-2 border-t"
        style={{
          borderColor: `${textColor}15`,
        }}
      >
        <span
          className="text-[9px]"
          style={{
            color: `${textColor}45`,
          }}
        >
          Powered by GIPHY
        </span>
      </div>
    </div>
  );
}
