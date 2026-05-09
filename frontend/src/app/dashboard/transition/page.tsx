"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Building, Phone, Mail, Check, AlertCircle, Calendar, FileText, Send, Eye, Edit, RotateCcw, UserCheck, LayoutList, Table } from "lucide-react";
import Link from "next/link";

const TABS = [
  { key: "ALL",  label: "All" },
  { key: "MINE", label: "Assigned to Me" },
] as const;

type FilterKey = typeof TABS[number]["key"];

export default function TransitionTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("table");
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-dismiss alerts
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchTransitionTickets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/transition`, {
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

  useEffect(() => {
    fetchTransitionTickets();
  }, []);

  const handleSendQuote = async (quoteId: string) => {
    setSendingQuoteId(quoteId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/quotes/${quoteId}/send`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Failed to send");
      }
      const data = await res.json();
      setFeedback({ type: "success", message: data.message });
      // Re-fetch to update statuses
      fetchTransitionTickets();
    } catch (err: any) {
      setFeedback({ type: "error", message: `Send failed: ${err.message}` });
    } finally {
      setSendingQuoteId(null);
    }
  };

  // Staff manual LPO entry
  const handleEnterLpo = async (quoteId: string) => {
    const lpoNum = window.prompt("Enter the client's Local Purchase Order (LPO) number:");
    if (!lpoNum || !lpoNum.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/quotes/${quoteId}/enter-lpo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lpo_number: lpoNum.trim() }),
      });

      if (!res.ok) throw new Error("Failed to save LPO number");

      setFeedback({ message: `LPO ${lpoNum} saved! Ticket is now an Active Order.`, type: "success" });
      setTimeout(() => setFeedback(null), 4000);
      fetchTransitionTickets(); // Refresh the list (it should disappear from this view as it moves to ACTIVE_ORDER)
    } catch (err: any) {
      setFeedback({ message: err.message, type: "error" });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Helper: renders the right badge based on quote status
  const renderQuoteStatusBadge = (quote: any) => {
    if (!quote) {
      return (
        <span className="text-xs font-semibold text-muted bg-[#F1F5F9] px-2.5 py-1.5 rounded-md border border-[#CBD5E1]">
          Not Created
        </span>
      );
    }

    const statusStyles: Record<string, string> = {
      DRAFT: "bg-[#F1F5F9] border-[#CBD5E1] text-muted",
      SENT: "bg-[#DBEAFE] border-[#2563EB]/20 text-[#2563EB]",
      APPROVED: "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]",
      REJECTED: "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]",
      MODIFICATION_REQUESTED: "bg-[#FEF3C7] border-[#F59E0B]/20 text-[#92400E]",
    };

    const statusLabels: Record<string, string> = {
      DRAFT: "Draft",
      SENT: "Sent to Client",
      APPROVED: "Approved",
      REJECTED: "Declined",
      MODIFICATION_REQUESTED: "Changes Requested",
    };

    return (
      <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border ${statusStyles[quote.status] || statusStyles.DRAFT}`}>
        {statusLabels[quote.status] || quote.status}
      </span>
    );
  };

  // Helper: renders the right action buttons based on quote state
  const renderActions = (t: any) => {
    const quote = t.quote;

    // No quote yet → show "Generate Quote"
    if (!quote) {
      return (
        <Link
          href={`/dashboard/quotes/new?ticket_id=${t.id}`}
          className="bg-primary-900 hover:bg-primary-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all flex w-fit items-center gap-2"
        >
          Generate Quote <FileText className="w-3.5 h-3.5" />
        </Link>
      );
    }

    // Quote exists → show Preview + contextual actions
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {/* Always show Preview */}
        <Link
          href={`/dashboard/quotes/${quote.id}/pdf`}
          className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-text-primary font-semibold text-xs px-3.5 py-2 rounded-lg border border-border transition-all flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </Link>

        {/* Draft → show Edit Draft + Send to Client */}
        {quote.status === "DRAFT" && (
          <>
            <Link
              href={`/dashboard/quotes/new?ticket_id=${t.id}&quote_id=${quote.id}`}
              className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-text-primary font-semibold text-xs px-3.5 py-2 rounded-lg border border-border transition-all flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Draft
            </Link>
            <button
              onClick={() => handleSendQuote(quote.id)}
              disabled={sendingQuoteId === quote.id}
              className="bg-primary-600 hover:bg-primary-900 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {sendingQuoteId === quote.id ? "Sending..." : <>
                <Send className="w-3.5 h-3.5" /> Send to Client
              </>}
            </button>
          </>
        )}

        {/* Sent / Modification Requested → show Resend */}
        {(quote.status === "SENT" || quote.status === "MODIFICATION_REQUESTED") && (
          <button
            onClick={() => handleSendQuote(quote.id)}
            disabled={sendingQuoteId === quote.id}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {sendingQuoteId === quote.id ? "Sending..." : <>
              <RotateCcw className="w-3.5 h-3.5" /> Resend
            </>}
          </button>
        )}

        {/* Approved and waiting for LPO → show Enter LPO manually */}
        {quote.status === "APPROVED" && !t.lpo_number && (
          <button
            onClick={() => handleEnterLpo(quote.id)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            Enter LPO
          </button>
        )}

        {/* Rejected or Modification Requested → show Create Revision */}
        {(quote.status === "REJECTED" || quote.status === "MODIFICATION_REQUESTED") && (
          <Link
            href={`/dashboard/quotes/new?ticket_id=${t.id}`}
            className="bg-primary-900 hover:bg-primary-600 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Create Revision
          </Link>
        )}
      </div>
    );
  };

  const getFilteredTickets = (key: FilterKey) => {
    if (key === "MINE") return tickets.filter(t => t.assigned_to_id === user?.id);
    return tickets;
  };

  const filteredTickets = getFilteredTickets(filter);

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading transition tickets...</div>;

  return (
    <div className="w-full">
      {/* Alert Banner */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 shadow-lg transition-all
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-900 font-heading mb-1">
            Quote Preparation
          </h1>
          <p className="text-muted text-sm max-w-xl leading-relaxed">
            Consultations completed. Generate quotes, preview PDFs, and send to clients.
          </p>
        </div>
      </div>

      {/* Table Module */}
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
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Quote Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-section-bg/30 transition-colors">
                    
                    {/* ID */}
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-bold text-primary-900 bg-primary-100/50 px-2.5 py-1.5 rounded-md border border-primary-200/50">{t.ticket_id}</span>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-primary-600 mt-2.5 flex items-center gap-1.5">
                        {t.status === "CALL_COMPLETED" ? "Awaiting Quote" : "In Preparation"}
                      </div>
                    </td>
                    
                    {/* Name & Company */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-sm text-text-primary flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-primary-600" /> {t.customer_name}
                        </span>
                        <span className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-muted" /> {t.company_name}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-2 mt-0.5">
                          <Mail className="w-3 h-3" /> {t.email}
                        </span>
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-6 py-5">
                      {t.assignee_name ? (
                        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                          <UserCheck className="w-4 h-4 text-primary-600 shrink-0" />
                          {t.assignee_name}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted bg-section-bg px-2.5 py-1 rounded-md border border-border">Unassigned</span>
                      )}
                    </td>

                    {/* Quote Status Badge & Versions */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-2">
                        {renderQuoteStatusBadge(t.quote)}
                        
                        {/* Show LPO status if completely approved */}
                        {t.lpo_number && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md border border-green-200 uppercase tracking-widest mt-1 shadow-sm">
                            LPO: {t.lpo_number}
                          </span>
                        )}

                        {/* Display multiple quote versions if they exist */}
                        {t.quotes && t.quotes.length > 1 && (
                          <div className="flex flex-col gap-1.5 mt-2 w-full bg-white p-2 rounded-lg border border-border/60 shadow-sm">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-widest border-b border-border/50 pb-1 mb-0.5">
                              Version History
                            </span>
                            {t.quotes.map((q: any, index: number) => (
                              <Link 
                                key={q.id} 
                                href={`/dashboard/quotes/${q.id}/pdf`}
                                className="text-[11px] font-semibold text-primary-600 hover:text-primary-900 transition-colors flex items-center justify-between"
                              >
                                <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> {q.quote_no}</span>
                                <span className="text-[9px] text-muted ml-2">{q.status}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Quote Total */}
                    <td className="px-6 py-5">
                      {t.quote ? (
                        <span className="font-mono text-sm font-bold text-primary-900 bg-primary-50 px-2.5 py-1.5 rounded-md border border-primary-100">
                          AED {t.quote.invoice_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-muted bg-section-bg px-2.5 py-1.5 rounded-md border border-border">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end pr-2">
                        {renderActions(t)}
                      </div>
                    </td>
                    
                  </tr>
                ))}
                
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-muted font-medium bg-section-bg/10">
                      {filter === "MINE" ? "No quotes are currently assigned to you." : "No tickets are currently waiting for a quote."}
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
                
                {/* Header Row */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded border border-primary-200/50 w-fit">
                      {t.ticket_id}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-primary-600">
                      {t.status === "CALL_COMPLETED" ? "Awaiting Quote" : "In Preparation"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {renderQuoteStatusBadge(t.quote)}
                    {t.lpo_number && (
                      <span className="text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200 uppercase tracking-widest">
                        LPO: {t.lpo_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Row: Client & Assignment/Total */}
                <div className="flex justify-between items-start bg-section-bg/40 p-3 rounded-lg border border-border/50 gap-3">
                  
                  {/* Left: Client */}
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Client</span>
                    <span className="font-semibold text-sm text-text-primary flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-primary-600 shrink-0" /> <span className="truncate">{t.customer_name}</span>
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {t.company_name}
                    </span>
                  </div>

                  {/* Right: Assigned & Total */}
                  <div className="flex flex-col gap-1.5 items-end text-right shrink-0">
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Assigned</span>
                    {t.assignee_name ? (
                      <span className="text-sm font-semibold text-text-primary truncate max-w-[100px]">
                        {t.assignee_name.split(' ')[0]}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted bg-section-bg px-1.5 py-0.5 rounded border border-border">Unassigned</span>
                    )}
                    
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">Total</span>
                    {t.quote ? (
                      <span className="font-mono text-[13px] font-bold text-primary-900">
                        AED {t.quote.invoice_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </div>

                </div>

                {/* Version History (Only if multiple) */}
                {t.quotes && t.quotes.length > 1 && (
                  <div className="flex flex-col gap-2 bg-section-bg/30 p-2.5 rounded-lg border border-border/50">
                    <span className="text-[9px] text-muted font-bold uppercase tracking-widest">
                      Version History
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {t.quotes.map((q: any) => (
                        <Link 
                          key={q.id} 
                          href={`/dashboard/quotes/${q.id}/pdf`}
                          className="text-[10px] font-semibold text-primary-600 hover:text-primary-900 transition-colors flex items-center justify-between bg-white p-1.5 rounded border border-border/60"
                        >
                          <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> {q.quote_no}</span>
                          <span className="text-[8px] text-muted">{q.status}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-1">
                  <div className="flex flex-col w-full gap-2 [&>div]:w-full [&>div]:flex [&>div]:flex-col [&>div]:gap-2">
                    {renderActions(t)}
                  </div>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="py-16 text-center text-sm text-muted font-medium bg-section-bg/10 flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-muted/50" />
                {filter === "MINE" ? "No quotes are currently assigned to you." : "No tickets are currently waiting for a quote."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
