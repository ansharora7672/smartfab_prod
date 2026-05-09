// frontend/src/app/dashboard/tickets/pending/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, User, Building, Phone, Mail, Check, AlertCircle, Calendar, LayoutList, Table } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("table");
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

        {/* Tab Bar & View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border px-6 pt-4">
          <div className="flex items-end gap-0">
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

          <div className="flex items-center gap-1 bg-section-bg p-1 rounded-lg border border-border/50 mb-3 sm:mb-2">
            <button
              onClick={() => setViewMode(viewMode === "cards" ? "auto" : "cards")}
              className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === "cards" ? "bg-white text-primary-600 shadow-sm border border-border/50" : "text-muted hover:text-text-primary"}`}
              title="Card View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === "table" ? "auto" : "table")}
              className={`p-1.5 rounded-md transition-all flex items-center justify-center ${viewMode === "table" ? "bg-white text-primary-600 shadow-sm border border-border/50" : "text-muted hover:text-text-primary"}`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Table / List View */}
        <div className="w-full">
          {/* Desktop Table View */}
          <div className={`${viewMode === "auto" ? "hidden xl:block" : viewMode === "table" ? "block" : "hidden"} overflow-x-auto`}>
            <table className="w-full text-left">
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
                      <span className="font-mono text-sm font-bold text-primary-900 bg-primary-100/50 px-2.5 py-1.5 rounded-md border border-primary-200/50">{t.ticket_id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-sm text-text-primary flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-primary-600" /> {t.customer_name}
                        </span>
                        <span className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-muted" /> {t.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-text-secondary flex items-center gap-2 font-mono"><Phone className="w-3.5 h-3.5 text-muted" /> {t.phone_number}</span>
                        <span className="text-xs text-text-secondary flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted" /> {t.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-sm text-primary-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary-600" />
                          {new Date(t.consultation_date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-xs font-semibold text-muted flex items-center gap-2 ml-6">
                          <Clock className="w-3.5 h-3.5 text-muted/80" />
                          {t.consultation_time.slice(0, 5)} {parseInt(t.consultation_time) >= 12 ? 'PM' : 'AM'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      {t.status === "PENDING" ? (
                        <button onClick={() => handleClaimTicket(t.ticket_id)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2">
                          Claim Ticket <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-warning flex items-center gap-1.5 bg-warning-bg px-2.5 py-1 rounded-md border border-warning/20 w-fit">
                              <AlertCircle className="w-3 h-3" /> CLAIMED
                            </span>
                            <span className="text-xs font-semibold text-text-secondary">By: <span className="text-primary-900">{t.assignee_name}</span></span>
                          </div>
                          {(!t.assigned_to_id || user?.id === t.assigned_to_id || user?.role === "ADMIN") && (
                            <button
                              onClick={() => handleMarkCompleted(t.ticket_id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-4 py-2 rounded-lg shadow-sm transition-all flex w-fit items-center gap-1.5"
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

          {/* Mobile Card View */}
          <div className={`${viewMode === "auto" ? "flex xl:hidden" : viewMode === "cards" ? "flex" : "hidden"} flex-col bg-section-bg/20 p-3 sm:p-5 gap-4`}>
            {filteredTickets.map((t) => (
              <div key={t.id} className="p-4 bg-white rounded-xl border border-border/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col gap-4 hover:shadow-md transition-shadow">
                
                {/* Header Row: ID + Status */}
                <div className="flex justify-between items-start gap-3">
                  <span className="font-mono text-[11px] font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded border border-primary-200/50 w-fit">
                    {t.ticket_id}
                  </span>
                  {t.status !== "PENDING" && (
                    <span className="text-[9px] uppercase font-bold tracking-widest text-warning flex items-center gap-1.5 bg-warning-bg/50 px-2 py-1 rounded border border-warning/20">
                      <AlertCircle className="w-3 h-3" /> CLAIMED
                    </span>
                  )}
                </div>

                {/* Info Row: Client & Meeting */}
                <div className="flex justify-between items-start bg-section-bg/40 p-3 rounded-lg border border-border/50 gap-3">
                  
                  {/* Left: Client & Contact */}
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Client</span>
                    <span className="font-semibold text-sm text-text-primary flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-primary-600 shrink-0" /> <span className="truncate">{t.customer_name}</span>
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {t.company_name}
                    </span>
                    <span className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-muted" /> {t.phone_number}
                    </span>
                  </div>

                  {/* Right: Meeting */}
                  <div className="flex flex-col gap-1.5 items-end text-right shrink-0">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Meeting</span>
                    <span className="text-[13px] font-semibold text-primary-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary-600" />
                      {new Date(t.consultation_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] font-medium text-muted flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted" />
                      {t.consultation_time.slice(0, 5)} {parseInt(t.consultation_time) >= 12 ? 'PM' : 'AM'}
                    </span>
                  </div>

                </div>

                {/* Actions Footer */}
                <div className="pt-1">
                  {t.status === "PENDING" ? (
                    <button onClick={() => handleClaimTicket(t.ticket_id)} className="w-full justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2">
                      Claim Consultation <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs px-1">
                         <span className="text-muted font-medium">Assigned to:</span>
                         <span className="font-semibold text-primary-900">{t.assignee_name}</span>
                      </div>
                      {(!t.assigned_to_id || user?.id === t.assigned_to_id || user?.role === "ADMIN") && (
                        <button
                          onClick={() => handleMarkCompleted(t.ticket_id)}
                          className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
                        >
                          Mark Completed <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="py-16 text-center text-sm text-muted font-medium bg-section-bg/10 flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-muted/50" />
                No consultations found in this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
