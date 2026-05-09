"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Package, Receipt, CheckCircle } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CompletedOrderDetailPage() {
  const params = useParams();
  const ticket_id = params.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/tickets/completed/${ticket_id}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ticket_id]);

  if (loading) {
    return <div className="p-8 text-muted animate-pulse">Loading completed order details...</div>;
  }

  if (!data) {
    return (
      <div className="w-full text-center py-20">
        <h2 className="text-xl font-bold text-red-600 mb-2">Order Not Found</h2>
        <p className="text-muted mb-6">This order might not exist or hasn&apos;t been marked as completed.</p>
        <button onClick={() => router.back()} className="text-primary-600 hover:underline font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const { ticket, quote, invoice, delivery_notes } = data;

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 border border-border bg-white rounded-lg hover:bg-section-bg/50 text-muted transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">Completed Order Details</h1>
          <p className="text-muted text-sm flex items-center gap-2 mt-1">
            <span className="font-mono bg-primary-100 text-primary-900 px-2 py-0.5 rounded font-bold text-xs">
              {ticket.ticket_id}
            </span>
            <span>&bull;</span>
            <span className="font-semibold text-text-primary">{ticket.company_name}</span>
          </p>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-1.5 px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-bold shadow-md">
            <CheckCircle className="w-4 h-4 text-green-400" /> Order Complete
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Ticket Info */}
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
            <h3 className="font-bold text-xs text-primary-900 uppercase tracking-widest mb-5">Customer & Order Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-text-secondary font-medium">Company</span>
                <span className="font-bold text-primary-900">{ticket.company_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-text-secondary font-medium">Contact Person</span>
                <span className="font-semibold text-text-primary">{ticket.customer_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-text-secondary font-medium">Email</span>
                <span className="font-semibold text-text-primary">{ticket.email}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-text-secondary font-medium">LPO Number</span>
                <span className="font-mono font-bold text-text-primary bg-section-bg px-2 py-0.5 rounded text-xs">
                  {ticket.lpo_number || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-text-secondary font-medium">Completed On</span>
                <span className="font-semibold text-text-primary">
                  {new Date(ticket.updated_at).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents */}
        <div className="space-y-5">
          <h3 className="font-bold text-xs text-primary-900 uppercase tracking-widest mb-1 pl-1">Generated Documents</h3>

          {/* Quote */}
          {quote ? (
            <Link href={`/dashboard/quotes/${quote.id}/pdf`} className="flex items-center justify-between bg-white border border-border p-5 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary-900 mb-0.5">Approved Quote</p>
                  <p className="text-xs text-muted font-mono">{quote.quote_no}</p>
                </div>
              </div>
              <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-bold">View PDF</span>
              </div>
            </Link>
          ) : (
             <div className="flex items-center justify-between bg-section-bg border border-border p-5 rounded-2xl opacity-70">
                <p className="text-sm font-semibold text-muted">No quote attached</p>
             </div>
          )}

          {/* Invoice */}
          {invoice ? (
            <Link href={`/dashboard/invoices/${invoice.id}`} className="flex items-center justify-between bg-green-50 border border-green-200 p-5 rounded-2xl hover:border-green-400 hover:shadow-lg transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center border border-green-200">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900 flex items-center gap-2 mb-0.5">
                    Final Invoice
                    <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-md uppercase tracking-widest font-black">{invoice.status}</span>
                  </p>
                  <p className="text-xs text-green-700 font-mono font-medium">{invoice.invoice_no}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-green-900 mb-1">AED {invoice.invoice_total.toFixed(2)}</p>
                <div className="text-green-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                  <span className="text-[10px] font-bold bg-green-200 px-2 py-1 rounded">View PDF</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center justify-between bg-section-bg border border-border p-5 rounded-2xl opacity-70">
                <p className="text-sm font-semibold text-muted">No invoice generated</p>
            </div>
          )}

          {/* Delivery Notes */}
          {delivery_notes && delivery_notes.length > 0 ? (
            <div className="bg-white border border-border rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
              <h3 className="font-bold text-xs text-primary-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted" /> Delivery Notes
              </h3>
              <div className="space-y-3">
                {delivery_notes.map((dn: any) => (
                  <Link key={dn.id} href={`/dashboard/delivery-notes/${dn.id}`} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all group shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-primary-900 font-mono mb-0.5">{dn.note_no}</p>
                      <p className="text-xs text-muted font-medium">Dated: {new Date(dn.note_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border tracking-wide uppercase ${dn.status === "SENT" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {dn.status}
                      </span>
                      <span className="text-xs font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex items-center justify-between bg-section-bg border border-border p-5 rounded-2xl opacity-70 mt-4">
                <p className="text-sm font-semibold text-muted">No delivery notes found</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
