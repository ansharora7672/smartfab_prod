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
LOGO_PATH = os.path.join(
    os.path.dirname(__file__),  # backend/app/services/
    "..", "..", "..",            # go up to project root
    "frontend", "public", "SmartFab_FinalLogo_version.png"
)
LOGO_PATH = os.path.abspath(LOGO_PATH)

try:
    with open(LOGO_PATH, "rb") as f:
        LOGO_BASE64 = f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"
    print(f"  [PDF] Logo loaded from {LOGO_PATH}")
except FileNotFoundError:
    LOGO_BASE64 = ""
    print(f"  [PDF WARNING] Logo not found at {LOGO_PATH}")


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
            <div class="sig-left">
                <div style="font-size:9px; font-weight:700">Customer's Seal and Signature</div>
            </div>
            <div class="sig-right">
                <div style="font-size:9px; font-weight:700">For SmartFab Lathe</div>
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
