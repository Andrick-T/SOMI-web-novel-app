import { useState } from "react";
import { Search, ShieldAlert, CheckCircle, Eye, Trash2, BookOpen } from "lucide-react";
import type { CommonProps } from "../../types";

type ContentStatus = "all" | "pending" | "live" | "flagged" | "removed";

const contentItems = [
  { id: "c1", type: "book",    title: "The Baobab Kingdom",   author: "Amara Diallo",   status: "live",    chapters: 12, flags: 0,  updated: "2d ago" },
  { id: "c2", type: "chapter", title: "Dark River · Ch.4",    author: "Kwame Boateng",  status: "flagged", chapters: 1,  flags: 3,  updated: "5h ago" },
  { id: "c3", type: "book",    title: "Echoes of Kongo",      author: "Fatou Ndiaye",   status: "pending", chapters: 2,  flags: 0,  updated: "1d ago" },
  { id: "c4", type: "book",    title: "Shadow Hunters",       author: "Chidi Okonkwo",  status: "live",    chapters: 18, flags: 0,  updated: "3d ago" },
  { id: "c5", type: "chapter", title: "Night Market · Ch.11", author: "Zintle Dlamini", status: "removed", chapters: 1,  flags: 7,  updated: "1w ago" },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  live:    { bg: "rgba(74,222,128,0.12)",  text: "#4ade80", label: "Live" },
  pending: { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", label: "Pending" },
  flagged: { bg: "rgba(251,113,133,0.12)", text: "#fb7185", label: "Flagged" },
  removed: { bg: "rgba(100,100,120,0.15)", text: "#8899aa", label: "Removed" },
};

export default function AdminContent({ }: CommonProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContentStatus>("all");

  const filtered = contentItems.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.author.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || item.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0e1422" }}>
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#60a5fa88" }}>Admin Console</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Content</h1>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "#162035", border: "1px solid rgba(96,165,250,0.12)" }}
        >
          <Search size={15} color="#3b5278" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search titles or authors…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#f0ece4" }}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto">
        {(["all", "live", "pending", "flagged", "removed"] as ContentStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize flex-shrink-0 active:scale-95"
            style={{
              background: filter === s ? "#60a5fa" : "#162035",
              color: filter === s ? "#0e1422" : "#4a7090",
              border: filter === s ? "none" : "1px solid rgba(96,165,250,0.15)",
            }}
          >
            {s}
            {s === "flagged" && <span className="ml-1 w-4 h-4 inline-flex items-center justify-center rounded-full text-[8px]" style={{ background: "rgba(251,113,133,0.2)", color: "#fb7185" }}>2</span>}
          </button>
        ))}
      </div>

      {/* Content list */}
      <div className="px-5 flex flex-col gap-3 pb-8">
        {filtered.map(item => {
          const sc = statusConfig[item.status];
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl"
              style={{
                background: "#162035",
                border: item.status === "flagged"
                  ? "1px solid rgba(251,113,133,0.3)"
                  : "1px solid rgba(96,165,250,0.08)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(96,165,250,0.1)" }}
                  >
                    <BookOpen size={13} color="#60a5fa" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight" style={{ color: "#f0ece4" }}>{item.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#3b5278" }}>by {item.author}</p>
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: sc.bg, color: sc.text }}
                >
                  {sc.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px]" style={{ color: "#4a7090" }}>
                  {item.chapters} {item.type === "book" ? "chapters" : "chapter"}
                </span>
                {item.flags > 0 && (
                  <div className="flex items-center gap-1">
                    <ShieldAlert size={10} color="#fb7185" />
                    <span className="text-[10px]" style={{ color: "#fb7185" }}>{item.flags} flag{item.flags > 1 ? "s" : ""}</span>
                  </div>
                )}
                <span className="text-[10px]" style={{ color: "#3b5278" }}>Updated {item.updated}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95"
                  style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}
                >
                  <Eye size={11} /> Review
                </button>
                {item.status === "pending" && (
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95"
                    style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
                  >
                    <CheckCircle size={11} /> Approve
                  </button>
                )}
                {(item.status === "flagged" || item.status === "live") && (
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95"
                    style={{ background: "rgba(251,113,133,0.12)", color: "#fb7185" }}
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
