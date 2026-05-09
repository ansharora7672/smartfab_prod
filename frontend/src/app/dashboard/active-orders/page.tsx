"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Package, Search, LayoutGrid, List, Building2, Receipt, SearchX } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/orders/active`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase().trim();
  const filteredOrders = q
    ? orders.filter((o) =>
        o.ticket.ticket_id?.toLowerCase().includes(q) ||
        o.ticket.company_name?.toLowerCase().includes(q) ||
        o.quote.quote_no?.toLowerCase().includes(q)
      )
    : orders;

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading active orders...</div>;

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">Active Orders</h1>
          <p className="text-muted text-sm leading-relaxed">
            Approved quotes in production. Click an order to manage vendors, drivers, production, and delivery.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Company, or Quote No..."
            className="w-full bg-white border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-text-primary placeholder:text-muted focus:border-primary-600 focus:outline-none transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
            >
              <SearchX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {q && (
            <span className="text-sm text-muted font-medium flex-1 md:flex-none">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} found
            </span>
          )}
          <div className="flex items-center bg-white border border-border rounded-lg p-1 shadow-sm ml-auto md:ml-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-primary-50 text-primary-600 shadow-sm" : "text-muted hover:text-text-primary hover:bg-section-bg"}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary-50 text-primary-600 shadow-sm" : "text-muted hover:text-text-primary hover:bg-section-bg"}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrders.map((o) => {
            const status = o.quote.overall_production_status ?? overallStatus(o.quote.items);
            return (
              <div
                key={o.ticket.id}
                onClick={() => router.push(`/dashboard/active-orders/${o.ticket.id}`)}
                className="group bg-white border border-border rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.06)] hover:border-primary-200 transition-all duration-300 cursor-pointer flex flex-col relative"
              >
                {/* Arrow */}
                <div className="absolute top-6 right-6 text-muted opacity-0 group-hover:opacity-100 group-hover:text-primary-600 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
                
                {/* Header */}
                <div className="mb-4 pr-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded uppercase tracking-widest border border-primary-100/50">
                      {o.ticket.ticket_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor(status)}`}>
                      {statusLabel(status)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight line-clamp-1">{o.ticket.company_name}</h3>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/60 mb-4 text-sm font-medium text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-muted" />
                    <span className="font-mono text-xs">{o.quote.quote_no}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-muted" />
                    <span>{o.quote.items.length} {o.quote.items.length === 1 ? 'Item' : 'Items'}</span>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {o.invoice && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${
                      o.invoice.status === "PAID"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : o.invoice.status === "SENT"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}>
                      Invoice: {o.invoice.status}
                    </span>
                  )}
                  {o.delivery_notes?.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                      {o.delivery_notes.length} Delivery Note{o.delivery_notes.length !== 1 && 's'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredOrders.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-section-bg/30">
              <Package className="w-10 h-10 text-border mx-auto mb-4" />
              {q ? (
                <>
                  <h3 className="text-text-primary font-bold text-base">No orders match "{search}"</h3>
                  <p className="text-muted text-sm mt-1">Try a different search term.</p>
                </>
              ) : (
                <>
                  <h3 className="text-text-primary font-bold text-base">No active orders yet</h3>
                  <p className="text-muted text-sm mt-1">Orders will appear here once a client approves a quote.</p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-section-bg/30">
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Company</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Quote</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Items</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Invoice</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">D. Notes</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const status = o.quote.overall_production_status ?? overallStatus(o.quote.items);
                  return (
                    <tr
                      key={o.ticket.id}
                      onClick={() => router.push(`/dashboard/active-orders/${o.ticket.id}`)}
                      className="border-b border-border/40 hover:bg-section-bg/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-primary-900 bg-primary-50 border border-primary-100/50 px-2 py-1 rounded-md uppercase tracking-wider">
                          {o.ticket.ticket_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{o.ticket.company_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-muted">{o.quote.quote_no}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-section-bg w-fit px-2 py-1 rounded-md border border-border">
                          <Package className="w-3.5 h-3.5 text-muted" />
                          {o.quote.items.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase tracking-wider ${statusColor(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {o.invoice ? (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${
                            o.invoice.status === "PAID"
                              ? "bg-green-50 border-green-200 text-green-700"
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
                      <td className="px-6 py-4 text-xs font-medium text-text-secondary">
                        {o.delivery_notes?.length > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                            {o.delivery_notes.length}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary-600 group-hover:translate-x-1 transition-all ml-auto" />
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Package className="w-10 h-10 text-border mx-auto mb-4" />
                      {q ? (
                        <>
                          <h3 className="text-text-primary font-bold text-base">No orders match "{search}"</h3>
                          <p className="text-muted text-sm mt-1">Try a different search term.</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-text-primary font-bold text-base">No active orders yet</h3>
                          <p className="text-muted text-sm mt-1">Orders will appear here once a client approves a quote.</p>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
