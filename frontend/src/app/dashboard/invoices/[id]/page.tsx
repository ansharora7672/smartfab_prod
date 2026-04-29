"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Send } from "lucide-react";
import Image from "next/image";

export default function InvoicePDFPage() {
  const params = useParams();
  const invoice_id = params.id as string;
  const router = useRouter();

  const [invoice, setInvoice] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (feedback) { const t = setTimeout(() => setFeedback(null), 4000); return () => clearTimeout(t); }
  }, [feedback]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/invoices/${invoice_id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setInvoice(d.invoice); setTicket(d.ticket); setLoading(false); })
      .catch(() => setLoading(false));
  }, [invoice_id]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/invoices/${invoice_id}/send`, {
        method: "POST", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send");
      setFeedback({ type: "success", message: "Invoice emailed to client. Order marked completed." });
      setInvoice((prev: any) => ({ ...prev, status: "SENT" }));
    } catch {
      setFeedback({ type: "error", message: "Failed to send invoice." });
    } finally { setSending(false); }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Invoice...</div>;
  if (!invoice) return <div className="p-10 text-center text-red-600">Invoice not found.</div>;

  const meta = [
    ["Invoice No.", ticket?.ticket_id || invoice.invoice_no],
    ["Dated", new Date(invoice.created_at).toLocaleDateString("en-GB")],
    ["Delivery Note", invoice.delivery_note],
    ["Mode/Terms of Payment", invoice.payment_terms],
    ["Supplier's Ref.", invoice.supplier_reference],
    ["Other Reference(s)", invoice.other_references],
    ["Buyer's Order No. (LPO)", invoice.buyers_order_no || ticket?.lpo_number],
    ["Dated", invoice.buyers_order_dated],
    ["Despatch Document No.", invoice.despatch_doc_no],
    ["Delivery Note Date", invoice.delivery_note_date],
    ["Despatched through", invoice.despatched_through],
    ["Destination", invoice.destination],
  ];

  // Pair into rows of 2
  const metaRows: [string, string][][] = [];
  for (let i = 0; i < meta.length; i += 2) {
    metaRows.push([meta[i] as [string, string], meta[i + 1] as [string, string]]);
  }

  const blankRows = Math.max(0, 8 - invoice.items.length);

  return (
    <div className="w-full min-h-screen bg-neutral-100 flex flex-col items-center py-8 print:py-0 print:bg-white text-black overflow-y-auto">
      <style type="text/css" media="print">{`@page { size: A4; margin: 0mm; } body { margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }`}</style>

      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium shadow-lg print:hidden
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}>
          {feedback.message}
        </div>
      )}

      {/* Action bar */}
      <div className="w-[210mm] flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary-900 border bg-white px-4 py-2 rounded-lg shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md border
            ${invoice.status === "SENT" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSend} disabled={sending || invoice.status === "SENT"}
            className="flex items-center gap-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 px-6 py-2.5 rounded-lg shadow-md transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" /> {sending ? "Sending..." : invoice.status === "SENT" ? "Sent" : "Email to Client"}
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-900 px-6 py-2.5 rounded-lg shadow-md transition-colors">
            <Printer className="w-4 h-4" /> Save as PDF
          </button>
        </div>
      </div>

      {/* A4 */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl print:shadow-none print:w-[210mm] p-[6mm] flex flex-col font-sans text-black text-[10px]">

        {/* Title */}
        <h1 className="text-center text-[18px] font-black tracking-[8px] uppercase mb-[5px]">Commercial Invoice</h1>

        {/* Header grid */}
        <div className="flex border border-black mb-[5px]">
          {/* Left — company info */}
          <div className="w-[50%] border-r border-black p-2 flex items-center gap-3">
            <div className="relative w-[120px] h-[120px] shrink-0">
              <Image src="/SmartFab_FinalLogo_version.png" alt="Logo" layout="fill" objectFit="contain" priority />
            </div>
            <div>
              <div className="text-[16px] font-black text-[#1E3A8A] mb-1">SmartFab Lathe</div>
              <div className="text-[8px] leading-[1.7] text-[#333]">
                Industrial 2, Ajman<br />
                United Arab Emirates<br />
                Tel : +971 542133637, +971 553610905<br />
                TRN : 105326755300003<br />
                E-mail : lathe.smartfab@gmail.com
              </div>
            </div>
          </div>
          {/* Right — meta grid */}
          <div className="w-[50%] flex flex-col">
            {metaRows.map((pair, ri) => (
              <div key={ri} className="flex border-b border-black last:border-b-0">
                {pair.map(([label, value], ci) => (
                  <div key={ci} className={`flex-1 p-1.5 min-h-[28px] flex flex-col justify-center ${ci === 0 ? "border-r border-black" : ""}`}>
                    <span className="text-[6.5px] text-[#666] leading-none mb-0.5">{label}</span>
                    <span className="text-[8.5px] font-semibold leading-tight">{value || "\u00A0"}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Buyer + Terms */}
        <div className="flex gap-[5px] mb-[5px]">
          <div className="w-[50%] border border-black p-2 min-h-[70px]">
            <div className="font-bold text-[7.5px] mb-1">Buyer</div>
            <div className="font-bold text-[10px] mb-1">{ticket?.company_name}</div>
            <div className="text-[8px] leading-[1.6]">
              Attn: {ticket?.customer_name}<br />
              {ticket?.company_address}<br />
              Tel: {ticket?.phone_number}
            </div>
          </div>
          <div className="w-[50%] border border-black p-2 min-h-[70px]">
            <div className="text-[6.5px] text-[#666] mb-1">Terms of Delivery</div>
            <div className="text-[8.5px] font-semibold">{invoice.terms_of_delivery}</div>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-black flex-1 flex flex-col mb-[5px] overflow-hidden">
          {/* Header */}
          <div className="flex bg-[#f5f5f5] border-b border-black text-[7px] font-black text-center uppercase shrink-0">
            {[
              ["5%", "Sr\nNo"], ["31%", "Description of Service"], ["6%", "Qty"],
              ["10%", "Rate"], ["10%", "Rate\n(Incl.VAT)"], ["5%", "per"],
              ["9%", "Disc.\nAmt(AED)"], ["5%", "VAT\n%"], ["9%", "Amount"], ["10%", "Total\nIncl.VAT(AED)"],
            ].map(([w, label], i, arr) => (
              <div key={i} className={`flex items-center justify-center py-1.5 px-0.5 whitespace-pre-line leading-tight ${i < arr.length - 1 ? "border-r border-black" : ""}`}
                style={{ width: w }}>{label}</div>
            ))}
          </div>
          {/* Body — fills remaining height */}
          <div className="relative flex-1">
            {/* Watermark centered in body */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.07]">
              <div className="relative w-[520px] h-[520px]">
                <Image src="/SmartFab_FinalLogo_version.png" alt="" layout="fill" objectFit="contain" />
              </div>
            </div>
            {/* Full-height column grid lines */}
            <div className="absolute inset-0 flex pointer-events-none z-0">
              {["5%","31%","6%","10%","10%","5%","9%","5%","9%"].map((w, ci) => (
                <div key={ci} className="border-r border-black/20 h-full" style={{ width: w }} />
              ))}
            </div>
            {/* Data rows */}
            <div className="relative z-10">
              {invoice.items.map((item: any, i: number) => (
                <div key={i} className="flex border-b border-black/30 text-[8.5px] text-center">
                  {[
                    ["5%", item.sr_no],
                    ["31%", item.description_of_service, true],
                    ["6%", item.quantity],
                    ["10%", item.rate_excl_vat?.toFixed(2)],
                    ["10%", item.rate_incl_vat?.toFixed(2)],
                    ["5%", item.per],
                    ["9%", item.discount_aed?.toFixed(2)],
                    ["5%", `${item.vat_percentage}%`],
                    ["9%", item.amount?.toFixed(2)],
                    ["10%", <strong key="t">{item.total_incl_vat?.toFixed(2)}</strong>],
                  ].map(([w, val, left], ci, arr) => (
                    <div key={ci} className={`py-1.5 px-1 ${left ? "text-left" : ""} ${ci < arr.length - 1 ? "border-r border-black/30" : ""}`}
                      style={{ width: w as string }}>{val as React.ReactNode}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer totals */}
        <div className="flex border border-black mb-[5px] min-h-[80px]">
          <div className="w-[65%] border-r border-black p-2 flex flex-col justify-between">
            <div>
              <div className="font-bold text-[8px] mb-1">Amount Chargeable (in words)</div>
              <div className="text-[9px] font-semibold italic border-b border-dotted border-black inline-block min-w-[80%] pb-0.5">
                {invoice.amount_chargeable_words}
              </div>
            </div>
            <div className="text-[6.5px] leading-[1.5]">
              <span className="font-bold">Declaration</span><br />
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
          </div>
          <div className="w-[35%] flex flex-col">
            <div className="flex justify-between px-2 py-1.5 text-[8.5px] border-b border-black">
              <span>Taxable Value</span><span>{invoice.taxable_value?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-2 py-1.5 text-[8.5px] border-b border-black">
              <span>Value Added Tax</span><span>{invoice.vat_total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-2 py-1.5 flex-1 items-center bg-[#f5f5f5]">
              <span className="font-black text-[10px] uppercase tracking-wide">Invoice Total</span>
              <span className="font-black text-[12px]">AED {invoice.invoice_total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signature — SmartFab only */}
        <div className="flex justify-end border border-black min-h-[70px]">
          <div className="w-[40%] p-2 flex flex-col justify-between">
            <div className="font-bold text-[8.5px]">For SmartFab Lathe</div>
            <div className="relative h-[40px] mix-blend-multiply">
              <Image src="/signature.png" alt="" layout="fill" objectFit="contain" unoptimized priority />
            </div>
            <div className="text-[6.5px] text-[#666] text-right">Authorised Signatory</div>
          </div>
        </div>

      </div>
    </div>
  );
}
