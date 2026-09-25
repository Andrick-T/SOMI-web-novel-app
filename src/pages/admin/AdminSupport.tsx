import { useEffect, useState } from "react";
import { LifeBuoy, MessageSquare, Send } from "lucide-react";
import { apiAdminRepository, type AdminSupportTicket } from "../../features/admin/apiRepository";

export default function AdminSupport() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<AdminSupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() { const result = await apiAdminRepository.getSupportTickets({ status }); setTickets(result.items); }
  useEffect(() => { void load(); }, [status]);

  async function sendReply() {
    if (!selected || !reply.trim()) return; setBusy(true);
    try { await apiAdminRepository.replySupportTicket(selected.id, reply); setReply(""); await load(); const fresh = (await apiAdminRepository.getSupportTickets({ status })).items.find((t) => t.id === selected.id); if (fresh) setSelected(fresh); }
    finally { setBusy(false); }
  }
  async function update(update: { status?: AdminSupportTicket["status"]; priority?: AdminSupportTicket["priority"] }) {
    if (!selected) return; setBusy(true);
    try { const ticket = await apiAdminRepository.updateSupportTicket(selected.id, update); setSelected((current) => current ? { ...current, ...ticket } : ticket); await load(); }
    finally { setBusy(false); }
  }

  return <div className="somi-admin-page"><div className="somi-admin-inner">
    <header className="somi-admin-header"><div><p className="somi-admin-eyebrow">Support / Writer payments</p><h1 className="somi-admin-title">Payment support</h1><p className="somi-admin-description">Handle payout failures and writer support conversations.</p></div></header>
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="somi-admin-section">
        <div className="somi-admin-toolbar"><label className="somi-admin-select"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option>ALL</option><option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option></select></label></div>
        <div className="space-y-2">{tickets.map((ticket) => <button key={ticket.id} onClick={() => setSelected(ticket)} className="w-full rounded-xl border p-3 text-left hover:bg-[var(--color-active-surface)]"><div className="flex items-start justify-between gap-2"><strong className="text-sm">{ticket.subject}</strong><span className="text-[10px]">{ticket.status}</span></div><p className="mt-1 text-xs opacity-70">{ticket.user.username} · {ticket.priority}</p></button>)}{!tickets.length && <div className="somi-admin-empty"><LifeBuoy size={20}/><p>No support tickets.</p></div>}</div>
      </section>
      <section className="somi-admin-section">
        {!selected ? <div className="somi-admin-empty"><MessageSquare size={24}/><strong>Select a support ticket</strong></div> : <><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="somi-admin-eyebrow">{selected.category}</p><h2 className="somi-admin-section-title">{selected.subject}</h2><p className="text-xs opacity-70">{selected.user.email} · {selected.priority}</p></div><div className="flex gap-2"><select value={selected.priority} onChange={(e) => void update({ priority: e.target.value as AdminSupportTicket["priority"] })} className="rounded-lg border p-2 text-xs"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select><select value={selected.status} onChange={(e) => void update({ status: e.target.value as AdminSupportTicket["status"] })} className="rounded-lg border p-2 text-xs"><option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option></select></div></div>
          <div className="mt-5 space-y-3">{selected.messages.map((message) => <div key={message.id} className="rounded-xl border p-3 text-sm"><p>{message.body}</p><p className="mt-1 text-[10px] opacity-60">{new Date(message.createdAt).toLocaleString()}</p></div>)}</div>
          {selected.status !== "CLOSED" && <div className="mt-5 flex gap-2"><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Reply to writer…" className="flex-1 rounded-xl border p-3 text-sm"/><button disabled={busy || !reply.trim()} onClick={() => void sendReply()} className="somi-admin-primary-action self-end"><Send size={15}/>Reply</button></div>}
        </>}
      </section>
    </div>
  </div></div>;
}
