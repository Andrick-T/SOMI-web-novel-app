import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bold, Clock, Eye, Italic } from "lucide-react";
import { useParams } from "react-router-dom";
import type { CommonProps } from "../../types";
import {
  countWords,
  createAutosaveState,
  estimateReadingTime,
  updateAutosaveState,
  validateChapter,
  writerRepository,
} from "../../features/writer";
import { ErrorState, StatusBadge } from "../../components/DesignPrimitives";
import { statusToneFor } from "../../config/designSystem";

export default function ChapterEditor({ navigate }: CommonProps) {
  const { bookId, chapterId } = useParams();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<number | null>(null);

  const currentBook = bookId ? writerRepository.getBook(bookId) : undefined;
  const startingChapter =
    bookId && chapterId
      ? writerRepository.getChapter(bookId, chapterId)
      : currentBook?.chapters[0];

  const [chapter, setChapter] = useState(startingChapter ?? null);
  const [title, setTitle] = useState(startingChapter?.title ?? "");
  const [content, setContent] = useState(startingChapter?.content ?? "");
  const [notes, setNotes] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [saveState, setSaveState] = useState(createAutosaveState());
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const nextChapter =
      bookId && chapterId
        ? writerRepository.getChapter(bookId, chapterId)
        : (currentBook?.chapters[0] ?? null);

    setChapter(nextChapter);
    setTitle(nextChapter?.title ?? "");
    setContent(nextChapter?.content ?? "");
    setSaveState(createAutosaveState());
    setErrors([]);
  }, [bookId, chapterId, currentBook]);

  const wordCount = countWords(content);
  const readTime = estimateReadingTime(wordCount);

  const persistChapter = () => {
    if (!bookId || !chapter) return;

    const validation = validateChapter({
      title,
      content,
      number: chapter.number,
      price: chapter.price,
      accessType: chapter.accessType,
    });

    if (!validation.isValid) {
      setErrors(validation.errors.map((error) => error.message));
      setSaveState((current) => updateAutosaveState(current, "ERROR"));
      return;
    }

    const nextChapter = {
      ...chapter,
      title: title.trim() || "Untitled chapter",
      content,
      wordCount,
      readingTime: estimateReadingTime(wordCount),
      updatedAt: new Date().toISOString(),
      status: "EDITING" as const,
    };

    writerRepository.saveChapterDraft(bookId, nextChapter);

    if (currentBook) {
      const draft = currentBook.draft ?? {
        id: `draft-${bookId}`,
        bookId,
        writerId: currentBook.writerId,
        version: 1,
        title: currentBook.title,
        synopsis: currentBook.synopsis,
        genres: currentBook.genres,
        tags: currentBook.tags,
        cover: currentBook.cover,
        updatedAt: new Date().toISOString(),
        status: "EDITING",
      };

      writerRepository.updateBookDraft(bookId, {
        ...draft,
        title: title.trim() || currentBook.title,
        synopsis: currentBook.synopsis,
        genres: currentBook.genres,
        tags: currentBook.tags,
        cover: currentBook.cover,
        updatedAt: new Date().toISOString(),
        status: "EDITING",
      });
    }

    setErrors([]);
    setChapter(nextChapter);
    setSaveState((current) => updateAutosaveState(current, "SAVED"));
  };

  const scheduleAutosave = () => {
    setSaveState((current) => updateAutosaveState(current, "DIRTY"));
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      persistChapter();
    }, 850);
  };

  const insertFormat = (prefix: string, suffix = prefix) => {
    const textarea = textRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const nextText = `${content.slice(0, start)}${prefix}${selectedText}${suffix}${content.slice(end)}`;
    setContent(nextText);
    scheduleAutosave();
  };

  if (!chapter) {
    return <ErrorState title="Chapter not found" />;
  }

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "var(--color-background)" }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-3 sticky top-0 z-10"
        style={{
          background: "var(--color-background)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <button
          onClick={() => navigate("writer-books")}
          className="p-1.5"
          aria-label="Back to books"
        >
          <ArrowLeft size={20} color="var(--color-accent-primary)" />
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              scheduleAutosave();
            }}
            className="w-full bg-transparent text-sm font-display font-semibold outline-none truncate"
            style={{ color: "#f0ece4" }}
            placeholder="Chapter title"
          />

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px]" style={{ color: "#4a6540" }}>
              {wordCount.toLocaleString()} words
            </span>
            <span style={{ color: "#2a3525" }}>·</span>
            {saveState.status === "SAVED" && (
              <StatusBadge
                label="Saved"
                tone={statusToneFor("SAVED")}
                compact
              />
            )}
            {saveState.status === "SAVING" && (
              <span
                className="flex items-center gap-1 text-[9px]"
                style={{ color: "#6a8060" }}
              >
                <Clock size={8} /> Saving…
              </span>
            )}
            {saveState.status === "DIRTY" && (
              <span className="text-[9px]" style={{ color: "#fbbf24" }}>
                Unsaved
              </span>
            )}
            {saveState.status === "ERROR" && (
              <span className="text-[9px]" style={{ color: "#fb7185" }}>
                {saveState.error ?? "Autosave failed"}
              </span>
            )}
            <span className="text-[9px]" style={{ color: "#4a6540" }}>
              {readTime} min read
            </span>
          </div>
        </div>

        <button
          onClick={() => setPreviewMode((value) => !value)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
          style={{
            background: previewMode ? "#4ade80" : "#1e2118",
            color: previewMode ? "#0d1208" : "#4ade80",
          }}
        >
          <Eye size={12} />
          {previewMode ? "Edit" : "Preview"}
        </button>
      </div>

      {!previewMode ? (
        <>
          <div
            className="flex items-center gap-1 px-4 py-2 sticky z-10"
            style={{
              top: 77,
              background: "#131510",
              borderBottom: "1px solid #1e2118",
            }}
          >
            {[
              { icon: <Bold size={14} />, action: () => insertFormat("**") },
              { icon: <Italic size={14} />, action: () => insertFormat("_") },
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-90 transition-transform"
                style={{ color: "#4ade80", background: "#1e2118" }}
                type="button"
              >
                {item.icon}
              </button>
            ))}
            <div className="flex-1" />
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
              style={{ background: "#4ade80", color: "#0d1208" }}
              onClick={() => {
                setSaveState((current) =>
                  updateAutosaveState(current, "SAVING"),
                );
                persistChapter();
              }}
            >
              Save draft
            </button>
          </div>

          <div className="flex-1 px-5 pt-4 pb-32">
            <textarea
              ref={textRef}
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                scheduleAutosave();
              }}
              placeholder="Begin your chapter…"
              className="w-full min-h-[70vh] bg-transparent resize-none outline-none text-base leading-[1.85] font-serif"
              style={{ color: "#d8d0b8", caretColor: "#4ade80" }}
            />
          </div>

          <div
            className="mx-5 mb-8 rounded-xl p-4"
            style={{ background: "#1e2118", border: "1px solid #2a3525" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: "#4a6540" }}
            >
              Author note (optional)
            </p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Leave a note for your readers…"
              rows={2}
              className="w-full bg-transparent resize-none outline-none text-xs leading-relaxed"
              style={{ color: "#8a9880" }}
            />
          </div>

          {errors.length > 0 && (
            <div className="mx-5 mb-5 rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 px-6 py-6 pb-16">
          <h2
            className="font-display text-xl font-semibold mb-1"
            style={{ color: "#f0ece4" }}
          >
            {title || "Untitled chapter"}
          </h2>
          <div
            className="w-8 h-0.5 rounded-full mb-6"
            style={{ background: "#4ade80" }}
          />
          <div
            className="text-base leading-[1.85] font-serif whitespace-pre-wrap"
            style={{ color: "#d8d0b8" }}
          >
            {content}
          </div>
          {notes && (
            <div
              className="mt-8 p-4 rounded-xl"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#4a6540" }}
              >
                Author note
              </p>
              <p className="text-sm italic" style={{ color: "#8a9880" }}>
                {notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
