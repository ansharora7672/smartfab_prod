"use client";

import { useEffect, useState } from "react";
import { Plus, X, Truck } from "lucide-react";

const emptyForm = { full_name: "", email: "", phone_number: "", vehicle_number: "", vehicle_type: "" };

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
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

  const addDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/drivers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add driver");
      setForm({ ...emptyForm });
      setIsAddOpen(false);
      showFeedback("success", "Driver added successfully.");
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
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="flex items-center gap-2 bg-primary-900 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          {isAddOpen ? "Close" : "Add Driver"}
        </button>
      </div>

      {/* Add Form */}
      {isAddOpen && (
        <form onSubmit={addDriver} className="bg-white border border-border rounded-2xl p-7 mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] space-y-5">
          <h2 className="text-base font-bold text-text-primary">New Driver</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Full Name *</label>
              <input required type="text" className={inputClass} placeholder="e.g. Ahmad Al Farsi" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Email</label>
              <input type="email" className={inputClass} placeholder="e.g. driver@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Phone Number *</label>
              <input required type="text" className={inputClass} placeholder="e.g. +971 55 XXX XXXX" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Vehicle Number</label>
              <input type="text" className={inputClass} placeholder="e.g. Dubai A 12345" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
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
              {saving ? "Saving..." : "Save Driver"}
            </button>
            <button type="button" onClick={() => setIsAddOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-section-bg transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Driver Table */}
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
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
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
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${d.is_active ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-section-bg text-muted"}`}>
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteDriver(d.id, d.full_name)}
                      className="text-border hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-[#FEE2E2] transition-all"
                      title="Remove driver"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted font-medium">
                    No drivers yet. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
