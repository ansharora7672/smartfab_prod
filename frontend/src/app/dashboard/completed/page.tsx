"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Download, Package, Pencil, Search, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const INVOICE_STATUS_STYLE: Record<string, string> = {
  PAID:      "bg-green-100 border-green-300 text-green-800",
  SENT:      "bg-blue-50 border-blue-200 text-blue-700",
  DRAFT:     "bg-gray-50 border-gray-200 text-gray-600",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
};

type DeclinedQuote = {
  id: string;
  quote_no: string;
  quote_total: number;
  updated_at: string;
};

type CompletedTicket = {
  id: string;
  ticket_id: string;
  company_name: string;
  customer_name: string;
  lpo_number: string | null;
  updated_at: string;
  approved_quote_id: string | null;
  assignee_name: string | null;
  item_count: number;
  invoice: {
    id: string;
    invoice_no: string;
    status: string;
    invoice_total: number;
  } | null;
  declined_quote: DeclinedQuote | null;
};

type Tab = "completed" | "declined";

export default function CompletedOrdersPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<CompletedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("completed");
  const [overrideTarget, setOverrideTarget] = useState<{ quoteId: string; ticketId: string } | null>(null);
  const [overriding, setOverriding] = useState(false);

  const STATUS_OPTIONS = [
    { value: "SENT",                   label: "Re-open — Back to Quote Prep" },
    { value: "APPROVED",               label: "Mark as Approved → Active Orders" },
    { value: "MODIFICATION_REQUESTED", label: "Mark as Changes Requested" },
  ];

  const handleOverrideStatus = async (newStatus: string) => {
    if (!overrideTarget) return;
    setOverriding(true);
    try {
      const res = await fetch(
        `${API}/admin/quotes/${overrideTarget.quoteId}/override-status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_status: newStatus }),
        }
      );
      if (!res.ok) throw new Error();
      // Remove the ticket from the declined list since it's no longer CLOSED/REJECTED
      setTickets((prev) => prev.filter((t) => t.id !== overrideTarget.ticketId));
      setOverrideTarget(null);
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setOverriding(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/admin/tickets/completed`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const completedTickets = tickets.filter((t) => t.approved_quote_id != null);
  const declinedTickets = tickets.filter((t) => t.approved_quote_id == null);

  const activeList = tab === "completed" ? completedTickets : declinedTickets;

  const filtered = activeList.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.ticket_id.toLowerCase().includes(q) ||
      t.company_name.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      (t.lpo_number ?? "").toLowerCase().includes(q) ||
      (t.invoice?.invoice_no ?? "").toLowerCase().includes(q) ||
      (t.declined_quote?.quote_no ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading completed orders...</div>;

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">Completed Orders</h1>
        <p className="text-muted text-sm leading-relaxed">
          All closed tickets with their invoices. Click an order to view details.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => { setTab("completed"); setSearch(""); }}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === "completed"
              ? "border-primary-600 text-primary-900"
              : "border-transparent text-muted hover:text-primary-900"
          }`}
        >
          Completed
          <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            tab === "completed" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
          }`}>
            {completedTickets.length}
          </span>
        </button>
        <button
          onClick={() => { setTab("declined"); setSearch(""); }}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === "declined"
              ? "border-red-500 text-red-700"
              : "border-transparent text-muted hover:text-red-700"
          }`}
        >
          Declined
          <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
            tab === "declined" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
          }`}>
            {declinedTickets.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "completed" ? "Search by ticket, company, LPO..." : "Search by ticket, company, quote..."}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-primary-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
        />
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            {tab === "declined" && !search && (
              <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            )}
            <p className="text-sm text-muted font-medium">
              {search
                ? "No orders match your search."
                : tab === "declined"
                ? "No declined orders."
                : "No completed orders yet."}
            </p>
          </div>
        ) : tab === "completed" ? (
          /* ── Completed Orders Table ── */
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-section-bg/30">
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Company</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">LPO</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Items</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Invoice</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Total</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Completed</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const completedDate = new Date(t.updated_at).toLocaleDateString("en-AE", {
                  day: "2-digit", month: "short", year: "numeric",
                });
                const invoiceStyle = t.invoice
                  ? (INVOICE_STATUS_STYLE[t.invoice.status] ?? "bg-gray-50 border-gray-200 text-gray-600")
                  : null;

                return (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/dashboard/completed/${t.id}`)}
                    className="border-b border-border/40 hover:bg-section-bg/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded-md">
                        {t.ticket_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-text-primary">{t.company_name}</span>
                      <span className="block text-xs text-muted">{t.customer_name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted font-mono">
                      {t.lpo_number ?? <span className="text-muted">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Package className="w-3.5 h-3.5 text-muted" />
                        {t.item_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.invoice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-text-secondary">{t.invoice.invoice_no}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${invoiceStyle}`}>
                            {t.invoice.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-text-primary">
                      {t.invoice
                        ? `AED ${t.invoice.invoice_total.toFixed(2)}`
                        : <span className="text-muted font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">{completedDate}</td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary-900 transition-colors ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* ── Declined Orders Table ── */
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-section-bg/30">
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Company</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Quote</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Quote Total</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Declined On</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const declinedDate = new Date(t.updated_at).toLocaleDateString("en-AE", {
                  day: "2-digit", month: "short", year: "numeric",
                });

                return (
                  <tr
                    key={t.id}
                    className="border-b border-border/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded-md">
                        {t.ticket_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-text-primary">{t.company_name}</span>
                      <span className="block text-xs text-muted">{t.customer_name}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary">
                      {t.declined_quote?.quote_no ?? <span className="text-muted">—</span>}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-text-primary">
                      {t.declined_quote
                        ? `AED ${t.declined_quote.quote_total.toFixed(2)}`
                        : <span className="text-muted font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600">
                        DECLINED
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">{declinedDate}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.declined_quote && (
                          <button
                            title="Download Quote PDF"
                            onClick={() => window.location.href = `${API}/admin/quotes/${t.declined_quote!.id}/download`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-muted hover:text-primary-900 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {t.declined_quote && (
                          <button
                            title="Change Status"
                            onClick={() => setOverrideTarget({ quoteId: t.declined_quote!.id, ticketId: t.id })}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-muted hover:text-primary-900 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Override Status Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-primary-900 mb-1">Override Quote Status</h3>
            <p className="text-xs text-muted mb-5">Move this declined order to a new stage.</p>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleOverrideStatus(opt.value)}
                  disabled={overriding}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border text-sm font-medium text-text-primary hover:bg-section-bg hover:border-primary-300 transition-colors disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOverrideTarget(null)}
              disabled={overriding}
              className="mt-4 w-full text-center text-xs text-muted hover:text-primary-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
