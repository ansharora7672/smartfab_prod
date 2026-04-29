"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface InvoiceItem {
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

const emptyItem = (sr_no: number): InvoiceItem => ({
  sr_no,
  description_of_service: "",
  quantity: 1,
  per: "pcs",
  rate_excl_vat: 0,
  rate_incl_vat: 0,
  discount_aed: 0,
  vat_percentage: 5,
  amount: 0,
  total_incl_vat: 0,
});

export default function NewInvoicePage() {
  const router = useRouter();
  const params = useSearchParams();
  const ticket_id = params.get("ticket_id") as string;
  const quote_id = params.get("quote_id") as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-populated from order
  const [companyName, setCompanyName] = useState("");
  const [lpoNo, setLpoNo] = useState("");
  const [quoteNo, setQuoteNo] = useState("");

  // Meta fields
  const [deliveryNote, setDeliveryNote] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [supplierRef, setSupplierRef] = useState("");
  const [otherRefs, setOtherRefs] = useState("");
  const [buyersOrderNo, setBuyersOrderNo] = useState("");
  const [buyersOrderDated, setBuyersOrderDated] = useState("");
  const [despatchDocNo, setDespatchDocNo] = useState("");
  const [deliveryNoteDate, setDeliveryNoteDate] = useState("");
  const [despatchedThrough, setDespatchedThrough] = useState("");
  const [destination, setDestination] = useState("");
  const [termsOfDelivery, setTermsOfDelivery] = useState("");
  const [amountWords, setAmountWords] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([emptyItem(1)]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    const load = async () => {
      if (!ticket_id || !quote_id) { setLoading(false); return; }
      try {
        const [ticketRes, ordersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/${ticket_id}`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/active`, { credentials: "include" }),
        ]);
        if (ticketRes.ok) {
          const t = await ticketRes.json();
          setCompanyName(t.company_name || "");
          if (t.lpo_number) { setLpoNo(t.lpo_number); setBuyersOrderNo(t.lpo_number); }
        }
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          const order = orders.find((o: any) => o.quote.id === quote_id);
          if (order) {
            setQuoteNo(order.quote.quote_no);
            // Pre-fill items from quote
            if (order.quote.items?.length) {
              setItems(order.quote.items.map((qi: any, idx: number) => ({
                ...emptyItem(idx + 1),
                description_of_service: qi.item_description,
                quantity: qi.qty,
                rate_excl_vat: qi.u_price,
                rate_incl_vat: +(qi.u_price * 1.05).toFixed(2),
                vat_percentage: 5,
                amount: qi.total_amount,
                total_incl_vat: +(qi.total_amount * 1.05).toFixed(2),
              })));
            }
            // Auto-populate from latest delivery note
            if (order.delivery_notes?.length) {
              const latest = order.delivery_notes[order.delivery_notes.length - 1];
              setDeliveryNote(latest.note_no || "");
              if (latest.note_date) {
                const d = new Date(latest.note_date);
                setDeliveryNoteDate(`${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`);
              }
              if (latest.address) setDestination(latest.address);
            }
          }
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticket_id, quote_id]);

  const recalcItem = (item: InvoiceItem): InvoiceItem => {
    const amount = item.rate_excl_vat * item.quantity - item.discount_aed;
    const vat = (amount * item.vat_percentage) / 100;
    const total_incl_vat = +(amount + vat).toFixed(2);
    const rate_incl_vat = +(item.rate_excl_vat * (1 + item.vat_percentage / 100)).toFixed(2);
    return { ...item, amount: +amount.toFixed(2), total_incl_vat, rate_incl_vat };
  };

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: typeof val === "string" ? (isNaN(+val) ? val : +val) : val };
      updated[idx] = recalcItem(item as InvoiceItem);
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem(prev.length + 1)]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sr_no: i + 1 })));

  const taxableValue = +items.reduce((s, i) => s + i.amount, 0).toFixed(2);
  const vatTotal = +items.reduce((s, i) => s + (i.amount * i.vat_percentage / 100), 0).toFixed(2);
  const invoiceTotal = +(taxableValue + vatTotal).toFixed(2);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ticket_id, quote_id,
        delivery_note: deliveryNote,
        payment_terms: paymentTerms,
        supplier_reference: supplierRef,
        other_references: otherRefs,
        buyers_order_no: buyersOrderNo,
        buyers_order_dated: buyersOrderDated,
        despatch_doc_no: despatchDocNo,
        delivery_note_date: deliveryNoteDate,
        despatched_through: despatchedThrough,
        destination,
        terms_of_delivery: termsOfDelivery,
        amount_chargeable_words: amountWords,
        taxable_value: taxableValue,
        vat_total: vatTotal,
        invoice_total: invoiceTotal,
        items,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/invoices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Error ${res.status}`);
      }
      const data = await res.json();
      setFeedback({ type: "success", message: `${data.invoice_no} created!` });
      setTimeout(() => router.push(`/dashboard/invoices/${data.id}`), 1200);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full p-2 bg-section-bg/50 border rounded-lg text-sm focus:border-primary-600 outline-none";
  const labelCls = "block text-xs font-semibold text-text-secondary mb-1.5";

  if (loading) return <div className="p-8 text-muted animate-pulse">Loading order data...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto pb-20">
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border text-sm font-medium shadow-lg
          ${feedback.type === "success" ? "bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]/20 text-[#DC2626]"}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/active-orders" className="p-2 border rounded-lg hover:bg-section-bg/50 text-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-900 font-heading">Commercial Invoice Builder</h1>
          <p className="text-muted text-sm">{companyName}{quoteNo ? ` · Quote ${quoteNo}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Meta fields */}
        <div className="lg:col-span-1 space-y-5">
          <div className="p-6 bg-white border border-border rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-primary-900 uppercase tracking-widest">Invoice Header</h3>
            {[
              ["Delivery Note Ref", deliveryNote, setDeliveryNote, "E.g. DN-SFL-..."],
              ["Mode / Terms of Payment", paymentTerms, setPaymentTerms, "E.g. 50% advance..."],
              ["Supplier's Ref.", supplierRef, setSupplierRef, "Quote no."],
              ["Other Reference(s)", otherRefs, setOtherRefs, "Optional"],
              ["Buyer's Order No. (LPO)", buyersOrderNo, setBuyersOrderNo, lpoNo || "LPO number"],
              ["Buyer's Order Dated", buyersOrderDated, setBuyersOrderDated, "DD/MM/YYYY"],
              ["Despatch Document No.", despatchDocNo, setDespatchDocNo, "Optional"],
              ["Delivery Note Date", deliveryNoteDate, setDeliveryNoteDate, "DD/MM/YYYY"],
              ["Despatched Through", despatchedThrough, setDespatchedThrough, "E.g. Our vehicle"],
              ["Destination", destination, setDestination, "E.g. Ajman Industrial"],
              ["Terms of Delivery", termsOfDelivery, setTermsOfDelivery, "E.g. Ex-Works"],
            ].map(([label, val, setter, placeholder]) => (
              <div key={label as string}>
                <label className={labelCls}>{label as string}</label>
                <input type="text" value={val as string} onChange={(e) => (setter as any)(e.target.value)}
                  className={inputCls} placeholder={placeholder as string} />
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border border-border rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-primary-900 uppercase tracking-widest">Totals</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Taxable Value</span><span className="font-semibold">{taxableValue.toFixed(2)} AED</span></div>
              <div className="flex justify-between"><span className="text-muted">VAT Total</span><span className="font-semibold">{vatTotal.toFixed(2)} AED</span></div>
              <div className="flex justify-between border-t pt-2 text-primary-900 font-bold text-base"><span>Invoice Total</span><span>{invoiceTotal.toFixed(2)} AED</span></div>
            </div>
            <div>
              <label className={labelCls}>Amount Chargeable (in words)</label>
              <input type="text" value={amountWords} onChange={(e) => setAmountWords(e.target.value)}
                className={inputCls} placeholder="E.g. AED Five Hundred Only" />
            </div>
          </div>
        </div>

        {/* Right — Line Items */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-white border border-border rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xs text-primary-900 uppercase tracking-widest">Line Items</h3>
              <button onClick={addItem} className="flex items-center gap-1 text-primary-600 hover:text-primary-900 font-bold text-xs bg-primary-100/50 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-section-bg/20 relative group">
                  <div className="flex justify-between gap-4 mb-3">
                    <span className="font-bold text-xs text-primary-900 bg-primary-100/50 px-2.5 py-1 rounded-md">#{item.sr_no}</span>
                    <button onClick={() => removeItem(idx)} className="text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Description of Service</label>
                      <input type="text" value={item.description_of_service}
                        onChange={(e) => updateItem(idx, "description_of_service", e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm" placeholder="E.g. CNC Milling — Aluminium Brackets" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Qty</label>
                      <input type="number" min="1" value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Per</label>
                      <input type="text" value={item.per}
                        onChange={(e) => updateItem(idx, "per", e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Rate (excl. VAT)</label>
                      <input type="number" min="0" step="0.01" value={item.rate_excl_vat}
                        onChange={(e) => updateItem(idx, "rate_excl_vat", e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">VAT %</label>
                      <input type="number" min="0" step="0.1" value={item.vat_percentage}
                        onChange={(e) => updateItem(idx, "vat_percentage", e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Disc. Amount (AED)</label>
                      <input type="number" min="0" step="0.01" value={item.discount_aed}
                        onChange={(e) => updateItem(idx, "discount_aed", e.target.value)}
                        className="w-full p-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-4 flex items-end justify-end pb-1">
                      <div className="text-right">
                        <p className="text-[10px] text-muted">Amount: {item.amount.toFixed(2)}</p>
                        <p className="font-bold text-sm text-primary-900">Total: {item.total_incl_vat.toFixed(2)} AED</p>
                      </div>
                    </div>
                    <div className="col-span-4 flex items-end pb-1">
                      <div>
                        <p className="text-[10px] text-muted">Rate (incl. VAT)</p>
                        <p className="font-semibold text-sm">{item.rate_incl_vat.toFixed(2)} AED</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="w-full bg-primary-600 hover:bg-primary-900 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 justify-center disabled:opacity-50"
              >
                {saving ? "Creating..." : "Save & View Invoice PDF"}
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
