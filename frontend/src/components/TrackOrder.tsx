"use client";

import { useState } from "react";
import { Search, Package, CheckCircle, Clock, AlertCircle, FileText, Receipt } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STATUS_ORDER = [
  "Consultation Scheduled",
  "Quote Being Prepared",
  "In Production",
  "Order Completed",
];

type OrderItem = {
  sr_no: number;
  description: string;
  qty: number;
  production_status_label: string;
  progress_step: number;
  total_steps: number;
};

type InvoiceItem = {
  sr_no: number;
  description_of_service: string;
  quantity: number;
  per: string;
  amount: number;
  total_incl_vat: number;
};

type Invoice = {
  invoice_no: string;
  status: string;
  taxable_value: number;
  vat_total: number;
  invoice_total: number;
  payment_terms: string;
  amount_chargeable_words: string;
  created_at: string;
  items: InvoiceItem[];
};

type OrderResult = {
  ticket_id: string;
  company_name: string;
  customer_name: string;
  lpo_number: string | null;
  status: string;
  status_label: string;
  items: OrderItem[];
  invoice: Invoice | null;
};

function OverallTimeline({ statusLabel }: { statusLabel: string }) {
  const currentIdx = STATUS_ORDER.indexOf(statusLabel);

  return (
    <div className="flex items-start gap-0 w-full mb-8">
      {STATUS_ORDER.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const last = idx === STATUS_ORDER.length - 1;

        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-primary-500 border-primary-500"
                    : active
                    ? "bg-transparent border-primary-400"
                    : "bg-transparent border-white/20"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : active ? (
                  <div className="w-3 h-3 rounded-full bg-primary-400" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight max-w-18 ${
                  active
                    ? "text-primary-300 font-semibold"
                    : done
                    ? "text-primary-400"
                    : "text-white/25"
                }`}
              >
                {step}
              </span>
            </div>
            {!last && (
              <div
                className={`flex-1 h-0.5 mx-1 -mt-4 transition-all ${
                  done ? "bg-primary-500" : "bg-white/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ItemRow({ item }: { item: OrderItem }) {
  const pct = Math.round((item.progress_step / item.total_steps) * 100);

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {item.sr_no}. {item.description}
          </p>
          <p className="text-xs text-white/35 mt-0.5">Qty: {item.qty}</p>
        </div>
        <span className="text-xs font-semibold text-primary-300 bg-primary-500/20 border border-primary-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
          {item.production_status_label}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5">
        <div
          className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const date = new Date(invoice.created_at).toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const isPaid = invoice.status === "PAID";

  return (
    <div className="mt-6 border border-green-500/20 bg-green-500/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-green-400" />
          <h4 className="text-sm font-semibold text-green-300">Invoice Summary</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">{date}</span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isPaid
                ? "bg-green-500/20 border-green-500/30 text-green-300"
                : "bg-amber-500/20 border-amber-500/30 text-amber-300"
            }`}
          >
            {isPaid ? "Paid" : invoice.status}
          </span>
        </div>
      </div>

      <p className="text-xs text-white/35 mb-3">
        Invoice No: <span className="font-medium text-primary-300">{invoice.invoice_no}</span>
      </p>

      <div className="space-y-2 mb-4">
        {invoice.items.map((item) => (
          <div key={item.sr_no} className="flex justify-between text-xs text-white/60">
            <span className="flex-1 truncate pr-2">
              {item.sr_no}. {item.description_of_service} ({item.quantity} {item.per})
            </span>
            <span className="font-medium whitespace-nowrap text-white/80">
              AED {item.total_incl_vat.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-green-500/20 pt-3 space-y-1">
        <div className="flex justify-between text-xs text-white/45">
          <span>Subtotal (excl. VAT)</span>
          <span>AED {invoice.taxable_value.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-white/45">
          <span>VAT (5%)</span>
          <span>AED {invoice.vat_total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-white pt-1">
          <span>Total</span>
          <span>AED {invoice.invoice_total.toFixed(2)}</span>
        </div>
      </div>

      {invoice.payment_terms && (
        <p className="text-xs text-white/30 mt-3">
          Payment Terms: <span className="text-white/50">{invoice.payment_terms}</span>
        </p>
      )}
    </div>
  );
}

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/public/track-order?query=${encodeURIComponent(query.trim())}`
      );
      if (res.status === 404) {
        setError("No order found with that reference number. Please check and try again.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again later.");
        return;
      }
      const data: OrderResult = await res.json();
      setResult(data);
    } catch {
      setError("Unable to connect. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="track" className="py-24 bg-text-primary">
      <div className="max-w-3xl mx-auto px-6">

        {/* Section header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-400 mb-4">
            Order Tracking
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Track Your Order
          </h2>
          <p className="text-white/45 max-w-xl leading-relaxed">
            Enter your SmartFab Lathe ticket number (SFL-...) or your LPO number to check the status of your order.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SFL-20250101-0001 or your LPO number"
              className="w-full pl-11 pr-4 py-4 rounded-lg bg-white/8 border border-white/15 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-4 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300 hover:bg-primary-500 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result card */}
        {result && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">
                    {result.ticket_id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{result.company_name}</h3>
                <p className="text-sm text-white/45">{result.customer_name}</p>
                {result.lpo_number && (
                  <p className="text-xs text-white/25 mt-1">LPO: {result.lpo_number}</p>
                )}
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap ${
                  result.status === "CLOSED"
                    ? "bg-green-500/20 border-green-500/30 text-green-400"
                    : result.status === "ACTIVE_ORDER"
                    ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                }`}
              >
                {result.status_label}
              </span>
            </div>

            {/* Overall timeline */}
            <OverallTimeline statusLabel={result.status_label} />

            {/* Per-item breakdown */}
            {result.items.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-widest">
                  Item Status
                </h4>
                <div className="space-y-3">
                  {result.items.map((item) => (
                    <ItemRow key={item.sr_no} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Invoice */}
            {result.status === "CLOSED" && result.invoice && (
              <InvoiceCard invoice={result.invoice} />
            )}

            {result.status === "CLOSED" && !result.invoice && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-400 mt-4">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Your order is complete. Invoice will be sent to your email shortly.</span>
              </div>
            )}

            {result.items.length === 0 && result.status !== "CLOSED" && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  Your order is being processed. Item-level tracking will be available once production begins.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
