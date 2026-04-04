"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Building, Phone, Mail, Check, AlertCircle, Calendar, FileText, Send } from "lucide-react";
import Link from "next/link";

export default function TransitionTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
            Consultations completed. Manage vendor negotiations and generate official quotes.
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
                <th className="px-6 py-4 text-[11px] font-bold text-muted uppercase tracking-widest">Approval</th>
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

                  {/* Quote Sent Status (Mocked until Quote Engine is built) */}
                  <td className="px-6 py-5">
                     <span className="text-xs font-semibold text-muted bg-[#F1F5F9] px-2.5 py-1.5 rounded-md border border-[#CBD5E1]">
                       Not Sent
                     </span>
                  </td>

                  {/* Quote Approved Status (Mocked until Quote Engine is built) */}
                  <td className="px-6 py-5">
                    <span className="text-xs font-semibold text-muted bg-[#F1F5F9] px-2.5 py-1.5 rounded-md border border-[#CBD5E1]">
                       Pending Submission
                     </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end pr-2">
                      <Link 
                        href={`/dashboard/quotes/new?ticket_id=${t.ticket_id}`}
                        className="bg-primary-900 hover:bg-primary-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all flex w-fit items-center gap-2"
                      >
                        Generate Quote <FileText className="w-3.5 h-3.5" />
                      </Link>
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
