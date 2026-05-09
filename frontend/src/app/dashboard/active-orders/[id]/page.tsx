"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Receipt, CheckCircle, XCircle } from "lucide-react";

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

// "Vendor Assigned" excluded from update dropdown — only used for display
const STATUS_OPTIONS = PRODUCTION_STATUSES.filter((s) => s.value !== "VENDOR_ASSIGNED");

// Scan earliest→latest; returns stage of the most-behind item (order bottleneck).
const STATUS_ORDER = ["ORDER_RECEIVED","VENDOR_ASSIGNED","IN_PRODUCTION","QUALITY_CHECK","READY_FOR_DELIVERY","DELIVERED","COMPLETED"];
function computeOverallStatus(items: any[]): string {
  if (!items.length) return "ORDER_RECEIVED";
  const present = new Set(items.map((i: any) => i.production_status));
  return STATUS_ORDER.find(s => present.has(s)) ?? "ORDER_RECEIVED";
}

const DELIVERY_STATUSES = [
  { value: "PENDING",          label: "Pending",          color: "bg-section-bg text-muted border-border" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20" },
  { value: "DELIVERED",        label: "Delivered",        color: "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20" },
];

const statusStyle = (val: string) =>
  PRODUCTION_STATUSES.find((s) => s.value === val)?.color ?? "bg-section-bg text-muted border-border";
const statusLabel = (val: string) =>
  PRODUCTION_STATUSES.find((s) => s.value === val)?.label ?? val;
const deliveryStyle = (val: string) =>
  DELIVERY_STATUSES.find((s) => s.value === val)?.color ?? "bg-section-bg text-muted border-border";
const deliveryLabel = (val: string) =>
  DELIVERY_STATUSES.find((s) => s.value === val)?.label ?? val;

const selectClass =
  "bg-section-bg border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:border-primary-600 outline-none transition-colors";

export default function ActiveOrderDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({});
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [orderStatusValue, setOrderStatusValue] = useState("");

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const load = async () => {
    try {
      const [orderRes, driversRes, vendorsRes] = await Promise.all([
        fetch(`${API}/admin/orders/active/${ticketId}`, { credentials: "include" }),
        fetch(`${API}/admin/drivers/`, { credentials: "include" }),
        fetch(`${API}/admin/vendors/`, { credentials: "include" }),
      ]);
      if (orderRes.ok) setOrder(await orderRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
      if (vendorsRes.ok) setVendors(await vendorsRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  const assignVendor = async (itemId: string, currentStatus: string) => {
    const vendorId = selectedVendors[itemId];
    if (!vendorId) return;
    setUpdatingItem(itemId);
    try {
      const res = await fetch(`${API}/admin/orders/items/${itemId}/assign-vendor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vendor_id: vendorId,
          production_status: currentStatus === "ORDER_RECEIVED" ? "IN_PRODUCTION" : currentStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign vendor");
      showFeedback("success", "Vendor assigned.");
      setSelectedVendors((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
      load();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  const updateStatus = async (itemId: string, newStatus: string) => {
    if (!newStatus) return;
    setUpdatingItem(itemId);
    try {
      const res = await fetch(`${API}/admin/orders/items/${itemId}/production-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ production_status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      load();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  const assignDriver = async (item: any) => {
    const driverId = selectedDrivers[item.id];
    if (!driverId) return;
    setUpdatingItem(item.id);
    try {
      const res = await fetch(`${API}/admin/orders/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticket_id: order.ticket.id,
          quote_id: order.quote.id,
          quote_item_id: item.id,
          driver_id: driverId,
          quantity_to_deliver: item.qty,
          remark: "",
        }),
      });
      if (!res.ok) throw new Error("Failed to assign driver");
      showFeedback("success", "Driver assigned.");
      setSelectedDrivers((prev) => { const n = { ...prev }; delete n[item.id]; return n; });
      load();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  const updateDeliveryStatus = async (assignmentId: string, newStatus: string, remark: string) => {
    setUpdatingItem(assignmentId);
    try {
      const res = await fetch(`${API}/admin/orders/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, remark }),
      });
      if (!res.ok) throw new Error("Failed to update delivery status");
      showFeedback("success", "Delivery status updated.");
      load();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  const markComplete = async () => {
    setUpdatingItem(order.ticket.id);
    try {
      const res = await fetch(`${API}/admin/orders/tickets/${order.ticket.id}/mark-complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark complete");
      router.push("/dashboard/active-orders");
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdatingItem(null);
      setConfirmComplete(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!newStatus) return;
    setUpdatingItem("ORDER");
    try {
      const res = await fetch(`${API}/admin/orders/tickets/${order?.ticket.id}/production-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ production_status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order status");
      showFeedback("success", "All items updated to new status.");
      setOrderStatusValue("");
      load();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  const vendorName = (vendorId: string | null) =>
    vendorId ? (vendors.find((v) => v.id === vendorId)?.company_name ?? null) : null;

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading order...</div>;
  if (!order) return <div className="p-8 text-danger">Order not found.</div>;

  const o = order;
  const isCompleting = updatingItem === o.ticket.id;
  const orderStatus = o.quote.overall_production_status ?? computeOverallStatus(o.quote.items);

  return (
    <div className="w-full">
      {/* Toast */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium shadow-lg transition-all ${
          feedback.type === "success"
            ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]"
            : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Back + Header */}
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={() => router.push("/dashboard/active-orders")}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-primary-900 font-medium mt-0.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-primary-900 bg-primary-100/50 px-2.5 py-1 rounded-md">
              {o.ticket.ticket_id}
            </span>
            <h1 className="text-xl font-bold text-text-primary">{o.ticket.company_name}</h1>
            {/* Overall order status */}
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${statusStyle(orderStatus)}`}>
              {statusLabel(orderStatus)}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Quote: <span className="font-mono font-semibold">{o.quote.quote_no}</span>
            {o.quote.lpo_no && (
              <span className="ml-3">LPO: <span className="font-mono font-semibold">{o.quote.lpo_no}</span></span>
            )}
            <span className="ml-3 text-[11px] text-muted">
              {o.quote.items.length} item{o.quote.items.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Action bar */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-border bg-section-bg/20 flex-wrap">
          {/* Set overall order status */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">Set All Items:</span>
            <select
              value={orderStatusValue}
              disabled={updatingItem === "ORDER"}
              onChange={e => { setOrderStatusValue(e.target.value); updateOrderStatus(e.target.value); }}
              className="bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:border-primary-600 outline-none transition-colors"
            >
              <option value="">Select status...</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {updatingItem === "ORDER" && <span className="text-[11px] text-muted animate-pulse">Updating...</span>}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push(`/dashboard/delivery-notes/new?ticket_id=${o.ticket.id}&quote_id=${o.quote.id}`)}
              className="bg-primary-900 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              + Delivery Note
            </button>
            <button
              onClick={() => router.push(`/dashboard/invoices/new?ticket_id=${o.ticket.id}&quote_id=${o.quote.id}`)}
              className="bg-success hover:bg-[#15803D] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              + Invoice
            </button>
            {(() => {
              const allItemsDone = o.quote.items.every((item: any) => item.production_status === "COMPLETED");
              const invoiceReady = o.invoice && (o.invoice.status === "SENT" || o.invoice.status === "PAID");
              const canComplete = allItemsDone && invoiceReady;
              return (
                <button
                  onClick={() => canComplete && setConfirmComplete(true)}
                  disabled={!canComplete}
                  title={
                    !canComplete
                      ? [
                          !allItemsDone ? `${o.quote.items.filter((i: any) => i.production_status !== "COMPLETED").length} item(s) not at COMPLETED status` : "",
                          !invoiceReady ? (!o.invoice ? "No invoice generated" : `Invoice is ${o.invoice.status} — must be SENT or PAID`) : "",
                        ].filter(Boolean).join(" · ")
                      : undefined
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    canComplete
                      ? "bg-white border border-green-300 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600"
                      : "bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Complete
                </button>
              );
            })()}
          </div>
        </div>

        {/* Completion readiness checklist — visible when not yet ready */}
        {(() => {
          const allItemsDone = o.quote.items.every((item: any) => item.production_status === "COMPLETED");
          const invoiceReady = o.invoice && (o.invoice.status === "SENT" || o.invoice.status === "PAID");
          if (allItemsDone && invoiceReady) return null;
          return (
            <div className="px-6 py-3 border-b border-amber-100 bg-amber-50/60 flex flex-wrap gap-4">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest self-center">Before completing:</span>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${allItemsDone ? "text-green-700" : "text-amber-700"}`}>
                {allItemsDone ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {allItemsDone
                  ? "All items completed"
                  : `${o.quote.items.filter((i: any) => i.production_status !== "COMPLETED").length} item(s) not yet completed`}
              </span>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${invoiceReady ? "text-green-700" : "text-amber-700"}`}>
                {invoiceReady ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {invoiceReady
                  ? "Invoice sent"
                  : !o.invoice
                  ? "Invoice not generated yet"
                  : `Invoice is ${o.invoice.status} — must be SENT or PAID`}
              </span>
            </div>
          );
        })()}

        {/* Confirm complete */}
        {confirmComplete && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex items-center justify-between gap-4">
            <p className="text-sm text-green-800 font-medium">
              Move this order to Completed Orders? This cannot be undone.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setConfirmComplete(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={isCompleting}
                onClick={markComplete}
                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {isCompleting ? "Moving..." : "Confirm"}
              </button>
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Description</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Qty</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Production Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted uppercase tracking-widest">Driver</th>
              </tr>
            </thead>
            <tbody>
              {o.quote.items.map((item: any) => {
                const assigned = o.delivery_assignments.find((a: any) => a.quote_item_id === item.id);
                const assignedVendorName = vendorName(item.vendor_id);
                const isUpdating = updatingItem === item.id || updatingItem === assigned?.id;

                return (
                  <tr key={item.id} className="border-b border-border/40 hover:bg-section-bg/20 transition-colors align-top">
                    <td className="px-6 py-4 font-medium text-text-primary max-w-50">
                      <span className="line-clamp-2 leading-snug">{item.item_description}</span>
                    </td>

                    <td className="px-6 py-4 text-text-secondary font-mono font-semibold">{item.qty}</td>

                    <td className="px-6 py-4">
                      {assignedVendorName && (
                        <span className="block text-xs font-semibold text-primary-900 bg-primary-100/60 border border-primary-200/50 px-2.5 py-1 rounded-lg mb-2 w-fit">
                          {assignedVendorName}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <select
                          className={selectClass}
                          value={selectedVendors[item.id] || ""}
                          onChange={(e) => setSelectedVendors({ ...selectedVendors, [item.id]: e.target.value })}
                        >
                          <option value="">{assignedVendorName ? "Change..." : "Select vendor..."}</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.company_name}</option>
                          ))}
                        </select>
                        <button
                          disabled={!selectedVendors[item.id] || isUpdating}
                          onClick={() => assignVendor(item.id, item.production_status)}
                          className="bg-primary-900 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-primary-600 transition-all disabled:opacity-40"
                        >
                          {isUpdating ? "..." : assignedVendorName ? "Change" : "Assign"}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`block text-[10px] font-bold px-2.5 py-1 rounded-lg border mb-2 w-fit ${statusStyle(item.production_status)}`}>
                        {statusLabel(item.production_status)}
                      </span>
                      <select
                        className={selectClass}
                        value=""
                        disabled={isUpdating}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                      >
                        <option value="">Update status...</option>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4 min-w-45">
                      {assigned ? (
                        <div className="space-y-2">
                          <div>
                            <span className="block text-xs font-semibold text-text-primary">{assigned.driver_name}</span>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${deliveryStyle(assigned.status)}`}>
                              {deliveryLabel(assigned.status)}
                            </span>
                          </div>
                          <select
                            className={selectClass}
                            value=""
                            disabled={isUpdating}
                            onChange={(e) => updateDeliveryStatus(assigned.id, e.target.value, assigned.remark ?? "")}
                          >
                            <option value="">Update delivery...</option>
                            {DELIVERY_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <select
                              className={selectClass}
                              value={selectedDrivers[item.id] || ""}
                              onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [item.id]: e.target.value })}
                            >
                              <option value="">Change driver...</option>
                              {drivers.filter((d) => d.is_active).map((d) => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                              ))}
                            </select>
                            <button
                              disabled={!selectedDrivers[item.id] || isUpdating}
                              onClick={() => assignDriver(item)}
                              className="bg-primary-900 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-primary-600 transition-all disabled:opacity-40"
                            >
                              {isUpdating ? "..." : "Reassign"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            className={selectClass}
                            value={selectedDrivers[item.id] || ""}
                            onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [item.id]: e.target.value })}
                          >
                            <option value="">Select driver...</option>
                            {drivers.filter((d) => d.is_active).map((d) => (
                              <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                          </select>
                          <button
                            disabled={!selectedDrivers[item.id] || isUpdating}
                            onClick={() => assignDriver(item)}
                            className="bg-primary-900 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold hover:bg-primary-600 transition-all disabled:opacity-40"
                          >
                            {isUpdating ? "..." : "Assign"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Invoice */}
        {o.invoice && (
          <div className="border-t border-border/60">
            <Link
              href={`/dashboard/invoices/${o.invoice.id}`}
              className="flex items-center justify-between px-6 py-3 bg-green-50/60 hover:bg-green-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-green-700" />
                <span className="text-xs font-bold text-green-900 uppercase tracking-widest">
                  Invoice: {o.invoice.invoice_no}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  o.invoice.status === "PAID"
                    ? "bg-green-100 border-green-300 text-green-800"
                    : o.invoice.status === "SENT"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}>
                  {o.invoice.status}
                </span>
                <span className="text-xs font-bold text-green-900 ml-2">
                  AED {o.invoice.invoice_total.toFixed(2)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-green-700 group-hover:underline">View PDF →</span>
            </Link>
          </div>
        )}

        {/* Delivery Notes */}
        {o.delivery_notes && o.delivery_notes.length > 0 && (
          <div className="px-6 py-4 border-t border-border/60 bg-section-bg/10">
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Delivery Notes</p>
            <div className="flex flex-wrap gap-2">
              {o.delivery_notes.map((dn: any) => (
                <Link
                  key={dn.id}
                  href={`/dashboard/delivery-notes/${dn.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:border-primary-600 hover:text-primary-900 bg-white border-border text-text-primary"
                >
                  <span className="font-mono">{dn.note_no}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    dn.status === "SENT"
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {dn.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
