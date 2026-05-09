"use client";

import { useState } from "react";
import { Search, Package, CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TICKET_STAGES = [
  "Consultation Scheduled",
  "Quote Being Prepared",
  "In Production",
  "Order Completed",
];

const PRODUCTION_STAGES = [
  { key: "ORDER_RECEIVED",     label: "Order Received" },
  { key: "VENDOR_ASSIGNED",    label: "Vendor Assigned" },
  { key: "IN_PRODUCTION",      label: "In Production" },
  { key: "QUALITY_CHECK",      label: "Quality Check" },
  { key: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { key: "DELIVERED",          label: "Delivered" },
  { key: "COMPLETED",          label: "Completed" },
];

type OrderItem = {
  sr_no: number;
  description: string;
  qty: number;
  production_status_label: string;
  progress_step: number;
  total_steps: number;
};

type OrderResult = {
  ticket_id: string;
  company_name: string;
  customer_name: string;
  lpo_number: string | null;
  status: string;
  status_label: string;
  overall_production_status: string | null;
  overall_production_status_label: string | null;
  overall_production_step: number | null;
  total_production_steps: number;
  items: OrderItem[];
};

// ── 4-step ticket-level timeline ──────────────────────────────────────────────
function TicketTimeline({ statusLabel }: { statusLabel: string }) {
  const currentIdx = TICKET_STAGES.indexOf(statusLabel);
  // When "Order Completed" is the current step it IS done — treat it as filled.
  const isFullyComplete = statusLabel === "Order Completed";

  return (
    <div className="flex items-start w-full mb-8">
      {TICKET_STAGES.map((step, idx) => {
        const done   = idx < currentIdx || (isFullyComplete && idx === currentIdx);
        const active = !done && idx === currentIdx;
        const last   = idx === TICKET_STAGES.length - 1;
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? "bg-primary-500 border-primary-500" :
                active ? "bg-transparent border-primary-400 ring-2 ring-primary-400/20" :
                         "bg-transparent border-white/20"
              }`}>
                {done   ? <CheckCircle className="w-4 h-4 text-white" /> :
                 active ? <div className="w-2.5 h-2.5 rounded-full bg-primary-400" /> :
                          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />}
              </div>
              <span className={`text-[10px] mt-1.5 text-center leading-tight max-w-20 font-semibold ${
                done || active ? "text-white" : "text-white/30"
              }`}>{step}</span>
            </div>
            {!last && (
              <div className={`flex-1 h-0.5 mx-1 -mt-5 transition-all ${
                done ? "bg-primary-500" : "bg-white/15"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 7-step production pipeline ────────────────────────────────────────────────
function ProductionPipeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = PRODUCTION_STAGES.findIndex(s => s.key === currentStatus);
  return (
    <div className="mb-7 bg-white/4 border border-white/8 rounded-2xl p-5">
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
        Production Stage
      </p>
      <div className="flex items-start w-full overflow-x-auto pb-1">
        {PRODUCTION_STAGES.map((stage, idx) => {
          const done   = idx < currentIdx;
          const active = idx === currentIdx;
          const last   = idx === PRODUCTION_STAGES.length - 1;
          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  done   ? "bg-primary-500 border-primary-500" :
                  active ? "bg-transparent border-primary-400 ring-2 ring-primary-400/20" :
                           "bg-transparent border-white/15"
                }`}>
                  {done   ? <CheckCircle className="w-3 h-3 text-white" /> :
                   active ? <div className="w-2 h-2 rounded-full bg-primary-400" /> :
                            <div className="w-2 h-2 rounded-full bg-white/15" />}
                </div>
                <span className={`text-[9px] mt-1.5 text-center leading-tight max-w-14 font-medium ${
                  done || active ? "text-white" : "text-white/30"
                }`}>{stage.label}</span>
              </div>
              {!last && (
                <div className={`flex-1 h-0.5 mx-0.5 -mt-5 transition-all ${
                  done ? "bg-primary-500" : "bg-white/10"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Single item row ───────────────────────────────────────────────────────────
function ItemCard({ item }: { item: OrderItem }) {
  const pct = Math.round((item.progress_step / item.total_steps) * 100);
  return (
    <div className="bg-white/6 border border-white/12 rounded-xl px-4 py-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {item.sr_no}. {item.description}
          </p>
          <p className="text-xs text-white/55 mt-0.5 font-medium">Qty: {item.qty}</p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full border bg-primary-500/25 text-white border-primary-400/40 whitespace-nowrap shrink-0">
          {item.production_status_label}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex-1 bg-white/15 rounded-full h-1.5">
          <div
            className="bg-primary-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-white/60 font-semibold shrink-0 w-7 text-right">{pct}%</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TrackOrder() {
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<OrderResult | null>(null);
  const [error, setError]     = useState<string | null>(null);

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
        setError("No order found with that reference. Please check and try again.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again later.");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Unable to connect. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="track" className="py-24 bg-text-primary border-t border-white/10">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-400 mb-4">
            Order Tracking
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Track Your Order
          </h2>
          <p className="text-white/45 max-w-xl leading-relaxed">
            Enter your SmartFab Lathe ticket number (SFL-...) or your LPO number to check the real-time status of your order.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. SFL-20260101-0001 or your LPO number"
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/8 border border-white/15 text-white !text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
          >
            {loading ? "Searching..." : <><span>Track Order</span><ChevronRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">

            {/* Order header */}
            <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-white/8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Package className="w-3.5 h-3.5 text-primary-400" />
                  <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                    {result.ticket_id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{result.company_name}</h3>
                <p className="text-sm text-white/70 mt-0.5 font-medium">{result.customer_name}</p>
                {result.lpo_number && (
                  <p className="text-xs text-white/50 mt-1 font-mono">LPO: {result.lpo_number}</p>
                )}
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 ${
                result.status === "CLOSED"
                  ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                  : result.status === "ACTIVE_ORDER"
                  ? "bg-blue-500/15 border-blue-500/25 text-blue-400"
                  : "bg-amber-500/15 border-amber-500/25 text-amber-400"
              }`}>
                {result.status_label}
              </span>
            </div>

            {/* 4-step ticket timeline */}
            <TicketTimeline statusLabel={result.status_label} />

            {/* 7-step production pipeline — shown when order is active/closed */}
            {result.overall_production_status && (
              <ProductionPipeline currentStatus={result.overall_production_status} />
            )}

            {/* Per-item breakdown */}
            {result.items.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">
                  Items — {result.items.length} line item{result.items.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2.5">
                  {result.items.map(item => (
                    <ItemCard key={item.sr_no} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Pre-production */}
            {result.items.length === 0 && result.status !== "CLOSED" && (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Your order is being processed. Item tracking will be available once production begins.</span>
              </div>
            )}

            {/* Completed */}
            {result.status === "CLOSED" && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400 mt-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Your order is complete. Thank you for choosing SmartFab Lathe.</span>
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  );
}
