"use client";

import { useEffect, useState } from "react";
import { Plus, X, Truck, Search, LayoutGrid, List, Edit2, Mail, Phone, Hash } from "lucide-react";

const emptyForm = { full_name: "", email: "", phone_number: "", vehicle_number: "", vehicle_type: "" };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/drivers/`, { credentials: "include" });
      if (res.ok) setDrivers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (d: any) => {
    setEditingId(d.id);
    setForm({ ...d });
    setIsFormOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/drivers/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/drivers/`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(editingId ? "Failed to update driver" : "Failed to add driver");
      
      setForm({ ...emptyForm });
      setEditingId(null);
      setIsFormOpen(false);
      showFeedback("success", editingId ? "Driver updated successfully." : "Driver added successfully.");
      fetchDrivers();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteDriver = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the driver list?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/drivers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete driver");
      showFeedback("success", `${name} removed.`);
      fetchDrivers();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const inputClass =
    "w-full bg-section-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:bg-white focus:border-primary-600 outline-none transition-colors";

  const q = search.toLowerCase().trim();
  const filteredDrivers = q
    ? drivers.filter(d =>
        d.full_name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.vehicle_number?.toLowerCase().includes(q) ||
        d.vehicle_type?.toLowerCase().includes(q) ||
        d.phone_number?.toLowerCase().includes(q)
      )
    : drivers;

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading drivers...</div>;

  return (
    <div className="w-full">
      {/* Toast */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium shadow-lg
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}>
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">Delivery Drivers</h1>
          <p className="text-muted text-sm leading-relaxed">Manage drivers assigned to deliver active orders.</p>
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
              <Plus className="w-4 h-4" /> Add Driver
            </>
          )}
        </button>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <form onSubmit={handleSaveDriver} className="bg-white border border-border rounded-2xl p-7 mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] space-y-5">
          <h2 className="text-base font-bold text-text-primary">
            {editingId ? "Edit Driver Profile" : "New Driver Profile"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Full Name *</label>
              <input required type="text" className={inputClass} placeholder="e.g. John Doe" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Email</label>
              <input type="email" className={inputClass} placeholder="e.g. driver@acmecorp.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Phone Number *</label>
              <input required type="text" className={inputClass} placeholder="e.g. +1 555 123 4567" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Vehicle Number</label>
              <input type="text" className={inputClass} placeholder="e.g. ABC 1234" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Vehicle Type</label>
              <select className={inputClass} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                <option value="">Select type...</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Pickup">Pickup</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="bg-primary-900 hover:bg-primary-600 text-white px-7 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
              {saving ? "Saving..." : editingId ? "Update Driver" : "Save Driver"}
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
            placeholder="Search by name, vehicle, or contact..."
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
              {filteredDrivers.length} {filteredDrivers.length === 1 ? "driver" : "drivers"} found
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

      {/* Drivers List / Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDrivers.map((d) => (
            <div
              key={d.id}
              className="group bg-white border border-border rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_30px_rgba(0,0,0,0.06)] hover:border-primary-200 transition-all duration-500 flex flex-col relative"
            >
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="text-border hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                  title="Edit driver"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteDriver(d.id, d.full_name)}
                  className="text-border hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-[#FEE2E2] transition-colors"
                  title="Remove driver"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Header */}
              <div className="mb-4 pr-16">
                <div className="flex items-start gap-1 mb-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mr-1 ${d.is_active ? "bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20" : "bg-section-bg text-muted border border-border"}`}>
                    {d.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">{d.full_name}</h3>
              </div>

              {/* Contact info */}
              <div className="space-y-2 py-4 border-y border-border/60 mb-4">
                {d.email && (
                  <div className="flex items-center gap-2.5 text-sm text-text-secondary font-medium">
                    <Mail className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    <span className="truncate">{d.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-text-secondary font-medium">
                  <Phone className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                  <span>{d.phone_number}</span>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {d.vehicle_type && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100/60 text-primary-900 text-xs font-semibold rounded-lg">
                    <Truck className="w-3 h-3" />{d.vehicle_type}
                  </span>
                )}
                {d.vehicle_number && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-section-bg text-text-secondary text-xs font-mono font-medium rounded-lg border border-border">
                    <Hash className="w-3 h-3 text-muted" />{d.vehicle_number}
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredDrivers.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-section-bg/30">
              <Truck className="w-10 h-10 text-border mx-auto mb-4" />
              {q ? (
                <>
                  <h3 className="text-text-primary font-bold text-base">No drivers match "{search}"</h3>
                  <p className="text-muted text-sm mt-1">Try a different name, contact, or vehicle.</p>
                </>
              ) : (
                <>
                  <h3 className="text-text-primary font-bold text-base">No drivers yet</h3>
                  <p className="text-muted text-sm mt-1">Click "Add Driver" to start building your fleet.</p>
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
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Vehicle</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-muted uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d) => (
                  <tr key={d.id} className="border-b border-border/40 hover:bg-section-bg/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-primary">{d.full_name}</td>
                    <td className="px-6 py-4 text-text-secondary">{d.email || "—"}</td>
                    <td className="px-6 py-4 text-text-secondary">{d.phone_number}</td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-xs">{d.vehicle_number || "—"}</td>
                    <td className="px-6 py-4">
                      {d.vehicle_type ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary-100/60 text-primary-900 px-2.5 py-1 rounded-lg">
                          <Truck className="w-3 h-3" />{d.vehicle_type}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${d.is_active ? "bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20" : "bg-section-bg text-muted border border-border"}`}>
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="inline-flex items-center justify-center p-2 text-muted hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100"
                        title="Edit driver"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDriver(d.id, d.full_name)}
                        className="inline-flex items-center justify-center p-2 text-muted hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl transition-all border border-transparent hover:border-red-100"
                        title="Remove driver"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Truck className="w-10 h-10 text-border mx-auto mb-4" />
                      {q ? (
                        <>
                          <h3 className="text-text-primary font-bold text-base">No drivers match "{search}"</h3>
                          <p className="text-muted text-sm mt-1">Try a different name, contact, or vehicle.</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-text-primary font-bold text-base">No drivers yet</h3>
                          <p className="text-muted text-sm mt-1">Click "Add Driver" to start building your fleet.</p>
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
