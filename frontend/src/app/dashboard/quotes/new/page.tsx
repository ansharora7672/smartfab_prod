"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Save, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface QuoteItem {
  sr_no: number;
  description_of_service: string;
  quantity: number;
  per: string;
  rate_excl_vat: number;
  rate_incl_vat: number;
  discount_aed: number;
  vat_percentage: number;
  amount: number;
  total_incl_vat: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticket_id = searchParams.get("ticket_id");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Global Quote Metadata
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("100% Advance Payment");
  const [supplierReference, setSupplierReference] = useState("");
  const [otherReferences, setOtherReferences] = useState("");
  const [despatchedThrough, setDespatchedThrough] = useState("");
  const [destination, setDestination] = useState("");
  const [termsOfDelivery, setTermsOfDelivery] = useState("");

  // Items State
  const [items, setItems] = useState<QuoteItem[]>([
    {
      sr_no: 1,
      description_of_service: "",
      quantity: 1,
      per: "pcs",
      rate_excl_vat: 0,
      rate_incl_vat: 0,
      discount_aed: 0,
      vat_percentage: 5,
      amount: 0,
      total_incl_vat: 0,
    },
  ]);

  // Derived Totals
  const taxableValue = items.reduce((acc, item) => acc + item.amount, 0);
  const vatTotal = items.reduce((acc, item) => acc + (item.total_incl_vat - item.amount), 0);
  const invoiceTotal = taxableValue + vatTotal;

  // Auto-dismiss alerts
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        sr_no: items.length + 1,
        description_of_service: "",
        quantity: 1,
        per: "pcs",
        rate_excl_vat: 0,
        rate_incl_vat: 0,
        discount_aed: 0,
        vat_percentage: 5,
        amount: 0,
        total_incl_vat: 0,
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
    const item = { ...newItems[index], [field]: value };

    // Auto-calculate logic matching the SmartFab Template
    if (['quantity', 'rate_excl_vat', 'discount_aed', 'vat_percentage'].includes(field)) {
      const qty = parseFloat(item.quantity.toString()) || 0;
      const rateExcl = parseFloat(item.rate_excl_vat.toString()) || 0;
      const discount = parseFloat(item.discount_aed.toString()) || 0;
      const vatPercent = parseFloat(item.vat_percentage.toString()) || 5;

      // 1. Calculate Amount (Taxable Value) per item = (Qty * Rate) - Discount
      const grossAmount = qty * rateExcl;
      const finalAmount = grossAmount - discount;
      item.amount = Math.max(0, finalAmount);

      // 2. Calculate VAT logic per item
      const vatAmount = item.amount * (vatPercent / 100);
      item.total_incl_vat = item.amount + vatAmount;

      // 3. Update the displayed Rate Incl VAT per unit logic
      item.rate_incl_vat = rateExcl + (rateExcl * (vatPercent / 100));
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
        delivery_note: deliveryNote,
        payment_terms: paymentTerms,
        supplier_reference: supplierReference,
        other_references: otherReferences,
        despatched_through: despatchedThrough,
        destination,
        terms_of_delivery: termsOfDelivery,
        amount_chargeable_words: "", // Advanced parsing logic happens later
        taxable_value: taxableValue,
        vat_total: vatTotal,
        invoice_total: invoiceTotal,
        items
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/quotes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save quote");
      
      const newQuote = await res.json();
      
      setFeedback({ type: "success", message: "Quote saved successfully! Generating View..." });
      
      // Redirect to the newly created option B view
      setTimeout(() => {
         router.push(`/dashboard/quotes/${newQuote.id}/pdf`);
      }, 1500);

    } catch (err) {
      setFeedback({ type: "error", message: "Save failed. Check network." });
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
            <h3 className="font-bold text-sm text-primary-900 uppercase tracking-widest mb-4">Terms & Logistics</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Payment Terms</label>
                <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Delivery Note Ref</label>
                <input type="text" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="Optional..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Destination</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="E.g., Ajman, UAE" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Despatched Through</label>
                <input type="text" value={despatchedThrough} onChange={(e) => setDespatchedThrough(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="E.g., Company Driver" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Terms of Delivery</label>
                <textarea rows={3} value={termsOfDelivery} onChange={(e) => setTermsOfDelivery(e.target.value)} className="w-full p-2.5 bg-section-bg/50 border rounded-lg text-sm" placeholder="Ex works, shipping notes..." />
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
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Description of Service</label>
                      <input type="text" value={item.description_of_service} onChange={(e) => updateItem(index, 'description_of_service', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="E.g. CNC Milling for Aluminum Brackets" />
                    </div>
                    
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Qty</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Unit</label>
                      <input type="text" value={item.per} onChange={(e) => updateItem(index, 'per', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="pcs" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Rate (AED)</label>
                      <input type="number" min="0" step="0.01" value={item.rate_excl_vat} onChange={(e) => updateItem(index, 'rate_excl_vat', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Discount</label>
                      <input type="number" min="0" step="0.01" value={item.discount_aed} onChange={(e) => updateItem(index, 'discount_aed', e.target.value)} className="w-full p-2 border rounded-lg text-sm text-[red]" />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-6 text-sm">
                    <span className="text-muted text-xs">Gross: <b className="text-text-primary">{(item.quantity * item.rate_excl_vat).toFixed(2)} AED</b></span>
                    <span className="text-muted text-xs">VAT (5%): <b className="text-text-primary">{(item.amount * 0.05).toFixed(2)} AED</b></span>
                    <span className="text-primary-900 text-xs font-bold bg-primary-100/30 px-2 py-0.5 rounded">Net Total: {item.total_incl_vat.toFixed(2)} AED</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Global Totals */}
            <div className="mt-8 pt-6 border-t flex flex-col items-end gap-2">
              <div className="text-sm text-text-secondary flex gap-8 w-64 justify-between">
                <span>Taxable Value:</span> <span className="font-mono">{taxableValue.toFixed(2)} AED</span>
              </div>
              <div className="text-sm text-text-secondary flex gap-8 w-64 justify-between">
                <span>Total VAT:</span> <span className="font-mono">{vatTotal.toFixed(2)} AED</span>
              </div>
              <div className="text-lg font-bold text-primary-900 flex gap-8 w-64 justify-between mt-2 pt-2 border-t border-border">
                <span>Invoice Total:</span> <span>{invoiceTotal.toFixed(2)} AED</span>
              </div>
              
              <button 
                onClick={handleSaveQuote}
                disabled={loading}
                className="mt-6 bg-primary-600 hover:bg-primary-900 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 w-full justify-center disabled:opacity-50"
              >
                {loading ? "Processing..." : "Save and View PDF Layout"} 
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
