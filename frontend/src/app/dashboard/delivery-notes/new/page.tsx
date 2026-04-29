"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, CheckSquare, Square } from "lucide-react";
import Link from "next/link";

interface QuoteItem {
  id: string;
  sr_no: number;
  item_description: string;
  qty: number;
  production_status: string;
}

interface SelectedItem {
  quote_item_id: string;
  sr_no: number;
  item_description: string;
  qty: number;
  remark: string;
}

export default function NewDeliveryNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticket_id = searchParams.get("ticket_id") as string;
  const quote_id = searchParams.get("quote_id") as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Order info (auto-populated)
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lpoNo, setLpoNo] = useState("");
  const [noteDate] = useState(new Date().toISOString().slice(0, 10));
  const [driverSignatureName, setDriverSignatureName] = useState("SmartFab Lathe");

  // Quote items to pick from
  const [allItems, setAllItems] = useState<QuoteItem[]>([]);
  // Selected items with remark per item
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    const load = async () => {
      if (!ticket_id || !quote_id) {
        setFeedback({ type: "error", message: "Missing order parameters." });
        setLoading(false);
        return;
      }
      try {
        const [ticketRes, ordersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/active`, { credentials: "include" }),
        ]);

        if (ticketRes.ok) {
          const t = await ticketRes.json();
          setCompanyName(t.company_name || "");
          setAddress(t.company_address || "");
          setPhoneNumber(t.phone_number || "");
          if (t.lpo_number) setLpoNo(t.lpo_number);
        }

        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          const order = orders.find((o: any) => o.quote.id === quote_id);
          if (order) {
            setAllItems(order.quote.items);
          }
        }
      } catch (err) {
        setFeedback({ type: "error", message: "Failed to load order data." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticket_id, quote_id]);

  const toggleItem = (item: QuoteItem) => {
    setSelectedItems((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: {
          quote_item_id: item.id,
          sr_no: item.sr_no,
          item_description: item.item_description,
          qty: item.qty,
          remark: "",
        },
      };
    });
  };

  const updateRemark = (itemId: string, remark: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], remark },
    }));
  };

  const selectedCount = Object.keys(selectedItems).length;

  // Re-number selected items by their original sr_no order
  const orderedSelected = Object.values(selectedItems).sort((a, b) => a.sr_no - b.sr_no);

  const handleSave = async () => {
    if (selectedCount === 0) {
      setFeedback({ type: "error", message: "Select at least one item to include." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ticket_id,
        quote_id,
        company_name: companyName,
        address,
        phone_number: phoneNumber,
        lpo_no: lpoNo,
        note_date: noteDate,
        driver_signature_name: driverSignatureName,
        items: orderedSelected.map((item, idx) => ({
          quote_item_id: item.quote_item_id,
          sr_no: idx + 1,
          item_description: item.item_description,
          qty: item.qty,
          remark: item.remark,
        })),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/delivery-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setFeedback({ type: "success", message: `${data.note_no} created!` });
      setTimeout(() => router.push(`/dashboard/delivery-notes/${data.id}`), 1200);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    READY_FOR_DELIVERY: "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20",
    DELIVERED: "bg-[#E0F2FE] text-[#0369A1] border-[#0369A1]/20",
    COMPLETED: "bg-primary-900 text-white border-primary-900",
    IN_PRODUCTION: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/20",
    QUALITY_CHECK: "bg-[#F3E8FF] text-[#7C3AED] border-[#7C3AED]/20",
    VENDOR_ASSIGNED: "bg-[#DBEAFE] text-[#1D4ED8] border-[#2563EB]/20",
    ORDER_RECEIVED: "bg-section-bg text-muted border-border",
  };

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading order data...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 shadow-lg transition-all
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/active-orders" className="p-2 border rounded-lg hover:bg-section-bg/50 text-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">Create Delivery Note</h1>
          <p className="text-muted text-sm">Select items to deliver and fill in delivery details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Order Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white border border-border shadow-sm rounded-2xl">
            <h3 className="font-bold text-sm text-primary-900 uppercase tracking-widest mb-4">Delivery Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Phone Number</label>
                <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">L.P.O. No</label>
                <input type="text" value={lpoNo} onChange={(e) => setLpoNo(e.target.value)}
                  className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Date</label>
                <input type="text" value={noteDate} readOnly
                  className="w-full p-2.5 bg-section-bg/30 border rounded-lg text-sm text-muted cursor-default" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Deliver&apos;s Signature Name</label>
                <input type="text" value={driverSignatureName} onChange={(e) => setDriverSignatureName(e.target.value)}
                  className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-2xl text-sm text-primary-900">
            <span className="font-bold">{selectedCount}</span> item{selectedCount !== 1 ? "s" : ""} selected for this delivery note.
          </div>
        </div>

        {/* Right — Item Selection */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-white border border-border shadow-sm rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm text-primary-900 uppercase tracking-widest">Select Items</h3>
              <span className="text-xs text-muted">Click to select/deselect items for this delivery note</span>
            </div>

            {allItems.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No items found for this order.</p>
            ) : (
              <div className="space-y-3">
                {allItems.map((item) => {
                  const isSelected = !!selectedItems[item.id];
                  const statusKey = item.production_status;
                  const statusClass = statusColors[statusKey] || "bg-section-bg text-muted border-border";

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-xl transition-all ${isSelected ? "border-primary-600 bg-primary-50/30" : "border-border bg-section-bg/10"}`}
                    >
                      {/* Item row */}
                      <div
                        className="flex items-center gap-4 p-4 cursor-pointer"
                        onClick={() => toggleItem(item)}
                      >
                        <div className="shrink-0 text-primary-600">
                          {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-text-primary truncate">{item.item_description}</p>
                          <p className="text-xs text-muted mt-0.5">Qty: {item.qty}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${statusClass}`}>
                          {statusKey.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* Remark field — only when selected */}
                      {isSelected && (
                        <div className="px-4 pb-4">
                          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Remark (optional)</label>
                          <input
                            type="text"
                            value={selectedItems[item.id].remark}
                            onChange={(e) => updateRemark(item.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-2 border border-primary-200 rounded-lg text-sm bg-white"
                            placeholder="E.g. Handle with care"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={saving || selectedCount === 0}
                className="w-full bg-primary-600 hover:bg-primary-900 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 justify-center disabled:opacity-50"
              >
                {saving ? "Creating..." : "Save & View Delivery Note PDF"}
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
