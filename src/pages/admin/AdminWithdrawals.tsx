import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Filter, Search, XCircle } from "lucide-react";
import { apiAdminRepository, type AdminWithdrawal } from "../../features/admin/apiRepository";

const statuses = ["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const;
function money(value: number, currency: string) { return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency; }
function date(value: string) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function statusClass(status: string) { return status === "COMPLETED" ? "somi-admin-status somi-admin-status-success" : status === "FAILED" ? "somi-admin-status somi-admin-status-danger" : status === "PROCESSING" ? "somi-admin-status somi-admin-status-info" : "somi-admin-status somi-admin-status-warning"; }

export default function AdminWithdrawals() {
  const [items, setItems] = useState<AdminWithdrawal[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminWithdrawal | null>(null);
  const [failureMessage, setFailureMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const result = await apiAdminRepository.getWithdrawals({ status }); setItems(result.items); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [status]);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    return !q || [item.id, item.writer?.username, item.writer?.email, item.payoutMethod, item.payoutAccount].join(" ").toLowerCase().includes(q);
  });

  async function transition(action: "process" | "complete" | "fail") {
    if (!selected) return; setBusy(true);
    try {
      if (action === "process") await apiAdminRepository.processWithdrawal(selected.id);
      if (action === "complete") await apiAdminRepository.completeWithdrawal(selected.id);
      if (action === "fail") { if (!failureMessage.trim()) return; await apiAdminRepository.failWithdrawal(selected.id, failureMessage); setFailureMessage(""); }
      setSelected(null); await load();
    } finally { setBusy(false); }
  }

  return <div className="somi-admin-page"><div className="somi-admin-inner">
    <header className="somi-admin-header">
      <div><p className="somi-admin-eyebrow">Economy / Writer payouts</p><h1 className="somi-admin-title">Withdrawal management</h1><p className="somi-admin-description">Review, process and resolve writer withdrawal requests.</p></div>
    </header>
    <section className="somi-admin-section">
      <div className="somi-admin-toolbar">
        <label className="somi-admin-search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search writer, account or withdrawal ID"/></label>
        <label className="somi-admin-select"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}>{statuses.map((s) => <option key={s}>{s}</option>)}</select><Filter size={15}/></label>
      </div>
      <div className="somi-admin-table-wrap"><table className="somi-admin-table"><thead><tr><th>Withdrawal</th><th>Writer</th><th>Amount</th><th>Coins</th><th>Payout</th><th>Status</th><th>Date</th></tr></thead><tbody>
        {filtered.map((item) => <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer">
          <td><div className="somi-admin-table-primary"><strong>{item.id}</strong><span>{item.failureCount} failure(s)</span></div></td>
          <td><div className="somi-admin-table-primary"><strong>{item.writer?.profile?.displayName || item.writer?.username || "Writer"}</strong><span>{item.writer?.email}</span></div></td>
          <td><strong>{money(item.amount, item.currency)}</strong><span className="block text-xs">{item.amountCfa.toLocaleString()} XAF</span></td>
          <td>{item.coins.toLocaleString()}</td><td><span className="text-xs">{item.payoutMethod}<br/>{item.payoutAccount}</span></td>
          <td><span className={statusClass(item.status)}>{item.status}</span></td><td>{date(item.createdAt)}</td>
        </tr>)}
      </tbody></table>{loading && <div className="somi-admin-empty">Loading withdrawals…</div>}{!loading && !filtered.length && <div className="somi-admin-empty">No withdrawals found.</div>}</div>
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--color-surface)] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between"><div><p className="somi-admin-eyebrow">Withdrawal detail</p><h2 className="somi-admin-section-title">{selected.id}</h2></div><button onClick={() => setSelected(null)}><XCircle size={20}/></button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 text-sm"><div><b>Writer</b><p>{selected.writer?.email}</p></div><div><b>Status</b><p><span className={statusClass(selected.status)}>{selected.status}</span></p></div><div><b>Amount</b><p>{money(selected.amount, selected.currency)} · {selected.amountCfa.toLocaleString()} XAF</p></div><div><b>Exchange rate</b><p>{selected.exchangeRateCfa} XAF / {selected.currency}</p></div><div><b>Payout</b><p>{selected.payoutMethod} · {selected.payoutAccount}</p></div><div><b>Failure count</b><p>{selected.failureCount}</p></div></div>
        {selected.failureMessage && <div className="mt-4 rounded-xl border p-3 text-sm"><b>Latest failure</b><p className="mt-1">{selected.failureMessage}</p></div>}
        <div className="mt-6 flex flex-wrap gap-2">
          {selected.status === "PENDING" && <button disabled={busy} className="somi-admin-primary-action" onClick={() => void transition("process")}><Clock3 size={15}/>Start processing</button>}
          {selected.status === "PROCESSING" && <button disabled={busy} className="somi-admin-primary-action" onClick={() => void transition("complete")}><CheckCircle2 size={15}/>Mark completed</button>}
          {selected.status === "PROCESSING" && <button disabled={busy || !failureMessage.trim()} className="somi-admin-danger-action" onClick={() => void transition("fail")}><XCircle size={15}/>Mark failed</button>}
        </div>
        {selected.status === "PROCESSING" && <textarea value={failureMessage} onChange={(e) => setFailureMessage(e.target.value)} placeholder="Failure reason (required to mark failed)" className="mt-4 w-full rounded-lg border p-3 text-sm" rows={3}/>}
      </div>
    </div>}
  </div></div>;
}
