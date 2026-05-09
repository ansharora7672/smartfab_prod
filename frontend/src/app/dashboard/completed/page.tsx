"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Package, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const INVOICE_STATUS_STYLE: Record<string, string> = {
  PAID:      "bg-green-100 border-green-300 text-green-800",
  SENT:      "bg-blue-50 border-blue-200 text-blue-700",
  DRAFT:     "bg-gray-50 border-gray-200 text-gray-600",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
};

type CompletedTicket = {
  id: string;
  ticket_id: string;
  company_name: string;
  customer_name: string;
  lpo_number: string | null;
  updated_at: string;
  assignee_name: string | null;
  item_count: number;
  invoice: {
    id: string;
    invoice_no: string;
    status: string;
    invoice_total: number;
  } | null;
};

export default function CompletedOrdersPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<CompletedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/tickets/completed`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.ticket_id.toLowerCase().includes(q) ||
      t.company_name.toLowerCase().includes(q) ||
      t.customer_name.toLowerCase().includes(q) ||
      (t.lpo_number ?? "").toLowerCase().includes(q) ||
      (t.invoice?.invoice_no ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading completed orders...</div>;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">Completed Orders</h1>
        <p className="text-muted text-sm leading-relaxed">
          All closed tickets with their invoices. Click an order to view details.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket, company, LPO..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-primary-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
        />
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted font-medium">
              {search ? "No orders match your search." : "No completed orders yet."}
            </p>
          </div>
        ) : (
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
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
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
        )}
      </div>
    </div>
  );
}
