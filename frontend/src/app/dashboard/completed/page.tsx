"use client";

import { useEffect, useState } from "react";
import { CheckCircle, FileText, Search, Receipt } from "lucide-react";

type InvoiceSummary = {
  id: string;
  invoice_no: string;
  status: string;
  invoice_total: number;
  vat_total: number;
  taxable_value: number;
  payment_terms: string;
  created_at: string;
};

type CompletedTicket = {
  id: string;
  ticket_id: string;
  company_name: string;
  customer_name: string;
  email: string;
  phone_number: string;
  lpo_number: string | null;
  consultation_date: string;
  updated_at: string;
  assignee_name: string | null;
  invoice: InvoiceSummary | null;
  item_count: number;
};

const INVOICE_STATUS_STYLE: Record<string, string> = {
  PAID: "bg-green-50 border-green-200 text-green-700",
  SENT: "bg-blue-50 border-blue-200 text-blue-700",
  DRAFT: "bg-gray-50 border-gray-200 text-gray-600",
  CANCELLED: "bg-red-50 border-red-200 text-red-600",
};

export default function CompletedOrdersPage() {
  const [tickets, setTickets] = useState<CompletedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/completed`, {
      credentials: "include",
    })
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

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h1 className="text-2xl font-bold text-primary-900">Completed Orders</h1>
        </div>
        <p className="text-sm text-muted">
          All closed tickets with their invoices.
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-24 text-muted text-sm">
          {search ? "No orders match your search." : "No completed orders yet."}
        </div>
      )}

      {/* Cards grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ticket) => {
            const completedDate = new Date(ticket.updated_at).toLocaleDateString("en-AE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            const invoiceDate = ticket.invoice
              ? new Date(ticket.invoice.created_at).toLocaleDateString("en-AE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : null;

            const invoiceStyle =
              ticket.invoice
                ? INVOICE_STATUS_STYLE[ticket.invoice.status] ?? "bg-gray-50 border-gray-200 text-gray-600"
                : null;

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
              >
                {/* Ticket header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest">
                        {ticket.ticket_id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 font-medium">
                        Completed
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-primary-900">{ticket.company_name}</h3>
                    <p className="text-xs text-gray-500">{ticket.customer_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{completedDate}</p>
                    {ticket.item_count > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{ticket.item_count} item{ticket.item_count !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {ticket.lpo_number && (
                    <span>LPO: <span className="text-primary-800 font-medium">{ticket.lpo_number}</span></span>
                  )}
                  {ticket.assignee_name && (
                    <span>Handled by: <span className="text-primary-800 font-medium">{ticket.assignee_name}</span></span>
                  )}
                  <span>{ticket.email}</span>
                </div>

                {/* Invoice block */}
                {ticket.invoice ? (
                  <div className="border border-green-100 bg-green-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-green-700" />
                        <span className="text-xs font-semibold text-green-900">
                          {ticket.invoice.invoice_no}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoiceDate && <span className="text-xs text-gray-400">{invoiceDate}</span>}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${invoiceStyle}`}>
                          {ticket.invoice.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Subtotal</span>
                      <span>AED {ticket.invoice.taxable_value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>VAT (5%)</span>
                      <span>AED {ticket.invoice.vat_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary-900 border-t border-green-200 pt-2">
                      <span>Total</span>
                      <span>AED {ticket.invoice.invoice_total.toFixed(2)}</span>
                    </div>

                    {ticket.invoice.payment_terms && (
                      <p className="text-xs text-gray-500 mt-2">
                        Terms: {ticket.invoice.payment_terms}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>No invoice generated yet.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
