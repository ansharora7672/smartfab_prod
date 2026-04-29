# =============================================================================
# PDF GENERATOR — Commercial Invoice (Playwright / Headless Chrome)
# =============================================================================
# This module generates a pixel-perfect PDF of the commercial invoice using
# Playwright's headless Chromium browser.
#
# WHY PLAYWRIGHT INSTEAD OF xhtml2pdf?
#   - xhtml2pdf uses a basic HTML parser with limited CSS support
#   - Playwright uses an ACTUAL Chrome browser — same engine as your desktop
#   - Result: the email PDF looks IDENTICAL to the dashboard "Print" PDF
#
# HOW IT WORKS:
#   1. We build an HTML string with inline CSS (the commercial invoice)
#   2. Playwright opens a headless Chrome tab
#   3. We inject the HTML into the tab with page.set_content()
#   4. We call page.pdf() to export — Chrome renders it beautifully
#   5. Return the raw PDF bytes
#
# WHY set_content() INSTEAD OF NAVIGATING TO A URL?
#   - No authentication needed (we don't hit the frontend server)
#   - No network required (everything is self-contained)
#   - Faster — no HTTP round-trip
# =============================================================================

import os
import base64
from playwright.sync_api import sync_playwright
from datetime import datetime


# ---------------------------------------------------------------------------
# Load the company logo at import time and convert to base64
# Base64 embeds the image directly in the HTML — no file path needed at render
# ---------------------------------------------------------------------------
_PUBLIC_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "frontend", "public"
))

def _load_base64(filename: str) -> str:
    path = os.path.join(_PUBLIC_DIR, filename)
    try:
        with open(path, "rb") as f:
            ext = filename.rsplit(".", 1)[-1].lower()
            mime = "image/png" if ext == "png" else "image/jpeg"
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode()}"
    except FileNotFoundError:
        print(f"  [PDF WARNING] Asset not found: {path}")
        return ""

LOGO_BASE64 = _load_base64("SmartFab_FinalLogo_version.png")
SIGNATURE_BASE64 = _load_base64("signature.png")


def generate_quote_pdf(quote_data: dict, ticket_data: dict) -> bytes:
    """
    Generates a professional Commercial Invoice PDF using headless Chrome.
    
    Args:
        quote_data: Dict with all quote fields
        ticket_data: Dict with customer fields
    
    Returns:
        Raw PDF bytes (ready to attach to email)
    """
    
    invoice_no = quote_data.get("invoice_no", "")
    created_at = quote_data.get("created_at", "")
    
    try:
        created_date = datetime.fromisoformat(created_at).strftime("%d/%m/%Y")
    except:
        created_date = datetime.now().strftime("%d/%m/%Y")
    
    # Build items rows
    items_html = ""
    for item in quote_data.get("items", []):
        items_html += f"""
        <div class="row">
            <div class="col" style="width:5%">{item.get('sr_no', '')}</div>
            <div class="col" style="width:31%; text-align:left; font-weight:600; padding-left:6px">{item.get('description_of_service', '')}</div>
            <div class="col" style="width:6%">{item.get('quantity', '')}</div>
            <div class="col" style="width:10%">{item.get('rate_excl_vat', 0):.2f}</div>
            <div class="col" style="width:10%">{item.get('rate_incl_vat', 0):.2f}</div>
            <div class="col" style="width:5%">{item.get('per', 'pcs')}</div>
            <div class="col" style="width:9%">{item.get('discount_aed', 0):.2f}</div>
            <div class="col" style="width:5%">{item.get('vat_percentage', 5)}%</div>
            <div class="col" style="width:9%">{item.get('amount', 0):.2f}</div>
            <div class="col" style="width:10%; font-weight:700">{item.get('total_incl_vat', 0):.2f}</div>
        </div>
        """
    
    customer_name = ticket_data.get("customer_name", "")
    company_name = ticket_data.get("company_name", "")
    company_address = ticket_data.get("company_address", "")
    phone_number = ticket_data.get("phone_number", "")
    
    taxable_value = quote_data.get("taxable_value", 0)
    vat_total = quote_data.get("vat_total", 0)
    invoice_total = quote_data.get("invoice_total", 0)

    # -------------------------------------------------------------------------
    # The HTML template below is the SAME layout as the frontend PDF view
    # (frontend/src/app/dashboard/quotes/[id]/pdf/page.tsx)
    # but written as standalone HTML with inline CSS.
    # Since Chrome renders this, it looks IDENTICAL to the dashboard version.
    # -------------------------------------------------------------------------
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: A4;
                margin: 0;
            }}
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: Helvetica, Arial, sans-serif;
                color: #000;
                width: 210mm;
                height: 297mm;
                padding: 6mm;
                display: flex;
                flex-direction: column;
            }}
            
            /* Page title */
            h1 {{
                text-align: center;
                font-size: 20px;
                letter-spacing: 8px;
                text-transform: uppercase;
                font-weight: 900;
                margin-bottom: 6px;
            }}
            
            /* Grid helpers */
            .header-grid {{
                display: flex;
                border: 1px solid #000;
                margin-bottom: 5px;
            }}
            .header-left {{
                width: 50%;
                border-right: 1px solid #000;
                padding: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
            }}
            .header-right {{
                width: 50%;
                display: flex;
                flex-direction: column;
            }}
            .meta-row {{
                display: flex;
                border-bottom: 1px solid #000;
            }}
            .meta-row:last-child {{
                border-bottom: none;
            }}
            .meta-cell {{
                width: 50%;
                padding: 4px 6px;
                min-height: 34px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }}
            .meta-cell:first-child {{
                border-right: 1px solid #000;
            }}
            .meta-label {{
                font-size: 7px;
                color: #666;
                margin-bottom: 1px;
            }}
            .meta-value {{
                font-size: 9px;
                font-weight: 600;
            }}
            
            /* Buyer + Terms */
            .buyer-grid {{
                display: flex;
                gap: 5px;
                margin-bottom: 5px;
            }}
            .buyer-box, .terms-box {{
                width: 50%;
                border: 1px solid #000;
                padding: 6px 8px;
                min-height: 80px;
            }}
            
            /* Items table */
            .items-table {{
                border: 1px solid #000;
                flex: 1;
                display: flex;
                flex-direction: column;
                margin-bottom: 5px;
                position: relative;
                overflow: hidden;
            }}
            .items-header {{
                display: flex;
                background: #f5f5f5;
                border-bottom: 1px solid #000;
                font-size: 7px;
                font-weight: 700;
                text-align: center;
            }}
            .items-header .col {{
                padding: 6px 2px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid #000;
            }}
            .items-header .col:last-child {{
                border-right: none;
            }}
            .items-body {{
                flex: 1;
                position: relative;
            }}
            /* Vertical grid lines */
            .grid-lines {{
                position: absolute;
                inset: 0;
                display: flex;
                pointer-events: none;
            }}
            .grid-lines div {{
                height: 100%;
                border-right: 1px solid #000;
            }}
            .row {{
                display: flex;
                font-size: 9px;
                text-align: center;
                position: relative;
                z-index: 1;
            }}
            .row .col {{
                padding: 5px 2px;
            }}
            
            /* Watermark */
            .watermark {{
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.08;
                pointer-events: none;
                z-index: 0;
            }}
            
            /* Footer totals */
            .footer-grid {{
                display: flex;
                border: 1px solid #000;
                margin-bottom: 5px;
                height: 88px;
            }}
            .footer-left {{
                width: 65%;
                border-right: 1px solid #000;
                padding: 6px 8px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }}
            .footer-right {{
                width: 35%;
                display: flex;
                flex-direction: column;
            }}
            .total-row {{
                display: flex;
                justify-content: space-between;
                padding: 3px 6px;
                font-size: 9px;
                border-bottom: 1px solid #000;
            }}
            .total-row.grand {{
                border-bottom: none;
                background: #f5f5f5;
                flex: 1;
                align-items: center;
                padding: 4px 8px;
            }}
            
            /* Signature */
            .sig-grid {{
                display: flex;
                border: 1px solid #000;
                height: 80px;
            }}
            .sig-left {{
                width: 65%;
                border-right: 1px solid #000;
                padding: 6px 8px;
            }}
            .sig-right {{
                width: 35%;
                padding: 6px 8px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }}
        </style>
    </head>
    <body>
        <h1>Commercial Invoice</h1>
        
        <!-- HEADER -->
        <div class="header-grid">
            <div class="header-left">
                <img src="{LOGO_BASE64}" width="110" height="110" style="object-fit:contain" />
                <div>
                    <div style="font-size:20px; font-weight:900; color:#1E3A8A; margin-bottom:4px">SmartFab Lathe</div>
                    <div style="font-size:9px; line-height:1.6; color:#333">
                        Industrial 2, Ajman<br/>
                        United Arab Emirates<br/>
                        Tel : +971 542133637, +971 553610905<br/>
                        TRN : 105326755300003<br/>
                        E-mail : lathe.smartfab@gmail.com
                    </div>
                </div>
            </div>
            <div class="header-right">
                <div class="meta-row">
                    <div class="meta-cell"><span class="meta-label">Invoice No.</span><span class="meta-value">{invoice_no}</span></div>
                    <div class="meta-cell"><span class="meta-label">Dated</span><span class="meta-value">{created_date}</span></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell"><span class="meta-label">Delivery Note</span><span class="meta-value">{quote_data.get('delivery_note', '')}</span></div>
                    <div class="meta-cell"><span class="meta-label">Mode/Terms of Payment</span><span class="meta-value">{quote_data.get('payment_terms', '')}</span></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell"><span class="meta-label">Supplier's Ref.</span><span class="meta-value">{quote_data.get('supplier_reference', '')}</span></div>
                    <div class="meta-cell"><span class="meta-label">Other Reference(s)</span><span class="meta-value">{quote_data.get('other_references', 'N/A')}</span></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell"><span class="meta-label">Buyer's Order No. (LPO)</span><span class="meta-value">TBD</span></div>
                    <div class="meta-cell"><span class="meta-label">Dated</span><span class="meta-value">TBD</span></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell"><span class="meta-label">Despatch Document No.</span><span class="meta-value">&nbsp;</span></div>
                    <div class="meta-cell"><span class="meta-label">Delivery Note Date</span><span class="meta-value">{created_date}</span></div>
                </div>
                <div class="meta-row">
                    <div class="meta-cell"><span class="meta-label">Despatched through</span><span class="meta-value">{quote_data.get('despatched_through', '')}</span></div>
                    <div class="meta-cell"><span class="meta-label">Destination</span><span class="meta-value">{quote_data.get('destination', '')}</span></div>
                </div>
            </div>
        </div>
        
        <!-- BUYER + TERMS -->
        <div class="buyer-grid">
            <div class="buyer-box">
                <div style="font-weight:700; font-size:8px; margin-bottom:3px">Buyer</div>
                <div style="font-weight:700; font-size:11px; margin-bottom:3px">{company_name}</div>
                <div style="font-size:9px; line-height:1.5">
                    Attn: {customer_name}<br/>
                    {company_address}<br/>
                    Tel: {phone_number}
                </div>
            </div>
            <div class="terms-box">
                <div style="font-size:7px; color:#666; margin-bottom:3px">Terms of Delivery</div>
                <div style="font-size:9px; font-weight:600">{quote_data.get('terms_of_delivery', 'Standard terms apply.')}</div>
            </div>
        </div>
        
        <!-- ITEMS TABLE -->
        <div class="items-table">
            <div class="items-header">
                <div class="col" style="width:5%">Sr<br/>No</div>
                <div class="col" style="width:31%">Description of Service</div>
                <div class="col" style="width:6%">Quantity</div>
                <div class="col" style="width:10%">Rate</div>
                <div class="col" style="width:10%">Rate<br/>(Incl.VAT)</div>
                <div class="col" style="width:5%">per</div>
                <div class="col" style="width:9%">Disc.<br/>Amount(AED)</div>
                <div class="col" style="width:5%">VAT<br/>%</div>
                <div class="col" style="width:9%">Amount</div>
                <div class="col" style="width:10%">Total<br/>Incl.VAT(AED)</div>
            </div>
            <div class="items-body">
                <div class="watermark">
                    <img src="{LOGO_BASE64}" width="450" height="450" style="object-fit:contain" />
                </div>
                <div class="grid-lines">
                    <div style="width:5%"></div>
                    <div style="width:31%"></div>
                    <div style="width:6%"></div>
                    <div style="width:10%"></div>
                    <div style="width:10%"></div>
                    <div style="width:5%"></div>
                    <div style="width:9%"></div>
                    <div style="width:5%"></div>
                    <div style="width:9%"></div>
                </div>
                {items_html}
            </div>
        </div>
        
        <!-- FOOTER TOTALS -->
        <div class="footer-grid">
            <div class="footer-left">
                <div>
                    <div style="font-size:9px; font-weight:700; margin-bottom:3px">Amount Chargeable (in words)</div>
                    <div style="font-size:10px; font-weight:600; font-style:italic; border-bottom:1px dotted #000; display:inline-block; min-width:80%; padding-bottom:2px">
                        {quote_data.get('amount_chargeable_words', '')}
                    </div>
                </div>
                <div style="font-size:7px; line-height:1.4">
                    <span style="font-weight:700">Declaration</span><br/>
                    We declare that this invoice shows the actual price of the goods
                    described and that all particulars are true and correct.
                </div>
            </div>
            <div class="footer-right">
                <div class="total-row"><span>Taxable Value</span><span>{taxable_value:.2f}</span></div>
                <div class="total-row"><span>Value Added Tax</span><span>{vat_total:.2f}</span></div>
                <div class="total-row grand">
                    <span style="font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:1px">Invoice Total</span>
                    <span style="font-weight:700; font-size:13px">AED {invoice_total:.2f}</span>
                </div>
            </div>
        </div>
        
        <!-- SIGNATURE -->
        <div class="sig-grid">
            <div class="sig-right" style="width:100%; border-left:none">
                <div style="font-size:9px; font-weight:700">For SmartFab Lathe</div>
                {"<img src='" + SIGNATURE_BASE64 + "' style='height:40px;object-fit:contain;mix-blend-mode:multiply;margin-top:4px' />" if SIGNATURE_BASE64 else ""}
                <div style="font-size:7px; color:#666; text-align:right">Authorised Signatory</div>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        # Launch headless Chrome, render the HTML, export as PDF
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # set_content injects the HTML directly — no URL navigation needed
            page.set_content(html, wait_until="networkidle")
            
            # page.pdf() uses Chrome's built-in PDF printer
            # print_background=True ensures background colors render (like the gray rows)
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            
            browser.close()
        
        print(f"  [PDF] Generated {len(pdf_bytes)} bytes for {quote_data.get('invoice_no', 'unknown')}")
        return pdf_bytes

    except Exception as e:
        print(f"  [PDF ERROR] Playwright PDF generation failed: {e}")
        return b""


def _run_playwright(html: str, label: str) -> bytes:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(html, wait_until="networkidle")
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
            )
            browser.close()
        print(f"  [PDF] Generated {len(pdf_bytes)} bytes for {label}")
        return pdf_bytes
    except Exception as e:
        print(f"  [PDF ERROR] {label}: {e}")
        return b""


def generate_delivery_note_pdf(note_data: dict) -> bytes:
    note_no = note_data.get("note_no", "")
    company = note_data.get("company_name", "")
    address = note_data.get("address", "")
    phone = note_data.get("phone_number", "")
    note_date = note_data.get("note_date", "")
    order_no = note_data.get("order_no", "")
    lpo_no = note_data.get("lpo_no", "")
    items = note_data.get("items", [])

    rows_html = ""
    for item in items:
        rows_html += f"""
        <div class="row">
            <div class="col sr">{item.get('sr_no','')}</div>
            <div class="col desc">{item.get('item_description','')}</div>
            <div class="col qty">{item.get('qty','')}</div>
            <div class="col remark">{item.get('remark','')}</div>
        </div>"""

    blank = max(0, 10 - len(items))
    for _ in range(blank):
        rows_html += """
        <div class="row">
            <div class="col sr"></div><div class="col desc"></div>
            <div class="col qty"></div><div class="col remark"></div>
        </div>"""

    sig_img = f'<img src="{SIGNATURE_BASE64}" style="height:38px;object-fit:contain;mix-blend-mode:multiply" />' if SIGNATURE_BASE64 else ""

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
        @page {{size:A4;margin:0}}
        * {{margin:0;padding:0;box-sizing:border-box}}
        body {{font-family:Helvetica,Arial,sans-serif;color:#000;width:210mm;height:297mm;padding:8mm 10mm;display:flex;flex-direction:column}}
        h1 {{text-align:center;font-size:22px;letter-spacing:6px;font-weight:900;margin-bottom:4px}}
        .header {{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}}
        .brand {{flex:1;text-align:center}}
        .brand-name {{color:#1E3A8A;font-size:32px;font-weight:900;letter-spacing:2px}}
        .brand-sub {{color:#1E3A8A;font-size:14px;font-weight:800;letter-spacing:8px}}
        .brand-tag {{color:#1E3A8A;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px}}
        .contacts {{font-size:8.5px;font-weight:600;line-height:1.8;text-align:left;width:155px}}
        .sep {{border-top:2.5px solid #000;margin-bottom:10px}}
        .title {{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:10px}}
        .title-line {{flex:1;height:1.5px;background:#000}}
        .title-text {{font-size:18px;font-weight:900;letter-spacing:8px;text-transform:uppercase}}
        .fields {{margin-bottom:10px;font-size:10px;font-weight:700;text-transform:uppercase}}
        .field-row {{display:flex;align-items:flex-end;gap:8px;margin-bottom:14px}}
        .field-label {{white-space:nowrap;letter-spacing:2px}}
        .field-val {{flex:1;border-bottom:1.5px solid #000;padding-bottom:2px;padding-left:6px;font-weight:700;letter-spacing:0}}
        .field-half {{display:flex;flex:1;align-items:flex-end;gap:8px}}
        .table {{border:2px solid #000;flex:1;display:flex;flex-direction:column;margin-bottom:10px}}
        .thead {{display:flex;border-bottom:2px solid #000;font-size:9px;font-weight:900;text-align:center;text-transform:uppercase}}
        .tbody {{flex:1;display:flex;flex-direction:column}}
        .col {{border-right:2px solid #000;padding:6px 4px;display:flex;align-items:center;justify-content:center}}
        .col:last-child {{border-right:none}}
        .col.sr {{width:10%}}
        .col.desc {{width:55%;justify-content:flex-start;padding-left:8px}}
        .col.qty {{width:12%}}
        .col.remark {{width:23%;justify-content:flex-start;padding-left:8px}}
        .row {{display:flex;font-size:9px;border-bottom:1px solid rgba(0,0,0,0.25)}}
        .row .col {{border-right:1px solid rgba(0,0,0,0.25)}}
        .row .col:last-child {{border-right:none}}
        .sig-box {{border:1px solid #000;padding:12px 16px}}
        .sig-label {{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:2px}}
        .sig-line {{border-bottom:1.5px solid #000;width:200px;margin-top:8px}}
    </style></head><body>
    <div class="header">
        <img src="{LOGO_BASE64}" style="width:90px;height:90px;object-fit:contain" />
        <div class="brand">
            <div class="brand-name">SMARTFAB</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:2px 0">
                <div style="height:2px;width:40px;background:#1E3A8A"></div>
                <div class="brand-sub">LATHE</div>
                <div style="height:2px;width:40px;background:#1E3A8A"></div>
            </div>
            <div class="brand-tag">Engineering Accuracy. Crafted in Metal</div>
        </div>
        <div class="contacts">
            +971 54 213 3637<br/>+971 55 361 0905<br/>lathe.smartfab@gmail.com<br/>Ajman, Dubai
        </div>
    </div>
    <div class="sep"></div>
    <div class="title">
        <div class="title-line"></div>
        <div class="title-text">Delivery Note</div>
        <div class="title-line"></div>
    </div>
    <div class="fields">
        <div class="field-row"><span class="field-label">Company :</span><span class="field-val">{company}</span></div>
        <div class="field-row"><span class="field-label">Address :</span><span class="field-val">{address}</span></div>
        <div class="field-row">
            <div class="field-half"><span class="field-label">Phone No :</span><span class="field-val">{phone}</span></div>
            <div style="width:32px"></div>
            <div class="field-half"><span class="field-label">Date :</span><span class="field-val">{note_date}</span></div>
        </div>
        <div class="field-row">
            <div class="field-half"><span class="field-label">Order No :</span><span class="field-val">{order_no}</span></div>
            <div style="width:32px"></div>
            <div class="field-half"><span class="field-label">L.P.O. No :</span><span class="field-val">{lpo_no}</span></div>
        </div>
    </div>
    <div class="table">
        <div class="thead">
            <div class="col sr">Sr.No</div>
            <div class="col desc">Item Description</div>
            <div class="col qty">Qty</div>
            <div class="col remark">Remark</div>
        </div>
        <div class="tbody">{rows_html}</div>
    </div>
    <div class="sig-box">
        <div class="sig-label">Deliver's Signature</div>
        {sig_img}
        <div class="sig-line"></div>
    </div>
    </body></html>"""

    return _run_playwright(html, note_no)


def generate_invoice_pdf(invoice_data: dict, ticket_data: dict) -> bytes:
    invoice_no = invoice_data.get("display_invoice_no") or invoice_data.get("invoice_no", "")
    dated = invoice_data.get("dated", "")
    delivery_note = invoice_data.get("delivery_note", "")
    payment_terms = invoice_data.get("payment_terms", "")
    supplier_ref = invoice_data.get("supplier_reference", "")
    other_refs = invoice_data.get("other_references", "")
    buyers_order_no = invoice_data.get("buyers_order_no", "")
    buyers_order_dated = invoice_data.get("buyers_order_dated", "")
    despatch_doc_no = invoice_data.get("despatch_doc_no", "")
    delivery_note_date = invoice_data.get("delivery_note_date", "")
    despatched_through = invoice_data.get("despatched_through", "")
    destination = invoice_data.get("destination", "")
    terms_of_delivery = invoice_data.get("terms_of_delivery", "")
    amount_words = invoice_data.get("amount_chargeable_words", "")
    taxable_value = invoice_data.get("taxable_value", 0)
    vat_total = invoice_data.get("vat_total", 0)
    invoice_total = invoice_data.get("invoice_total", 0)
    items = invoice_data.get("items", [])

    company_name = ticket_data.get("company_name", "")
    customer_name = ticket_data.get("customer_name", "")
    company_address = ticket_data.get("company_address", "")
    phone_number = ticket_data.get("phone_number", "")

    items_html = ""
    for item in items:
        items_html += f"""
        <div class="row">
            <div class="col" style="width:5%">{item.get('sr_no','')}</div>
            <div class="col" style="width:31%;text-align:left;padding-left:6px;font-weight:600">{item.get('description_of_service','')}</div>
            <div class="col" style="width:6%">{item.get('quantity','')}</div>
            <div class="col" style="width:10%">{item.get('rate_excl_vat',0):.2f}</div>
            <div class="col" style="width:10%">{item.get('rate_incl_vat',0):.2f}</div>
            <div class="col" style="width:5%">{item.get('per','pcs')}</div>
            <div class="col" style="width:9%">{item.get('discount_aed',0):.2f}</div>
            <div class="col" style="width:5%">{item.get('vat_percentage',5)}%</div>
            <div class="col" style="width:9%">{item.get('amount',0):.2f}</div>
            <div class="col" style="width:10%;font-weight:700">{item.get('total_incl_vat',0):.2f}</div>
        </div>"""

    sig_img = f'<img src="{SIGNATURE_BASE64}" style="height:38px;object-fit:contain;mix-blend-mode:multiply;margin:4px 0" />' if SIGNATURE_BASE64 else ""

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
        @page {{size:A4;margin:0}} * {{margin:0;padding:0;box-sizing:border-box}}
        body {{font-family:Helvetica,Arial,sans-serif;color:#000;width:210mm;height:297mm;padding:6mm;display:flex;flex-direction:column}}
        h1 {{text-align:center;font-size:20px;letter-spacing:8px;text-transform:uppercase;font-weight:900;margin-bottom:6px}}
        .hg {{display:flex;border:1px solid #000;margin-bottom:5px}}
        .hl {{width:50%;border-right:1px solid #000;padding:8px;display:flex;align-items:center;gap:12px}}
        .hr {{width:50%;display:flex;flex-direction:column}}
        .mr {{display:flex;border-bottom:1px solid #000}} .mr:last-child {{border-bottom:none}}
        .mc {{width:50%;padding:4px 6px;min-height:30px;display:flex;flex-direction:column;justify-content:center}}
        .mc:first-child {{border-right:1px solid #000}}
        .ml {{font-size:7px;color:#666;margin-bottom:1px}} .mv {{font-size:9px;font-weight:600}}
        .bg {{display:flex;gap:5px;margin-bottom:5px}}
        .bb,.tb {{width:50%;border:1px solid #000;padding:6px 8px;min-height:70px}}
        .it {{border:1px solid #000;flex:1;display:flex;flex-direction:column;margin-bottom:5px;position:relative;overflow:hidden}}
        .ih {{display:flex;background:#f5f5f5;border-bottom:1px solid #000;font-size:7px;font-weight:700;text-align:center}}
        .ih .col {{padding:5px 2px;display:flex;align-items:center;justify-content:center;border-right:1px solid #000}}
        .ih .col:last-child {{border-right:none}}
        .ib {{flex:1;position:relative}}
        .gl {{position:absolute;inset:0;display:flex;pointer-events:none}}
        .gl div {{height:100%;border-right:1px solid #000}}
        .row {{display:flex;font-size:9px;text-align:center;position:relative;z-index:1}}
        .row .col {{padding:5px 2px;border-right:1px solid #000}} .row .col:last-child {{border-right:none}}
        .wm {{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08;pointer-events:none;z-index:0}}
        .fg {{display:flex;border:1px solid #000;margin-bottom:5px;min-height:80px}}
        .fl {{width:65%;border-right:1px solid #000;padding:6px 8px;display:flex;flex-direction:column;justify-content:space-between}}
        .fr {{width:35%;display:flex;flex-direction:column}}
        .tr {{display:flex;justify-content:space-between;padding:3px 6px;font-size:9px;border-bottom:1px solid #000}}
        .tr.grand {{border-bottom:none;background:#f5f5f5;flex:1;align-items:center;padding:4px 8px}}
        .sg {{display:flex;justify-content:flex-end;border:1px solid #000;min-height:75px}}
        .sr {{width:45%;padding:6px 10px;display:flex;flex-direction:column;justify-content:space-between}}
    </style></head><body>
    <h1>Commercial Invoice</h1>
    <div class="hg">
        <div class="hl">
            <img src="{LOGO_BASE64}" width="100" height="100" style="object-fit:contain" />
            <div>
                <div style="font-size:18px;font-weight:900;color:#1E3A8A;margin-bottom:3px">SmartFab Lathe</div>
                <div style="font-size:8.5px;line-height:1.7;color:#333">
                    Industrial 2, Ajman<br/>United Arab Emirates<br/>
                    Tel : +971 542133637, +971 553610905<br/>
                    TRN : 105326755300003<br/>E-mail : lathe.smartfab@gmail.com
                </div>
            </div>
        </div>
        <div class="hr">
            <div class="mr"><div class="mc"><span class="ml">Invoice No.</span><span class="mv">{invoice_no}</span></div><div class="mc"><span class="ml">Dated</span><span class="mv">{dated}</span></div></div>
            <div class="mr"><div class="mc"><span class="ml">Delivery Note</span><span class="mv">{delivery_note}</span></div><div class="mc"><span class="ml">Mode/Terms of Payment</span><span class="mv">{payment_terms}</span></div></div>
            <div class="mr"><div class="mc"><span class="ml">Supplier's Ref.</span><span class="mv">{supplier_ref}</span></div><div class="mc"><span class="ml">Other Reference(s)</span><span class="mv">{other_refs}</span></div></div>
            <div class="mr"><div class="mc"><span class="ml">Buyer's Order No. (LPO)</span><span class="mv">{buyers_order_no}</span></div><div class="mc"><span class="ml">Dated</span><span class="mv">{buyers_order_dated}</span></div></div>
            <div class="mr"><div class="mc"><span class="ml">Despatch Document No.</span><span class="mv">{despatch_doc_no}</span></div><div class="mc"><span class="ml">Delivery Note Date</span><span class="mv">{delivery_note_date}</span></div></div>
            <div class="mr"><div class="mc"><span class="ml">Despatched through</span><span class="mv">{despatched_through}</span></div><div class="mc"><span class="ml">Destination</span><span class="mv">{destination}</span></div></div>
        </div>
    </div>
    <div class="bg">
        <div class="bb">
            <div style="font-weight:700;font-size:8px;margin-bottom:3px">Buyer</div>
            <div style="font-weight:700;font-size:11px;margin-bottom:2px">{company_name}</div>
            <div style="font-size:9px;line-height:1.5">Attn: {customer_name}<br/>{company_address}<br/>Tel: {phone_number}</div>
        </div>
        <div class="tb">
            <div style="font-size:7px;color:#666;margin-bottom:3px">Terms of Delivery</div>
            <div style="font-size:9px;font-weight:600">{terms_of_delivery}</div>
        </div>
    </div>
    <div class="it">
        <div class="ih">
            <div class="col" style="width:5%">Sr<br/>No</div>
            <div class="col" style="width:31%">Description of Service</div>
            <div class="col" style="width:6%">Qty</div>
            <div class="col" style="width:10%">Rate</div>
            <div class="col" style="width:10%">Rate<br/>(Incl.VAT)</div>
            <div class="col" style="width:5%">per</div>
            <div class="col" style="width:9%">Disc.<br/>Amt(AED)</div>
            <div class="col" style="width:5%">VAT<br/>%</div>
            <div class="col" style="width:9%">Amount</div>
            <div class="col" style="width:10%">Total<br/>Incl.VAT(AED)</div>
        </div>
        <div class="ib">
            <div class="wm"><img src="{LOGO_BASE64}" width="380" height="380" style="object-fit:contain" /></div>
            <div class="gl">
                <div style="width:5%"></div><div style="width:31%"></div><div style="width:6%"></div>
                <div style="width:10%"></div><div style="width:10%"></div><div style="width:5%"></div>
                <div style="width:9%"></div><div style="width:5%"></div><div style="width:9%"></div>
            </div>
            {items_html}
        </div>
    </div>
    <div class="fg">
        <div class="fl">
            <div>
                <div style="font-size:9px;font-weight:700;margin-bottom:3px">Amount Chargeable (in words)</div>
                <div style="font-size:9px;font-weight:600;font-style:italic;border-bottom:1px dotted #000;display:inline-block;min-width:80%;padding-bottom:2px">{amount_words}</div>
            </div>
            <div style="font-size:7px;line-height:1.4">
                <span style="font-weight:700">Declaration</span><br/>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </div>
        </div>
        <div class="fr">
            <div class="tr"><span>Taxable Value</span><span>{taxable_value:.2f}</span></div>
            <div class="tr"><span>Value Added Tax</span><span>{vat_total:.2f}</span></div>
            <div class="tr grand"><span style="font-weight:700;font-size:10px">Invoice Total</span><span style="font-weight:700;font-size:12px">AED {invoice_total:.2f}</span></div>
        </div>
    </div>
    <div class="sg">
        <div class="sr">
            <div style="font-size:9px;font-weight:700">For SmartFab Lathe</div>
            {sig_img}
            <div style="font-size:7px;color:#666;text-align:right">Authorised Signatory</div>
        </div>
    </div>
    </body></html>"""

    return _run_playwright(html, invoice_no)
