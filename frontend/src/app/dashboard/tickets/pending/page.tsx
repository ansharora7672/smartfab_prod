// frontend/src/app/dashboard/tickets/pending/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, User, Building, Phone, Mail, Check, AlertCircle, Calendar } from "lucide-react";

const TABS = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "ALL",        label: "All Pending" },
  { key: "MINE",       label: "Assigned to Me" },
] as const;

type FilterKey = typeof TABS[number]["key"];

export default function PendingTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("UNASSIGNED");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/pending`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTickets(data);
    } catch {
      setFeedback({ type: "error", message: "Network error loading tickets." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleClaimTicket = async (ticket_id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}/claim`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        setFeedback({ type: "error", message: err.detail || "Error claiming ticket." });
        return;
      }
      setFeedback({ type: "success", message: "Ticket successfully claimed!" });
      fetchTickets();
    } catch {
      setFeedback({ type: "error", message: "Network error." });
    }
  };

  const handleMarkCompleted = async (ticket_id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}/mark_completed`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        setFeedback({ type: "error", message: err.detail || "Error completing call." });
        return;
      }
      setFeedback({ type: "success", message: "Call marked successfully! Moved to Quote Prep." });
      fetchTickets();
    } catch {
      setFeedback({ type: "error", message: "Network error." });
    }
  };

  const getFilteredTickets = (key: FilterKey) => {
    if (key === "UNASSIGNED") return tickets.filter(t => t.status === "PENDING");
    if (key === "MINE") return tickets.filter(t => t.status === "CLAIMED" && t.assigned_to_id === user?.id);
    return tickets;
  };

  const filteredTickets = getFilteredTickets(filter);

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading secure dashboard...</div>;

  return (
    <div className="w-full">
      {/* Toast */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 shadow-lg transition-all
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">
          Pending Consultations
        </h1>
        <p className="text-muted text-sm leading-relaxed">
          Manage incoming quote requests. Claim consultations and own the client conversation.
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-border shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden">

        {/* Tab Bar */}
        <div className="flex items-end gap-0 border-b border-border px-6 pt-4">
          {TABS.map(tab => {
            const count = getFilteredTickets(tab.key).length;
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative px-4 py-2.5 mr-1 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none
                  ${isActive
                    ? "text-primary-700 bg-primary-50 border-b-2 border-primary-600"
                    : "text-muted hover:text-primary-800 hover:bg-section-bg/60 border-b-2 border-transparent"
                  }`}
              >
                {tab.label}
                <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full
                  ${isActive ? "bg-primary-100 text-primary-700" : "bg-border text-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-250">
            <thead>
              <tr className="border-b border-border bg-section-bg/30">
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Inquiry ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Client & Company</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Booked Meeting</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Ownership</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-section-bg/30 transition-colors">

                  <td className="px-6 py-5">
                    <span className="font-mono text-sm font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded-md">{t.ticket_id}</span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-text-primary flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary-600" /> {t.customer_name}
                      </span>
                      <span className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-muted" /> {t.company_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-text-secondary flex items-center gap-2 font-mono"><Phone className="w-3.5 h-3.5 text-muted" /> {t.phone_number}</span>
                      <span className="text-xs text-text-secondary flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted" /> {t.email}</span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-primary-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        {new Date(t.consultation_date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs font-semibold text-muted flex items-center gap-2 ml-6.25">
                        {t.consultation_time.slice(0, 5)} {parseInt(t.consultation_time) >= 12 ? 'PM' : 'AM'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 align-top">
                    {t.status === "PENDING" ? (
                      <button onClick={() => handleClaimTicket(t.ticket_id)} className="bg-primary-600 hover:bg-primary-900 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2">
                        Claim Ticket <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-warning flex items-center gap-1.5 bg-warning-bg px-2 py-1 rounded w-fit">
                            <AlertCircle className="w-3 h-3" /> CLAIMED
                          </span>
                          <span className="text-xs font-semibold text-text-secondary">By: {t.assignee_name}</span>
                        </div>
                        {(!t.assigned_to_id || user?.id === t.assigned_to_id || user?.role === "ADMIN") && (
                          <button
                            onClick={() => handleMarkCompleted(t.ticket_id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-3 py-2 rounded-lg shadow-sm transition-all flex w-fit items-center gap-1.5"
                          >
                            Mark Completed <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-muted font-medium bg-section-bg/10">
                    No consultations found in this category.
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
