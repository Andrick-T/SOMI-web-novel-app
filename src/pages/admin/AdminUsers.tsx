import { useState } from "react";
import { Search, Filter, MoreVertical, ShieldCheck, BookOpen, Coins } from "lucide-react";
import type { CommonProps } from "../../types";

type Role = "all" | "reader" | "writer" | "admin";

const users = [
  { id: "u1", name: "Amara Diallo",   email: "amara@example.com",  role: "writer", status: "active",  coins: 1420, books: 3,  joined: "Mar 2024" },
  { id: "u2", name: "Kwame Mensah",   email: "kwame@example.com",  role: "reader", status: "active",  coins: 680,  books: 0,  joined: "Apr 2024" },
  { id: "u3", name: "Fatou Ndiaye",   email: "fatou@example.com",  role: "writer", status: "active",  coins: 290,  books: 1,  joined: "Jan 2024" },
  { id: "u4", name: "Chidi Okonkwo",  email: "chidi@example.com",  role: "reader", status: "suspended", coins: 0,  books: 0,  joined: "Feb 2024" },
  { id: "u5", name: "Zintle Dlamini", email: "zintle@example.com", role: "admin",  status: "active",  coins: 5780, books: 2,  joined: "Jan 2024" },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  reader:  { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa" },
  writer:  { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
  admin:   { bg: "rgba(167,139,250,0.12)", text: "#a78bfa" },
};
const statusColors: Record<string, { bg: string; text: string }> = {
  active:    { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
  suspended: { bg: "rgba(251,113,133,0.12)", text: "#fb7185" },
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function AdminUsers({ }: CommonProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search);
    const matchRole = role === "all" || u.role === role;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0e1422" }}>
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#60a5fa88" }}>Admin Console</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Users</h1>
        <p className="text-xs mt-1" style={{ color: "#3b5278" }}>{users.length} total accounts</p>
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
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#f0ece4" }}
          />
          <Filter size={15} color="#3b5278" />
        </div>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 px-5 mb-5">
        {(["all", "reader", "writer", "admin"] as Role[]).map(r => {
          const rc = roleColors[r] ?? { bg: "transparent", text: "#60a5fa" };
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize active:scale-95"
              style={{
                background: role === r ? "#60a5fa" : "#162035",
                color: role === r ? "#0e1422" : "#4a7090",
                border: role === r ? "none" : "1px solid rgba(96,165,250,0.15)",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* User list */}
      <div className="px-5 flex flex-col gap-3 pb-8">
        {filtered.map(user => {
          const rc = roleColors[user.role];
          const sc = statusColors[user.status];
          return (
            <div
              key={user.id}
              className="p-4 rounded-xl"
              style={{ background: "#162035", border: "1px solid rgba(96,165,250,0.08)" }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{ background: rc.bg, color: rc.text }}
                >
                  {initials(user.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: "#f0ece4" }}>{user.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.text }}>
                      {user.role}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                      {user.status}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#3b5278" }}>{user.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Coins size={10} color="#fbbf24" />
                      <span className="text-[10px]" style={{ color: "#8aaccc" }}>{user.coins.toLocaleString()}</span>
                    </div>
                    {user.books > 0 && (
                      <div className="flex items-center gap-1">
                        <BookOpen size={10} color="#60a5fa" />
                        <span className="text-[10px]" style={{ color: "#8aaccc" }}>{user.books} books</span>
                      </div>
                    )}
                    <span className="text-[10px]" style={{ color: "#3b5278" }}>Joined {user.joined}</span>
                  </div>
                </div>

                <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="p-1">
                  <MoreVertical size={15} color="#3b5278" />
                </button>
              </div>

              {menuOpen === user.id && (
                <div
                  className="mt-3 rounded-xl overflow-hidden"
                  style={{ background: "#0e1422", border: "1px solid rgba(96,165,250,0.12)" }}
                >
                  {[
                    { label: "View Profile",     icon: <ShieldCheck size={12} /> },
                    { label: user.status === "active" ? "Suspend User" : "Reinstate User", icon: <MoreVertical size={12} /> },
                    { label: "Grant Writer Role", icon: <BookOpen size={12} /> },
                    { label: "Adjust Coins",      icon: <Coins size={12} /> },
                  ].map((item, i, arr) => (
                    <button
                      key={i}
                      onClick={() => setMenuOpen(null)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs active:bg-white/5"
                      style={{ color: "#a0c0e8", borderBottom: i < arr.length - 1 ? "1px solid rgba(96,165,250,0.08)" : "none" }}
                    >
                      <span style={{ color: "#60a5fa" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
