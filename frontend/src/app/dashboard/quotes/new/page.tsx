"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface QuoteItem {
  sr_no: number;
  item_description: string;
  qty: number;
  u_price: number;
  total_amount: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticket_id = searchParams.get("ticket_id");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Global Quote Metadata (Simplified for Quotation)
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [lpoNo, setLpoNo] = useState("");
  const [leadTimeApprox, setLeadTimeApprox] = useState("");

  // Items State
  const [items, setItems] = useState<QuoteItem[]>([
    {
      sr_no: 1,
      item_description: "",
      qty: 1,
      u_price: 0,
      total_amount: 0,
    },
  ]);

  // Derived Totals
  const invoiceTotal = items.reduce((acc, item) => acc + item.total_amount, 0);

  // Auto-dismiss alerts
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Pre-fill the Quote Details if coming from a ticket link
  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticket_id) return;
      
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}`, {
          // Send credentials to access the internal endpoint securely
          credentials: "include" 
        });
        
        if (!res.ok) throw new Error("Could not fetch ticket details");
        
        const data = await res.json();
        
        // Populate the editable form fields!
        setCompanyName(data.company_name || "");
        setAddress(data.company_address || "");
        setPhoneNo(data.phone_number || "");
        
        // If an LPO already happened somehow, prepopulate that too
        if (data.lpo_number) setLpoNo(data.lpo_number);

      } catch (err: any) {
        console.error(err);
        setFeedback({ type: "error", message: "Failed to load pre-fill data. You can enter them manually." });
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [ticket_id]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        sr_no: items.length + 1,
        item_description: "",
        qty: 1,
        u_price: 0,
        total_amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Recalculate Serial Numbers
    newItems.forEach((item, i) => {
      item.sr_no = i + 1;
    });
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];

    const numericFields: (keyof QuoteItem)[] = ['sr_no', 'qty', 'u_price', 'total_amount'];
    const parsedValue = numericFields.includes(field) ? (parseFloat(value as string) || 0) : value;
    
    const item = { ...newItems[index], [field]: parsedValue };

    // Auto-calculate total amount
    if (field === 'qty' || field === 'u_price') {
      item.total_amount = (item.qty || 0) * (item.u_price || 0);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleSaveQuote = async () => {
    if (!ticket_id) {
      setFeedback({ type: "error", message: "Missing Ticket ID. Cannot save." });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ticket_id,
        company_name: companyName,
        address,
        phone_no: phoneNo,
        lpo_no: lpoNo,
        lead_time_approx: leadTimeApprox,
        items
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/quotes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const detail = errorBody?.detail || `Server returned ${res.status}`;
        throw new Error(detail);
      }
      
      const newQuote = await res.json();
      
      setFeedback({ type: "success", message: "Quote saved successfully! Generating View..." });
      
      setTimeout(() => {
         router.push(`/dashboard/quotes/${newQuote.id}/pdf`);
      }, 1500);

    } catch (err: any) {
      setFeedback({ type: "error", message: `Save failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      {/* Alert Banner */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium flex items-center gap-3 shadow-lg transition-all
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/transition" className="p-2 border rounded-lg hover:bg-section-bg/50 text-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">Quote Builder</h1>
          <p className="text-muted text-sm">Configure terms and pricing items for this quote.</p>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Global Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white border border-border shadow-sm rounded-2xl">
            <h3 className="font-bold text-sm text-primary-900 uppercase tracking-widest mb-4">Client & Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="E.g., Acme Corp"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="E.g., 123 Industrial Rd"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Phone Number</label>
                <input type="text" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="+971..."/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">L.P.O. No (If available)</label>
                <input type="text" value={lpoNo} onChange={(e) => setLpoNo(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="Optional..."/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Lead Time (Approx)</label>
                <input type="text" value={leadTimeApprox} onChange={(e) => setLeadTimeApprox(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="E.g., 2 Weeks"/>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white border border-border shadow-sm rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm text-primary-900 uppercase tracking-widest">Line Items</h3>
              <button onClick={handleAddItem} className="flex items-center gap-1 text-primary-600 hover:text-primary-900 font-bold text-xs bg-primary-100/50 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-xl bg-section-bg/20 relative group">
                  <div className="flex justify-between gap-4 mb-3">
                    <span className="font-bold text-xs text-primary-900 bg-primary-100/50 px-2.5 py-1 rounded-md h-fit">#{item.sr_no}</span>
                    <button onClick={() => handleRemoveItem(index)} className="text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Item Description</label>
                      <input type="text" value={item.item_description} onChange={(e) => updateItem(index, 'item_description', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="E.g. CNC Milling for Aluminum Brackets" />
                    </div>
                    
                    <div className="col-span-4">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Qty</label>
                      <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(index, 'qty', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">U. Price (AED)</label>
                      <input type="number" min="0" step="0.01" value={item.u_price} onChange={(e) => updateItem(index, 'u_price', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-4 flex items-end justify-end pb-2">
                       <span className="font-bold text-sm text-primary-900 border-b border-dotted border-border pb-1">
                         Total: {item.total_amount.toFixed(2)} AED
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Global Totals */}
            <div className="mt-8 pt-6 border-t flex flex-col items-end gap-2">
              <div className="text-lg font-bold text-primary-900 flex gap-8 w-64 justify-between mt-2 pt-2">
                <span>Grand Total:</span> <span>{invoiceTotal.toFixed(2)} AED</span>
              </div>
              
              <button 
                onClick={handleSaveQuote}
                disabled={loading}
                className="mt-6 bg-primary-600 hover:bg-primary-900 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 w-full justify-center disabled:opacity-50"
              >
                {loading ? "Processing..." : "Save and View Quote PDF"} 
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
