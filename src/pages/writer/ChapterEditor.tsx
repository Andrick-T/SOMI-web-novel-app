import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Bold, Italic, AlignLeft, AlignCenter, Minus, CheckCircle, Clock, Eye } from "lucide-react";
import type { CommonProps } from "../../types";

type SaveState = "saved" | "saving" | "unsaved";

export default function ChapterEditor({ navigate }: CommonProps) {
  const [title, setTitle] = useState("Chapter 9: The Root Bleeds Gold");
  const [content, setContent] = useState(
    "The old man's hands were stained the colour of baobab sap when Adaeze finally found him at the base of the oldest tree in the grove.\n\nShe had been searching for three days. Three days of following whispers through the market, of trading kola nuts for clues, of bribing children with stories. And here he was — Nwachukwu, the last keeper of the root language — sitting as though he had been waiting for her since before she was born.\n\n«You came alone,» he said without turning. «That is either courage or foolishness.\"\n\n\"Both,\" said Adaeze, and sat beside him in the red dust.\n\nThe grove hummed. Somewhere above them, the baobab's vast crown shivered with birds she could not name. The light through the leaves was the same colour as the stain on his hands — gold with something darker underneath."
  );
  const [wordCount, setWordCount] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [previewMode, setPreviewMode] = useState(false);
  const [notes, setNotes] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [content]);

  const handleChange = (val: string) => {
    setContent(val);
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveState("saving");
      setTimeout(() => setSaveState("saved"), 900);
    }, 1800);
  };

  const insertFormat = (prefix: string, suffix = prefix) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const newContent = content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
    handleChange(newContent);
  };

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ background: "#0d0f0b" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-3 sticky top-0 z-10"
        style={{ background: "#0d0f0b", borderBottom: "1px solid #1e2118" }}
      >
        <button onClick={() => navigate("writer-books")} className="p-1.5">
          <ArrowLeft size={20} color="#4ade80" />
        </button>

        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-sm font-display font-semibold outline-none truncate"
            style={{ color: "#f0ece4" }}
          />
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px]" style={{ color: "#4a6540" }}>{wordCount.toLocaleString()} words</span>
            <span style={{ color: "#2a3525" }}>·</span>
            {saveState === "saved" && (
              <span className="flex items-center gap-1 text-[9px]" style={{ color: "#4ade80" }}>
                <CheckCircle size={8} /> Saved
              </span>
            )}
            {saveState === "saving" && (
              <span className="flex items-center gap-1 text-[9px]" style={{ color: "#6a8060" }}>
                <Clock size={8} /> Saving…
              </span>
            )}
            {saveState === "unsaved" && (
              <span className="text-[9px]" style={{ color: "#fbbf24" }}>Unsaved</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setPreviewMode(!previewMode)}
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
          {/* Toolbar */}
          <div
            className="flex items-center gap-1 px-4 py-2 sticky z-10"
            style={{ top: 77, background: "#131510", borderBottom: "1px solid #1e2118" }}
          >
            {[
              { icon: <Bold size={14} />, action: () => insertFormat("**") },
              { icon: <Italic size={14} />, action: () => insertFormat("_") },
              { icon: <AlignLeft size={14} />, action: () => {} },
              { icon: <AlignCenter size={14} />, action: () => {} },
              { icon: <Minus size={14} />, action: () => { const n = content + "\n\n---\n\n"; handleChange(n); } },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-9 h-9 flex items-center justify-center rounded-lg active:scale-90 transition-transform"
                style={{ color: "#4ade80", background: "#1e2118" }}
              >
                {item.icon}
              </button>
            ))}

            <div className="flex-1" />

            <button
              className="px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95"
              style={{ background: "#4ade80", color: "#0d1208" }}
              onClick={() => setSaveState("saving")}
            >
              Publish
            </button>
          </div>

          {/* Writing area */}
          <div className="flex-1 px-5 pt-4 pb-32">
            <textarea
              ref={textRef}
              value={content}
              onChange={e => handleChange(e.target.value)}
              placeholder="Begin your chapter…"
              className="w-full min-h-[70vh] bg-transparent resize-none outline-none text-base leading-[1.85] font-serif"
              style={{ color: "#d8d0b8", caretColor: "#4ade80" }}
            />
          </div>

          {/* Author notes */}
          <div
            className="mx-5 mb-8 rounded-xl p-4"
            style={{ background: "#1e2118", border: "1px solid #2a3525" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#4a6540" }}>
              Author Note (optional)
            </p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Leave a note for your readers…"
              rows={2}
              className="w-full bg-transparent resize-none outline-none text-xs leading-relaxed"
              style={{ color: "#8a9880" }}
            />
          </div>
        </>
      ) : (
        /* Preview mode */
        <div className="flex-1 px-6 py-6 pb-16">
          <h2
            className="font-display text-xl font-semibold mb-1"
            style={{ color: "#f0ece4" }}
          >
            {title}
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
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "#4a6540" }}>
                Author Note
              </p>
              <p className="text-sm italic" style={{ color: "#8a9880" }}>{notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
