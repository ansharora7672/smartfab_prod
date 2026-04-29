"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Phone, X, Building2, Send, Tag } from "lucide-react";

const emptyVendor = {
  vendor_name: "",
  company_name: "",
  contact_name: "",
  email: "",
  phone_number: "",
  address: "",
  services_offered: "",
};

const emptyInquiry = {
  subject: "Request for Price Quote",
  item_name: "",
  item_description: "",
  quantity: 1,
  message: "",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add vendor form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ ...emptyVendor });
  const [savingVendor, setSavingVendor] = useState(false);

  // RFQ inquiry modal
  const [rfqVendor, setRfqVendor] = useState<any | null>(null);
  const [inquiry, setInquiry] = useState({ ...emptyInquiry });
  const [sendingRfq, setSendingRfq] = useState(false);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load vendors");
      setVendors(await res.json());
    } catch {
      showFeedback("error", "Could not load vendor list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVendor(true);
    try {
      const payload = {
        ...newVendor,
        services_offered: newVendor.services_offered.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add vendor");
      setIsAddOpen(false);
      setNewVendor({ ...emptyVendor });
      showFeedback("success", "Vendor added successfully.");
      fetchVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSavingVendor(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from your vendor network? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete vendor");
      showFeedback("success", `${name} removed.`);
      fetchVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const handleSendRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqVendor) return;
    setSendingRfq(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${rfqVendor.id}/send-inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(inquiry),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Failed to send inquiry");
      }
      setRfqVendor(null);
      setInquiry({ ...emptyInquiry });
      showFeedback("success", `Inquiry sent to ${rfqVendor.company_name}.`);
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSendingRfq(false);
    }
  };

  const inputClass =
    "w-full bg-section-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:bg-white focus:border-primary-600 outline-none transition-colors";

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading vendor network...</div>;

  return (
    <div className="w-full">
      {/* Toast */}
      {feedback && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium shadow-lg transition-all
            ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}
        >
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">Supplier Network</h1>
          <p className="text-muted text-sm max-w-xl leading-relaxed">
            Manage manufacturing partners and send price inquiries directly from the dashboard.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="flex items-center gap-2 bg-primary-900 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          {isAddOpen ? "Close Form" : "Add Vendor"}
        </button>
      </div>

      {/* Add Vendor Form */}
      {isAddOpen && (
        <form
          onSubmit={handleAddVendor}
          className="bg-white border border-border rounded-2xl p-7 mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] space-y-5"
        >
          <h2 className="text-base font-bold text-text-primary mb-1">New Vendor Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Contact Name</label>
              <input type="text" className={inputClass} placeholder="e.g. Mohammed Al Rashid" value={newVendor.vendor_name} onChange={(e) => setNewVendor({ ...newVendor, vendor_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Company Name *</label>
              <input required type="text" className={inputClass} placeholder="e.g. Precision Metals LLC" value={newVendor.company_name} onChange={(e) => setNewVendor({ ...newVendor, company_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Email Address *</label>
              <input required type="email" className={inputClass} placeholder="e.g. quotes@vendor.com" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Phone Number</label>
              <input type="text" className={inputClass} placeholder="e.g. +971 50 XXX XXXX" value={newVendor.phone_number} onChange={(e) => setNewVendor({ ...newVendor, phone_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Address</label>
              <input type="text" className={inputClass} placeholder="e.g. Industrial Area 2, Sharjah" value={newVendor.address} onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Services (comma-separated)</label>
              <input type="text" className={inputClass} placeholder="e.g. CNC Milling, Laser Cutting" value={newVendor.services_offered} onChange={(e) => setNewVendor({ ...newVendor, services_offered: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={savingVendor}
              className="bg-primary-900 hover:bg-primary-600 text-white px-7 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {savingVendor ? "Saving..." : "Save Vendor"}
            </button>
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-section-bg transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {vendors.map((v) => (
          <div
            key={v.id}
            className="group bg-white border border-border rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.06)] hover:border-primary-200 transition-all duration-500 flex flex-col relative"
          >
            {/* Delete */}
            <button
              onClick={() => handleDelete(v.id, v.company_name)}
              className="absolute top-4 right-4 text-border hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 rounded-lg hover:bg-[#FEE2E2]"
              title="Remove vendor"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <div className="flex items-start gap-1 mb-0.5">
                {!v.is_active && (
                  <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/20 px-2 py-0.5 rounded-md uppercase tracking-wider mr-1">
                    Inactive
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">{v.company_name}</h3>
              {v.vendor_name && <p className="text-sm text-primary-600 font-medium mt-0.5">{v.vendor_name}</p>}
              {v.contact_name && !v.vendor_name && <p className="text-sm text-primary-600 font-medium mt-0.5">{v.contact_name}</p>}
            </div>

            {/* Contact info */}
            <div className="space-y-2 py-4 border-y border-border/60 mb-4">
              <div className="flex items-center gap-2.5 text-sm text-text-secondary font-medium">
                <Mail className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                <span className="truncate">{v.email}</span>
              </div>
              {v.phone_number && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary font-medium">
                  <Phone className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <span>{v.phone_number}</span>
                </div>
              )}
              {v.address && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary font-medium">
                  <Building2 className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <span className="truncate">{v.address}</span>
                </div>
              )}
            </div>

            {/* Service tags */}
            {v.services_offered?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {v.services_offered.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100/60 text-primary-900 text-[10px] font-bold rounded-lg border border-primary-200/50 uppercase tracking-wide"
                  >
                    <Tag className="w-2.5 h-2.5" />{s}
                  </span>
                ))}
              </div>
            )}

            {/* RFQ button */}
            <div className="mt-auto pt-2">
              <button
                onClick={() => {
                  setRfqVendor(v);
                  setInquiry({ ...emptyInquiry });
                }}
                className="flex items-center justify-center gap-2 w-full bg-section-bg hover:bg-primary-100/60 text-text-primary hover:text-primary-900 border border-border hover:border-primary-200 rounded-xl py-2.5 text-xs font-bold transition-all duration-300"
              >
                <Send className="w-3.5 h-3.5" />
                Send RFQ
              </button>
            </div>
          </div>
        ))}

        {vendors.length === 0 && !isAddOpen && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-section-bg/30">
            <Building2 className="w-10 h-10 text-border mx-auto mb-4" />
            <h3 className="text-text-primary font-bold text-base">No vendors yet</h3>
            <p className="text-muted text-sm mt-1">Click "Add Vendor" to build your supplier network.</p>
          </div>
        )}
      </div>

      {/* RFQ Modal */}
      {rfqVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md p-7">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-base font-bold text-text-primary">Send RFQ</h2>
                <p className="text-sm text-muted mt-0.5">To: <span className="font-semibold text-primary-900">{rfqVendor.company_name}</span></p>
              </div>
              <button onClick={() => setRfqVendor(null)} className="text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-section-bg transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendRfq} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Subject *</label>
                <input required type="text" className={inputClass} value={inquiry.subject} onChange={(e) => setInquiry({ ...inquiry, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Item Name *</label>
                <input required type="text" className={inputClass} placeholder="e.g. Aluminium Bracket 6061-T6" value={inquiry.item_name} onChange={(e) => setInquiry({ ...inquiry, item_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Description</label>
                <textarea className={`${inputClass} resize-none h-20`} placeholder="Dimensions, tolerances, material specs..." value={inquiry.item_description} onChange={(e) => setInquiry({ ...inquiry, item_description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Quantity *</label>
                <input required type="number" min={1} className={inputClass} value={inquiry.quantity} onChange={(e) => setInquiry({ ...inquiry, quantity: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Additional Message</label>
                <textarea className={`${inputClass} resize-none h-20`} placeholder="Delivery requirements, timeline, any other notes..." value={inquiry.message} onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={sendingRfq}
                  className="flex-1 bg-primary-900 hover:bg-primary-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingRfq ? "Sending..." : "Send Inquiry"}
                </button>
                <button type="button" onClick={() => setRfqVendor(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-section-bg transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
