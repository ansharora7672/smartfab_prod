"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Send, Phone, MapPin, Mail } from "lucide-react";
import Image from "next/image";

// WhatsApp Custom Icon
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="#16A34A" width="14" height="14">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

export default function QuotePDFView() {
  const params = useParams();
  const quote_id = params.id as string;
  const router = useRouter();

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/quotes/quote/${quote_id}`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to fetch Quote");
        const data = await res.json();
        setQuote(data.quote);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load PDF data", err);
      }
    };
    fetchData();
  }, [quote_id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 font-bold text-center">Loading Print View...</div>;

  return (
    <div className="w-full min-h-screen bg-neutral-100 flex flex-col items-center py-8 print:py-0 print:bg-white print:min-h-0 text-black overflow-y-auto">
      <style type="text/css" media="print">{`@page { size: A4; margin: 0mm; } body { margin: 0px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`}</style>
      
      {/* Non-Printable Action Bar */}
      <div className="w-[210mm] flex justify-between items-center mb-6 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary-900 border bg-white px-4 py-2 rounded-lg shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-900 px-6 py-2.5 rounded-lg shadow-md transition-colors">
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* A4 PAGE CONTAINER - Exactly 210x297mm */}
      <div className="w-[210mm] h-[297mm] bg-white shadow-2xl relative overflow-hidden print:shadow-none print:w-[210mm] print:h-[297mm] p-[6mm_10mm_10mm_10mm] flex flex-col font-sans">
        
        {/* HEADER SECTION */}
        <div className="flex w-full mb-2 relative z-20 items-center justify-between">
            {/* Logo scaled up visually to keep the container layout untouched */}
            <div className="w-[180px] h-[180px] shrink-0 relative ml-1 scale-[1.25]">
                 <Image src="/SmartFab_FinalLogo_version.png" alt="SmartFab Logo" layout="fill" objectFit="contain" priority />
            </div>
            
            {/* Centered Massive Text */}
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
            
            {/* Right Icons */}
            <div className="w-[180px] shrink-0 flex flex-col text-[10.5px] items-start justify-center pl-4 font-semibold text-black gap-2">
              <div className="flex items-center gap-3"><WhatsAppIcon /> +971 54 213 3637</div>
              <div className="flex items-center gap-3"><Phone size={12} fill="currentColor" strokeWidth={0.5} /> +971 55 361 0905</div>
              <div className="flex items-center gap-3"><Mail size={12} /> lathe.smartfab@gmail.com</div>
              <div className="flex items-center gap-3"><MapPin size={12} fill="none" strokeWidth={2.5}/> Ajman, Dubai</div>
            </div>
        </div>

        {/* Separator */}
        <div className="w-full border-b-[2.5px] border-black mb-6 relative z-20"></div>

        {/* QUOTATION TITLE */}
        <div className="flex items-center w-full justify-center mb-6">
            <div className="h-[1.5px] w-[50px] bg-black"></div>
            <span className="mx-6 text-black font-black text-[22px] tracking-[0.2em] uppercase font-sans">QUOTATION</span>
            <div className="h-[1.5px] w-[50px] bg-black"></div>
        </div>

        {/* CLIENT DETAILS */}
        <div className="w-full flex-col space-y-[26px] mb-10 text-[12px] font-bold text-black uppercase px-2 font-sans tracking-widest">
           <div className="flex w-full items-end gap-2">
             <span className="shrink-0 tracking-widest">COMPANY :</span>
             <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black"> {quote.company_name} </div>
           </div>
           
           <div className="flex w-full items-end gap-2">
             <span className="shrink-0 tracking-widest">ADDRESS :</span>
             <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black"> {quote.address} </div>
           </div>

           <div className="flex w-full justify-between gap-12">
             <div className="flex flex-1 items-end gap-2">
               <span className="shrink-0 tracking-widest">PHONE NO :</span>
               <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black"> {quote.phone_no} </div>
             </div>
             <div className="flex w-[40%] items-end gap-2 pl-4">
               <span className="shrink-0 tracking-widest">DATE :</span>
               <div className="border-b-[1.5px] border-black flex-1 pb-1 text-center tracking-normal font-sans text-black"> {new Date(quote.quote_date).toLocaleDateString()} </div>
             </div>
           </div>

           <div className="flex w-full justify-between gap-12">
             <div className="flex flex-1 items-end gap-2">
               <span className="shrink-0 tracking-widest">ORDER NO :</span>
               <div className="border-b-[1.5px] border-black flex-1 pb-1 tracking-normal pl-2 font-sans text-black"> {quote.quote_no} </div>
             </div>
             <div className="flex w-[40%] items-end gap-2 pl-4">
               <span className="shrink-0 tracking-widest">L.P.O. NO :</span>
               <div className="border-b-[1.5px] border-black flex-1 pb-1 text-center tracking-normal font-sans text-black"> {quote.lpo_no} </div>
             </div>
           </div>

           <div className="flex w-[55%] items-end gap-2">
             <span className="shrink-0 tracking-widest">LEAD TIME (APPROX) :</span>
             <div className="border-b-[1.5px] border-black flex-1 pb-1 text-center tracking-normal font-sans text-black"> {quote.lead_time_approx} </div>
           </div>
        </div>

        {/* THE ITEMS TABLE - EXACT PIXEL-PERFECT REPLICA */}
        <div className="w-full border-2 border-black flex-1 flex flex-col mb-4 bg-white text-[13px] font-black text-center text-black font-sans">
          
          {/* Table Header */}
          <div className="flex border-b-2 border-black w-full bg-white relative z-10 uppercase h-14">
             <div className="w-[10%] border-r-2 border-black flex items-center justify-center">SR.NO</div>
             <div className="w-[47%] border-r-2 border-black flex items-center justify-center">ITEM DESCRIPTION</div>
             <div className="w-[11%] border-r-2 border-black flex items-center justify-center">QTY</div>
             <div className="w-[16%] border-r-2 border-black flex items-center justify-center">U PRICE</div>
             <div className="w-[16%] flex items-center justify-center flex-col leading-tight">TOTAL<br/>AMOUNT</div>
          </div>

          <div className="flex flex-1 w-full bg-white relative z-0">
             {/* Col 1 */}
             <div className="w-[10%] border-r-2 border-black h-full flex flex-col font-bold">
                {quote.items.map((item: any, i: number) => <div key={i} className="py-2.5">{item.sr_no}</div>)}
             </div>
             {/* Col 2 */}
             <div className="w-[47%] border-r-2 border-black h-full flex flex-col font-bold tracking-tight">
                {quote.items.map((item: any, i: number) => <div key={i} className="py-2.5 text-left pl-4">{item.item_description}</div>)}
             </div>
             {/* Col 3 */}
             <div className="w-[11%] border-r-2 border-black h-full flex flex-col font-bold">
                {quote.items.map((item: any, i: number) => <div key={i} className="py-2.5">{item.qty}</div>)}
             </div>
             {/* Col 4 */}
             <div className="w-[16%] border-r-2 border-black h-full flex flex-col font-bold">
                {quote.items.map((item: any, i: number) => <div key={i} className="py-2.5">{item.u_price.toFixed(2)}</div>)}
             </div>
             {/* Col 5 */}
             <div className="w-[16%] h-full flex flex-col font-bold">
                {quote.items.map((item: any, i: number) => <div key={i} className="py-2.5">{item.total_amount.toFixed(2)}</div>)}
             </div>
          </div>
        </div>

        {/* Footer info block */}
        <div className="w-full flex flex-col mb-12 text-[11px] leading-[1.4] font-semibold text-black mt-2 font-sans">
            <span className="underline font-bold mb-1.5 underline-offset-2">Terms & Conditions</span>
            <div className="pl-4 flex flex-col gap-1 text-justify pr-4">
              <p>1. Payment Terms - 50% advance will be payable along with the LPO, and 50% on Completion after the works.</p>
              <p>2. Manufacturing & Fabrication - Manufacturing and fabrication activities will commence only after receipt of order confirmation and initial advance payment. Any materials to be supplied by the customer must be provided prior to the start of production. We hope the above is in line with your requirement, and we look forward to receiving your valued orders.</p>
            </div>
            
            <p className="mt-8 mb-1 font-bold">
              If you require any further clarification/assistance, don't hesitate to contact us.<br/>
              Thanks,
            </p>
            
            <h3 className="font-black text-sm mt-3.5">SmartFab Lathe</h3>
        </div>

        {/* SIGNATURE BLOCK */}
        <div className="w-full flex justify-between uppercase text-[12px] font-black mt-auto pb-6 text-black px-1 font-sans tracking-[0.1em]">
           
           {/* LEFT (COMPANY) SIGNATURE */}
           <div className="flex flex-col justify-end w-[45%]">
             {/* Image container firmly placed right above the span line */}
             <div className="flex w-full pl-[95px] -mb-[8px] relative z-10 mix-blend-multiply">
                 <div className="relative w-[130px] h-[50px]">
                    <Image src="/signature.png" alt="" layout="fill" objectFit="contain" priority unoptimized />
                 </div>
             </div>
             <div className="flex items-end gap-2 relative z-0">
                 <span className="shrink-0 tracking-widest z-10">SIGNATURE :</span>
                 <div className="border-b-[1.5px] border-black flex-1 z-10"></div>
             </div>
           </div>
           
           {/* RIGHT (CLIENT) SIGNATURE */}
           <div className="flex flex-col justify-end w-[45%] mb-[8px]">
             <div className="flex items-end gap-2">
                 <span className="shrink-0 tracking-widest z-10">SIGNATURE :</span>
                 <div className="border-b-[1.5px] border-black flex-1 z-10"></div>
             </div>
           </div>

        </div>

      </div>
    </div>
  );
}
