"use client";

import { useEffect, useState } from "react";
import { Plus, Mail, Phone, X, Building2, Send, Tag, Search, LayoutGrid, List, Edit2 } from "lucide-react";

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

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Add/Edit vendor form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyVendor });
  const [savingVendor, setSavingVendor] = useState(false);

  // Search
  const [search, setSearch] = useState("");

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

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyVendor });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingId(v.id);
    setFormData({
      ...v,
      services_offered: Array.isArray(v.services_offered) ? v.services_offered.join(", ") : v.services_offered || "",
    });
    setIsFormOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVendor(true);
    try {
      const payload = {
        ...formData,
        services_offered: formData.services_offered
          ? formData.services_offered.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      
      const method = editingId ? "PATCH" : "POST";
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/vendors/`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(editingId ? "Failed to update vendor" : "Failed to add vendor");
      setIsFormOpen(false);
      setFormData({ ...emptyVendor });
      setEditingId(null);
      showFeedback("success", editingId ? "Vendor updated successfully." : "Vendor added successfully.");
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

  const q = search.toLowerCase().trim();
  const filteredVendors = q
    ? vendors.filter(v =>
        v.company_name?.toLowerCase().includes(q) ||
        v.vendor_name?.toLowerCase().includes(q) ||
        v.contact_name?.toLowerCase().includes(q) ||
        v.address?.toLowerCase().includes(q) ||
        v.services_offered?.some((s: string) => s.toLowerCase().includes(q))
      )
    : vendors;

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
          onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenAdd()}
          className="flex items-center gap-2 bg-primary-900 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm w-fit"
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4" /> Close Form
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Vendor
            </>
          )}
        </button>
      </div>

      {/* Add/Edit Vendor Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveVendor}
          className="bg-white border border-border rounded-2xl p-7 mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] space-y-5"
        >
          <h2 className="text-base font-bold text-text-primary mb-1">
            {editingId ? "Edit Vendor Profile" : "New Vendor Profile"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Contact Name</label>
              <input type="text" className={inputClass} placeholder="e.g. John Doe" value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Company Name *</label>
              <input required type="text" className={inputClass} placeholder="e.g. Acme Precision Metals" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Email Address *</label>
              <input required type="email" className={inputClass} placeholder="e.g. quotes@acmemetals.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Phone Number</label>
              <input type="text" className={inputClass} placeholder="e.g. +1 555 123 4567" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Address</label>
              <input type="text" className={inputClass} placeholder="e.g. 123 Industrial Way, City" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Services (comma-separated)</label>
              <input type="text" className={inputClass} placeholder="e.g. CNC Milling, Laser Cutting" value={formData.services_offered} onChange={(e) => setFormData({ ...formData, services_offered: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={savingVendor}
              className="bg-primary-900 hover:bg-primary-600 text-white px-7 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {savingVendor ? "Saving..." : editingId ? "Update Vendor" : "Save Vendor"}
            </button>
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-section-bg transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, location, or service..."
            className="w-full bg-white border border-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-text-primary placeholder:text-muted focus:border-primary-600 focus:outline-none transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {q && (
            <span className="text-sm text-muted font-medium flex-1 md:flex-none">
              {filteredVendors.length} {filteredVendors.length === 1 ? "vendor" : "vendors"} found
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

      {/* Vendor List / Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredVendors.map((v) => (
            <div
              key={v.id}
              className="group bg-white border border-border rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.06)] hover:border-primary-200 transition-all duration-500 flex flex-col relative"
            >
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="text-border hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                  title="Edit vendor"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(v.id, v.company_name)}
                  className="text-border hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-[#FEE2E2] transition-colors"
                  title="Remove vendor"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Header */}
              <div className="mb-4 pr-16">
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

          {filteredVendors.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-section-bg/30">
              <Building2 className="w-10 h-10 text-border mx-auto mb-4" />
              {q ? (
                <>
                  <h3 className="text-text-primary font-bold text-base">No vendors match "{search}"</h3>
                  <p className="text-muted text-sm mt-1">Try a different name, location, or service.</p>
                </>
              ) : (
                <>
                  <h3 className="text-text-primary font-bold text-base">No vendors yet</h3>
                  <p className="text-muted text-sm mt-1">Click "Add Vendor" to build your supplier network.</p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-section-bg border-b border-border text-xs uppercase tracking-wider text-muted font-bold">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Services</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-section-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!v.is_active && (
                          <span className="w-2 h-2 rounded-full bg-yellow-400" title="Inactive"></span>
                        )}
                        <p className="text-sm font-bold text-text-primary">{v.company_name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted mt-1.5">
                        <Mail className="w-3 h-3" /> {v.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{v.contact_name || v.vendor_name || "-"}</p>
                      {v.phone_number && (
                        <div className="flex items-center gap-1 text-xs text-muted mt-1.5">
                          <Phone className="w-3 h-3" /> {v.phone_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {v.services_offered?.slice(0, 3).map((s: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100/60 text-primary-900 text-[10px] font-bold rounded-md border border-primary-200/50 uppercase tracking-wide">
                            {s}
                          </span>
                        ))}
                        {v.services_offered?.length > 3 && (
                          <span className="text-[10px] font-bold text-muted bg-section-bg px-2 py-0.5 rounded-md border border-border">
                            +{v.services_offered.length - 3} more
                          </span>
                        )}
                        {(!v.services_offered || v.services_offered.length === 0) && (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button 
                        onClick={() => { setRfqVendor(v); setInquiry({ ...emptyInquiry }); }} 
                        className="inline-flex items-center justify-center p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100" 
                        title="Send RFQ"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(v)} 
                        className="inline-flex items-center justify-center p-2 text-muted hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100" 
                        title="Edit Vendor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id, v.company_name)} 
                        className="inline-flex items-center justify-center p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" 
                        title="Delete Vendor"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <Building2 className="w-10 h-10 text-border mx-auto mb-4" />
                      {q ? (
                        <>
                          <h3 className="text-text-primary font-bold text-base">No vendors match "{search}"</h3>
                          <p className="text-muted text-sm mt-1">Try a different name, location, or service.</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-text-primary font-bold text-base">No vendors yet</h3>
                          <p className="text-muted text-sm mt-1">Click "Add Vendor" to build your supplier network.</p>
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
