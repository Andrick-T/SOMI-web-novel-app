import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { CommonProps } from "../../types";

const genres = ["Fantasy", "Thriller", "Family Saga", "Children's Story", "Adventure", "Romance", "Cultural Fiction", "Mystery"];

export default function WriterCreate({ navigate }: CommonProps) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#131510" }}>
      <div
        className="flex items-center gap-3 px-4 pt-10 pb-4 sticky top-0 z-10"
        style={{ background: "#131510", borderBottom: "1px solid #1e2118" }}
      >
        <button onClick={() => navigate("writer-books")} className="p-1.5">
          <ArrowLeft size={20} color="#4ade80" />
        </button>
        <h1 className="font-display text-lg font-bold flex-1" style={{ color: "#f0ece4" }}>New Book</h1>
        <button
          className="px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{ background: "#4ade80", color: "#0d1208" }}
          onClick={() => navigate("writer-editor")}
        >
          Create
        </button>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">
        {/* Cover upload */}
        <div
          className="w-full h-48 rounded-2xl flex flex-col items-center justify-center gap-3"
          style={{ background: "#1e2118", border: "2px dashed #2a3525" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#2a3525" }}>
            <span className="text-2xl">🖼️</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>Upload cover art</p>
            <p className="text-xs mt-0.5" style={{ color: "#6a8060" }}>Recommended: 600 × 900 px</p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold active:scale-95"
            style={{ background: "#2a3525", color: "#4ade80" }}
          >
            Choose Image
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#4a6540" }}>Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="The name of your book…"
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: "#1e2118", color: "#f0ece4", border: "1px solid #2a3525" }}
          />
        </div>

        {/* Genre */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#4a6540" }}>Genre</label>
          <div className="relative">
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none text-sm appearance-none"
              style={{ background: "#1e2118", color: genre ? "#f0ece4" : "#4a6540", border: "1px solid #2a3525" }}
            >
              <option value="">Select a genre…</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown size={14} color="#4a6540" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Synopsis */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#4a6540" }}>Synopsis</label>
          <textarea
            value={synopsis}
            onChange={e => setSynopsis(e.target.value)}
            placeholder="What is your story about? Hook your readers…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
            style={{ background: "#1e2118", color: "#f0ece4", border: "1px solid #2a3525" }}
          />
          <p className="text-[10px] mt-1" style={{ color: "#4a6540" }}>{synopsis.length}/600 characters</p>
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#4a6540" }}>Tags</label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g. Africa, magic, coming-of-age"
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{ background: "#1e2118", color: "#f0ece4", border: "1px solid #2a3525" }}
          />
        </div>

        {/* Pricing */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "#4a6540" }}>Chapter Pricing</label>
          <div className="flex flex-col gap-2">
            {[
              { label: "Free (readers unlock without coins)", value: "free" },
              { label: "Standard — 80 Somi Coins / chapter",  value: "80" },
              { label: "Premium — 120 Somi Coins / chapter",  value: "120" },
            ].map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "#1e2118", border: "1px solid #2a3525" }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ border: "2px solid #4ade80" }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
                </div>
                <span className="text-xs" style={{ color: "#a8c0a0" }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("writer-editor")}
          className="w-full h-14 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform mt-2"
          style={{ background: "#4ade80", color: "#0d1208" }}
        >
          Create Book & Start Writing
        </button>
      </div>
    </div>
  );
}
