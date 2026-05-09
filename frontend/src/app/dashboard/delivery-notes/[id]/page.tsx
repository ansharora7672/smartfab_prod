"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Send, Phone, MapPin, Mail } from "lucide-react";
import Image from "next/image";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="#16A34A" width="14" height="14">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

export default function DeliveryNotePDFPage() {
  const params = useParams();
  const note_id = params.id as string;
  const router = useRouter();

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/delivery-notes/${note_id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setNote(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [note_id]);

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/delivery-notes/${note_id}/send`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send");
      setFeedback({ type: "success", message: "Delivery note emailed to client!" });
      setNote((prev: any) => ({ ...prev, status: "SENT" }));
    } catch {
      setFeedback({ type: "error", message: "Failed to send email." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-10 font-bold text-center">Loading Delivery Note...</div>;
  if (!note) return <div className="p-10 text-center text-red-600">Delivery note not found.</div>;

  // Ensure we always have 10 rows in the table
  const blankRows = Math.max(0, 10 - note.items.length);

  return (
    <div className="w-full min-h-screen bg-neutral-100 flex flex-col items-center py-8 print:py-0 print:bg-white print:min-h-0 text-black overflow-y-auto">
      <style type="text/css" media="print">{`@page { size: A4; margin: 0mm; } body { margin: 0px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`}</style>

      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 shadow-lg transition-all print:hidden
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}>
          {feedback.message}
        </div>
      )}

      {/* Action Bar */}
      <div className="w-[210mm] flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary-900 border bg-white px-4 py-2 rounded-lg shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md border
            ${note.status === "SENT" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
            STATUS: {note.status} · V{note.version}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSendEmail}
            disabled={sending || note.status === "SENT"}
            className="flex items-center gap-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 px-6 py-2.5 rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {sending ? "Sending..." : "Email to Client"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-900 px-6 py-2.5 rounded-lg shadow-md transition-colors">
            <Printer className="w-4 h-4" /> Save as PDF
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl relative overflow-hidden print:shadow-none print:w-[210mm] print:h-[297mm] p-[6mm_10mm_10mm_10mm] flex flex-col font-sans">

        {/* HEADER */}
        <div className="flex w-full mb-2 relative z-20 items-center justify-between">
          <div className="w-[180px] h-[180px] shrink-0 relative ml-1 scale-[1.25]">
            <Image src="/SmartFab_FinalLogo.png" alt="SmartFab Logo" layout="fill" objectFit="contain" priority />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center -ml-2">
            <h1 className="text-[#1E3A8A] font-black text-[38px] tracking-wide mb-1 leading-none">SMARTFAB</h1>
            <div className="flex items-center w-full justify-center opacity-100 mb-2 mt-1">
              <div className="h-[2px] w-[50px] bg-[#1E3A8A]"></div>
              <span className="mx-3 text-[#1E3A8A] font-[900] text-[18px] tracking-[0.2em] pt-0.5">LATHE</span>
              <div className="h-[2px] w-[50px] bg-[#1E3A8A]"></div>
            </div>
            <h3 className="text-[#1E3A8A] font-[800] text-[9.5px] tracking-[0.05em] uppercase mt-0.5 whitespace-nowrap">
              Engineering Accuracy. Crafted in Metal
            </h3>
          </div>
          <div className="w-[180px] shrink-0 flex flex-col text-[10.5px] items-start justify-center pl-4 font-semibold text-black gap-2">
            <div className="flex items-center gap-3"><WhatsAppIcon /> +971 54 213 3637</div>
            <div className="flex items-center gap-3"><Phone size={12} fill="currentColor" strokeWidth={0.5} /> +971 55 361 0905</div>
            <div className="flex items-center gap-3"><Mail size={12} /> lathe.smartfab@gmail.com</div>
            <div className="flex items-center gap-3"><MapPin size={12} fill="none" strokeWidth={2.5} /> Ajman, Dubai</div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full border-b-[2.5px] border-black mb-5 relative z-20"></div>

        {/* TITLE */}
        <div className="flex items-center w-full justify-center mb-5">
          <div className="h-[1.5px] w-[50px] bg-black"></div>
          <span className="mx-6 text-black font-black text-[22px] tracking-[0.2em] uppercase font-sans">DELIVERY NOTE</span>
          <div className="h-[1.5px] w-[50px] bg-black"></div>
        </div>

        {/* CLIENT DETAILS */}
        <div className="w-full flex-col space-y-[18px] mb-6 text-[12px] font-bold text-black uppercase px-2 font-sans tracking-widest">
          <div className="flex w-full items-end gap-2">
            <span className="shrink-0 tracking-widest">COMPANY :</span>
            <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black">{note.company_name}</div>
          </div>
          <div className="flex w-full items-end gap-2">
            <span className="shrink-0 tracking-widest">ADDRESS :</span>
            <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black">{note.address}</div>
          </div>
          <div className="flex w-full justify-between gap-12">
            <div className="flex flex-1 items-end gap-2">
              <span className="shrink-0 tracking-widest">PHONE NO :</span>
              <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black">{note.phone_number}</div>
            </div>
            <div className="flex w-[40%] items-end gap-2 pl-4">
              <span className="shrink-0 tracking-widest">DATE :</span>
              <div className="border-b-[1.5px] border-black flex-1 pb-1 text-center tracking-normal font-sans text-black">
                {new Date(note.note_date).toLocaleDateString("en-GB")}
              </div>
            </div>
          </div>
          <div className="flex w-full justify-between gap-12">
            <div className="flex flex-1 items-end gap-2">
              <span className="shrink-0 tracking-widest">ORDER NO :</span>
              <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black">{note.order_no}</div>
            </div>
            <div className="flex w-[40%] items-end gap-2 pl-4">
              <span className="shrink-0 tracking-widest">L.P.O. NO :</span>
              <div className="border-b-[1.5px] border-black flex-1 pb-1 text-center tracking-normal font-sans text-black">{note.lpo_no}</div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full border-2 border-black flex-1 mb-4 bg-white text-[13px] font-black text-center text-black font-sans border-collapse">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "57%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-black uppercase h-12">
              <th className="border-r-2 border-black text-[11px] font-black">SR.NO</th>
              <th className="border-r-2 border-black text-[11px] font-black">ITEM DESCRIPTION</th>
              <th className="border-r-2 border-black text-[11px] font-black">QTY</th>
              <th className="text-[11px] font-black">REMARK</th>
            </tr>
          </thead>
          <tbody>
            {note.items.map((item: any, i: number) => (
              <tr key={i} className="border-b border-black/30">
                <td className="border-r-2 border-black py-2.5 text-center">{item.sr_no}</td>
                <td className="border-r-2 border-black py-2.5 text-left pl-4 font-bold tracking-tight">{item.item_description}</td>
                <td className="border-r-2 border-black py-2.5 text-center">{item.qty}</td>
                <td className="py-2.5 text-left pl-3">{item.remark}</td>
              </tr>
            ))}
            {Array.from({ length: blankRows }).map((_, i) => (
              <tr key={`b-${i}`} className="border-b border-black/30" style={{ height: "36px" }}>
                <td className="border-r-2 border-black">&nbsp;</td>
                <td className="border-r-2 border-black"></td>
                <td className="border-r-2 border-black"></td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SIGNATURE BLOCK */}
        <div className="w-full border border-black p-4 mt-auto">
          <div className="flex justify-between uppercase text-[12px] font-black text-black font-sans tracking-[0.1em]">
            {/* SmartFab Signature */}
            <div className="flex flex-col justify-end w-[45%]">
              <div className="flex w-full pl-[60px] -mb-[8px] relative z-10 mix-blend-multiply">
                <div className="relative w-[130px] h-[50px]">
                  <Image src="/signature.png" alt="" layout="fill" objectFit="contain" priority unoptimized />
                </div>
              </div>
              <div className="flex items-end gap-2 relative z-0">
                <span className="shrink-0 tracking-widest z-10">DELIVER&apos;S SIGNATURE :</span>
                <div className="border-b-[1.5px] border-black flex-1 z-10"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
