import { useState } from "react";
import { BookOpen, PenLine, MoreVertical, Plus, ChevronRight, Lock, Eye } from "lucide-react";
import type { CommonProps } from "../../types";

type Status = "all" | "ongoing" | "completed" | "draft" | "paused";

const myBooks = [
  {
    id: "b1", title: "The Baobab Kingdom", genre: "Fantasy",
    status: "ongoing", chapters: 12, readers: 2340, unlocks: 1800,
    lastUpdated: "2 days ago",
    cover: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=120&q=80",
  },
  {
    id: "b2", title: "Grandmother's Fire", genre: "Family Saga",
    status: "ongoing", chapters: 8, readers: 980, unlocks: 640,
    lastUpdated: "5 days ago",
    cover: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=120&q=80",
  },
  {
    id: "b3", title: "Echoes of Kongo", genre: "Thriller",
    status: "draft", chapters: 2, readers: 0, unlocks: 0,
    lastUpdated: "Just now",
    cover: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=120&q=80",
  },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  ongoing:   { bg: "rgba(74,222,128,0.12)",  text: "#4ade80", label: "Ongoing" },
  completed: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", label: "Completed" },
  draft:     { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", label: "Draft" },
  paused:    { bg: "rgba(251,113,133,0.12)", text: "#fb7185", label: "Paused" },
};

export default function WriterBooks({ navigate }: CommonProps) {
  const [filter, setFilter] = useState<Status>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = filter === "all" ? myBooks : myBooks.filter(b => b.status === filter);

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#131510" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#4ade8088" }}>Writer Studio</p>
          <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>My Books</h1>
        </div>
        <button
          onClick={() => navigate("writer-create")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
          style={{ background: "#4ade80", color: "#0d1208" }}
        >
          <Plus size={14} /> New Book
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto">
        {(["all", "ongoing", "draft", "completed", "paused"] as Status[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
            style={{
              background: filter === s ? "#4ade80" : "#1e2118",
              color: filter === s ? "#0d1208" : "#6a8060",
              border: filter === s ? "none" : "1px solid #2a3525",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Book list */}
      <div className="px-5 flex flex-col gap-4 pb-8">
        {filtered.map(book => {
          const st = statusColors[book.status];
          return (
            <div
              key={book.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#1e2118", border: "1px solid #2a3525" }}
            >
              {/* Cover + info row */}
              <div className="flex gap-3 p-4">
                <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 64, height: 96 }}>
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-sm leading-tight" style={{ color: "#f0ece4" }}>{book.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#6a8060" }}>{book.genre}</p>
                    </div>
                    <button
                      onClick={() => setMenuOpen(menuOpen === book.id ? null : book.id)}
                      className="flex-shrink-0 p-1"
                    >
                      <MoreVertical size={16} color="#4a6540" />
                    </button>
                  </div>

                  <div className="mt-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { label: "Chapters", value: book.chapters, icon: <BookOpen size={9} /> },
                      { label: "Readers",  value: book.readers >= 1000 ? `${(book.readers/1000).toFixed(1)}k` : book.readers, icon: <Eye size={9} /> },
                      { label: "Unlocks",  value: book.unlocks >= 1000 ? `${(book.unlocks/1000).toFixed(1)}k` : book.unlocks, icon: <Lock size={9} /> },
                    ].map(stat => (
                      <div key={stat.label} className="text-center">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5" style={{ color: "#4a6540" }}>
                          {stat.icon}
                          <span className="text-[9px]">{stat.label}</span>
                        </div>
                        <p className="text-sm font-bold" style={{ color: "#f0ece4" }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] mt-2" style={{ color: "#4a6540" }}>Updated {book.lastUpdated}</p>
                </div>
              </div>

              {/* Context menu */}
              {menuOpen === book.id && (
                <div className="mx-4 mb-3 rounded-xl overflow-hidden" style={{ background: "#2a3525" }}>
                  {[
                    { label: "Add Chapter", icon: <PenLine size={13} />, action: () => { navigate("writer-editor"); setMenuOpen(null); } },
                    { label: "View Details", icon: <Eye size={13} />, action: () => setMenuOpen(null) },
                    { label: "Analytics", icon: <ChevronRight size={13} />, action: () => { navigate("writer-analytics"); setMenuOpen(null); } },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm active:bg-black/10"
                      style={{ color: "#f0ece4", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    >
                      <span style={{ color: "#4ade80" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Action row */}
              <div
                className="flex border-t"
                style={{ borderColor: "#2a3525" }}
              >
                <button
                  onClick={() => navigate("writer-editor")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold active:bg-white/5"
                  style={{ color: "#4ade80" }}
                >
                  <PenLine size={13} /> Write
                </button>
                <div style={{ width: 1, background: "#2a3525" }} />
                <button
                  onClick={() => navigate("writer-analytics")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold active:bg-white/5"
                  style={{ color: "#a8c0a0" }}
                >
                  <Eye size={13} /> Stats
                </button>
              </div>
            </div>
          );
        })}

        {/* New book CTA */}
        <button
          onClick={() => navigate("writer-create")}
          className="flex items-center justify-center gap-3 p-5 rounded-2xl active:scale-[0.98] transition-transform"
          style={{ background: "transparent", border: "2px dashed #2a3525" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#1e2118" }}
          >
            <Plus size={18} color="#4ade80" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>Start a new book</p>
            <p className="text-xs" style={{ color: "#6a8060" }}>Share your African story</p>
          </div>
        </button>
      </div>
    </div>
  );
}
