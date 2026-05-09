"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const PRODUCTION_STATUSES = [
  { value: "ORDER_RECEIVED",     label: "Order Received",     color: "bg-section-bg text-muted border-border" },
  { value: "VENDOR_ASSIGNED",    label: "Vendor Assigned",    color: "bg-[#DBEAFE] text-[#1D4ED8] border-[#2563EB]/20" },
  { value: "IN_PRODUCTION",      label: "In Production",      color: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20" },
  { value: "QUALITY_CHECK",      label: "Quality Check",      color: "bg-[#F3E8FF] text-[#7C3AED] border-[#7C3AED]/20" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery", color: "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20" },
  { value: "DELIVERED",          label: "Delivered",          color: "bg-[#E0F2FE] text-[#0369A1] border-[#0369A1]/20" },
  { value: "COMPLETED",          label: "Completed",          color: "bg-primary-900 text-white border-primary-900" },
];

const statusLabel = (val: string) =>
  PRODUCTION_STATUSES.find((s) => s.value === val)?.label ?? val;
const statusColor = (val: string) =>
  PRODUCTION_STATUSES.find((s) => s.value === val)?.color ?? "bg-section-bg text-muted border-border";

// Scan earliest→latest; returns stage of the most-behind item (order bottleneck).
const STATUS_ORDER = ["ORDER_RECEIVED","VENDOR_ASSIGNED","IN_PRODUCTION","QUALITY_CHECK","READY_FOR_DELIVERY","DELIVERED","COMPLETED"];
function overallStatus(items: any[]): string {
  if (!items.length) return "ORDER_RECEIVED";
  const present = new Set(items.map((i: any) => i.production_status));
  return STATUS_ORDER.find(s => present.has(s)) ?? "ORDER_RECEIVED";
}

export default function ActiveOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/orders/active`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading active orders...</div>;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">Active Orders</h1>
        <p className="text-muted text-sm leading-relaxed">
          Approved quotes. Click an order to manage vendors, drivers, production, and delivery.
        </p>
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted font-medium">
              No active orders yet. Orders appear here once a client approves a quote.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-section-bg/30">
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Company</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Quote</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Items</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Invoice</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">D. Notes</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                // Prefer server-computed value; fall back to client derivation if missing.
                const status = o.quote.overall_production_status ?? overallStatus(o.quote.items);
                return (
                  <tr
                    key={o.ticket.id}
                    onClick={() => router.push(`/dashboard/active-orders/${o.ticket.id}`)}
                    className="border-b border-border/40 hover:bg-section-bg/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded-md">
                        {o.ticket.ticket_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">{o.ticket.company_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted">{o.quote.quote_no}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Package className="w-3.5 h-3.5 text-muted" />
                        {o.quote.items.length}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor(status)}`}>
                        {statusLabel(status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {o.invoice ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          o.invoice.status === "PAID"
                            ? "bg-green-100 border-green-300 text-green-800"
                            : o.invoice.status === "SENT"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}>
                          {o.invoice.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">
                      {o.delivery_notes?.length > 0 ? `${o.delivery_notes.length}` : "—"}
                    </td>
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
