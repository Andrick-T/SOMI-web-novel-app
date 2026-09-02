import type { Book } from "../services/repositories";
import type { Page } from "../types";
import { statusToneFor } from "../config/designSystem";
import { StatusBadge } from "./DesignPrimitives";

interface Props {
  book: Book;
  navigate: (page: Page, bookId?: string) => void;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  progress?: number;
}

export default function BookCard({
  book,
  navigate,
  size = "md",
  showProgress,
  progress = 0,
}: Props) {
  const dims =
    size === "sm"
      ? { w: 100, h: 150, titleSize: "text-[10px]", authorSize: "text-[9px]" }
      : size === "lg"
        ? { w: 160, h: 240, titleSize: "text-xs", authorSize: "text-[10px]" }
        : {
            w: 130,
            h: 195,
            titleSize: "text-[11px]",
            authorSize: "text-[10px]",
          };

  return (
    <button
      className="flex flex-col gap-2 flex-shrink-0 text-left active:scale-95 transition-transform duration-150"
      style={{ width: dims.w }}
      onClick={() => navigate("book", book.id)}
    >
      <div
        className="relative rounded-xl overflow-hidden book-shadow"
        style={{ width: dims.w, height: dims.h, background: "#1a1726" }}
      >
        <img
          src={book.cover}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
          }}
        />

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <StatusBadge
            label={book.status}
            tone={statusToneFor(book.status)}
            compact
          />
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p
            className={`font-display font-semibold leading-tight ${dims.titleSize}`}
            style={{ color: "#f0ece4" }}
          >
            {book.title}
          </p>
          <p
            className={`${dims.authorSize} mt-0.5`}
            style={{ color: "rgba(240,236,228,0.65)" }}
          >
            {book.author}
          </p>
        </div>
      </div>

      {showProgress && (
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-[9px]" style={{ color: "#8b7ea8" }}>
              Chapter {Math.ceil(progress / 12.5)}
            </span>
            <span className="text-[9px] font-bold" style={{ color: "#e8a84c" }}>
              {progress.toFixed(0)}%
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "#2e2945" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #e8a84c, #c4882e)",
              }}
            />
          </div>
        </div>
      )}

      {!showProgress && (
        <div className="flex items-center gap-1.5 flex-wrap px-0.5">
          {book.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#231f35", color: "#8b7ea8" }}
            >
              {g}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
