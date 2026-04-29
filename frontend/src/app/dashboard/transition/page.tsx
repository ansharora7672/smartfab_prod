"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Building, Phone, Mail, Check, AlertCircle, Calendar, FileText, Send, Eye, Edit, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function TransitionTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

        {/* Draft → show Send to Client */}
        {quote.status === "DRAFT" && (
          <button
            onClick={() => handleSendQuote(quote.id)}
            disabled={sendingQuoteId === quote.id}
            className="bg-primary-600 hover:bg-primary-900 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {sendingQuoteId === quote.id ? "Sending..." : <>
              <Send className="w-3.5 h-3.5" /> Send to Client
            </>}
          </button>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-border bg-section-bg/30">
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Inquiry ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Client & Company</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Quote Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-section-bg/30 transition-colors">
                  
                  {/* ID */}
                  <td className="px-6 py-5">
                    <span className="font-mono text-sm font-bold text-primary-900 bg-primary-100/50 px-2 py-1 rounded-md">{t.ticket_id}</span>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-primary-600 mt-2 flex items-center gap-1.5">
                      {t.status === "CALL_COMPLETED" ? "Awaiting Quote" : "In Preparation"}
                    </div>
                  </td>
                  
                  {/* Name & Company */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-text-primary flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary-600" /> {t.customer_name}
                      </span>
                      <span className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-muted" /> {t.company_name}
                      </span>
                      <span className="text-xs text-muted flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3" /> {t.email}
                      </span>
                    </div>
                  </td>

                  {/* Quote Status Badge & Versions */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start gap-2">
                      {renderQuoteStatusBadge(t.quote)}
                      
                      {/* Show LPO status if completely approved */}
                      {t.lpo_number && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md border border-green-200 uppercase tracking-widest mt-1">
                          LPO: {t.lpo_number}
                        </span>
                      )}

                      {/* Display multiple quote versions if they exist */}
                      {t.quotes && t.quotes.length > 1 && (
                        <div className="flex flex-col gap-1 mt-2 w-full">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-widest border-b border-border pb-1 mb-1">
                            Version History
                          </span>
                          {t.quotes.map((q: any, index: number) => (
                            <Link 
                              key={q.id} 
                              href={`/dashboard/quotes/${q.id}/pdf`}
                              className="text-[11px] font-medium text-primary-600 hover:text-primary-900 transition-colors flex items-center justify-between"
                            >
                              <span>{q.quote_no}</span>
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
                      <span className="font-mono text-sm font-bold text-primary-900">
                        AED {t.quote.invoice_total?.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
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
              
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted font-medium bg-section-bg/10">
                    No tickets are currently waiting for a quote.
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
