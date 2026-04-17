# =============================================================================
# EMAIL SERVICE — Gmail SMTP
# =============================================================================
# This module sends emails using Gmail's SMTP server.
#
# HOW IT WORKS:
#   1. We connect to Gmail's mail server (smtp.gmail.com) on port 587
#   2. We "upgrade" the connection to encrypted (TLS) so the password is safe
#   3. We log in with your Gmail email + App Password (NOT your real password)
#   4. We send the email and close the connection
#
# LIBRARIES USED (all built-in Python — no pip install needed):
#   - smtplib:  The actual SMTP client that talks to Gmail's server
#   - email.mime.multipart: Builds the email "envelope" (From, To, Subject)
#   - email.mime.text: Attaches the HTML body to the envelope
#
# WHY NOT USE YOUR REAL GMAIL PASSWORD?
#   Google blocks regular passwords in code for security. "App Passwords"
#   are special 16-character passwords that ONLY allow sending emails.
#   They can't read your inbox or change your account settings.
# =============================================================================

import smtplib
import datetime as dt
from jose import jwt
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from app.services.pdf_generator import generate_quote_pdf

from app.config import settings


def _generate_quote_response_token(quote_id: str, customer_email: str) -> str:
    """
    Creates a signed JWT token that encodes the quote_id and customer email.
    When the customer clicks Approve/Reject in their email, this token
    proves it's really them — nobody can forge the URL.
    
    The token expires in 30 days (quotes don't last forever).
    """
    payload = {
        "quote_id": quote_id,
        "email": customer_email,
        "exp": dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=30)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def send_welcome_email(to_email: str, full_name: str, temp_password: str) -> bool:
    """
    Sends a welcome email to a newly created staff/admin user.
    
    Returns:
        True  — email sent successfully
        False — email failed (caller should handle this)
    """

    login_url = f"{settings.FRONTEND_URL}/dashboard/login"

    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #1E3A8A; margin: 0;">SmartFab Lathe</h1>
            <p style="font-size: 12px; color: #64748B; margin-top: 4px;">Manufacturing Operations Platform</p>
        </div>

        <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0;">
                Hi <strong>{full_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
                Your account has been created on the SmartFab Lathe platform. 
                Use the temporary password below to log in. You will be asked to change it on first login.
            </p>

            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748B; margin: 0 0 8px 0; font-weight: 600;">Temporary Password</p>
                <p style="font-size: 22px; font-family: monospace; font-weight: 700; color: #1E3A8A; margin: 0; letter-spacing: 2px;">
                    {temp_password}
                </p>
            </div>

            <div style="text-align: center;">
                <a href="{login_url}" 
                   style="display: inline-block; background: #2563EB; color: #FFFFFF; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 500;">
                    Go to Login
                </a>
            </div>
        </div>

        <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
            This is an automated message from SmartFab Lathe. Do not reply to this email.
        </p>
    </div>
    """

    try:
        # ---------------------------------------------------------------
        # BUILD THE EMAIL "ENVELOPE"
        # ---------------------------------------------------------------
        # Think of MIMEMultipart like a physical envelope:
        #   - It has a "From" address on the top-left
        #   - A "To" address in the center
        #   - A "Subject" line
        #   - The HTML body is the letter INSIDE the envelope
        # ---------------------------------------------------------------
        msg = MIMEMultipart("alternative")
        msg["From"] = f"SmartFab Lathe <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = "Welcome to SmartFab Lathe — Your Account is Ready"

        # Attach the HTML body as the email content
        # "html" tells the email client to render it as a web page, not plain text
        msg.attach(MIMEText(html_body, "html"))

        # ---------------------------------------------------------------
        # CONNECT TO GMAIL & SEND
        # ---------------------------------------------------------------
        # Port 587 = SMTP with STARTTLS (starts unencrypted, upgrades to encrypted)
        # starttls() = "Start Transport Layer Security" — encrypts the connection
        #              so your App Password travels safely over the internet
        # ---------------------------------------------------------------
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)

        print(f"  [EMAIL] Welcome email sent to {to_email}")
        return True

    except Exception as e:
        print(f"  [EMAIL ERROR] Failed to send welcome email to {to_email}: {e}")
        return False

def send_ticket_lifecycle_notification(to_email: str, notification_type: str, context: dict) -> bool:
    """
    Sends automated lifecycle emails for a Ticket to the assigned Staff Member.
    expected context = {"user": User, "ticket": Ticket}
    """
    user = context.get("user")
    ticket = context.get("ticket")
    
    if notification_type == "NEW_TICKET_ALERT":
        subject = f"New Consultation Request: {ticket.ticket_id}"
        html_body = f"""
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
            <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px;">
                <p>Hi <strong>{user.full_name}</strong>,</p>
                <p>A new customer has just requested a quote and scheduled a consultation.</p>
                <p><strong>Ticket ID:</strong> {ticket.ticket_id}</p>
                <p><strong>Customer:</strong> {ticket.customer_name} ({ticket.company_name})</p>
                <p><strong>Scheduled For:</strong> {ticket.consultation_date} at {ticket.consultation_time}</p>
                <p>Please log in to the portal to claim this ticket if you are available.</p>
            </div>
        </div>
        """
        
    elif notification_type == "ASSIGNED":
        subject = f"New Consultation Assigned: {ticket.ticket_id}"
        html_body = f"""
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
            <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px;">
                <p>Hi <strong>{user.full_name}</strong>,</p>
                <p>You have been automatically assigned to handle an upcoming consultation call.</p>
                <p><strong>Ticket ID:</strong> {ticket.ticket_id}</p>
                <p><strong>Customer:</strong> {ticket.customer_name} ({ticket.company_name})</p>
                <p><strong>Scheduled For:</strong> {ticket.consultation_date} at {ticket.consultation_time}</p>
            </div>
        </div>
        """
        
    elif notification_type == "UPCOMING_REMINDER":
        subject = f"Reminder: Upcoming Consultation {ticket.ticket_id} in 1 Hour!"
        html_body = f"""
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
            <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px;">
                <p>Hi <strong>{user.full_name}</strong>,</p>
                <p>Friendly reminder that your consultation call for <strong>{ticket.ticket_id}</strong> is coming up in approximately 1 hour.</p>
                <p><strong>Customer:</strong> {ticket.customer_name} ({ticket.company_name})</p>
                <p><strong>Phone:</strong> {ticket.phone_number}</p>
            </div>
        </div>
        """
        
    elif notification_type == "CALL_COMPLETED_PROMPT":
        subject = f"Action Required: Complete Consultation {ticket.ticket_id}"
        html_body = f"""
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
            <div style="background: #FEF3C7; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px;">
                <p>Hi <strong>{user.full_name}</strong>,</p>
                <p>The scheduled time for ticket <strong>{ticket.ticket_id}</strong> has passed.</p>
                <p>After your call concludes, please log into the dashboard and safely click <strong>Mark Call Completed</strong> so we can begin Quote Preparation.</p>
            </div>
        </div>
        """
    else:
        print(f"  [EMAIL ERROR] Unknown notification type sent: {notification_type}")
        return False
        
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"SmartFab Lathe <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)

        print(f"  [EMAIL] Lifecycle notification ({notification_type}) sent to {to_email}")
        return True

    except Exception as e:
        print(f"  [EMAIL ERROR] Failed to send {notification_type} to {to_email}: {e}")
        return False


def send_quote_email(to_email: str, quote_data: dict, ticket_data: dict) -> bool:
    """
    Sends the generated quote to the customer via email.
    
    The email contains:
      - A professional summary of the quote
      - A table of all line items
      - 3 action buttons (Approve / Reject / Request Modification)
      - Each button URL contains a JWT-signed token for security
    
    Args:
        to_email: Customer's email address
        quote_data: Dict with quote fields (invoice_no, items, totals, etc.)
        ticket_data: Dict with ticket/customer fields (customer_name, company_name)
    """
    quote_id = quote_data["id"]
    invoice_no = quote_data["invoice_no"]
    
    # Generate signed token for the email action buttons
    token = _generate_quote_response_token(quote_id, to_email)
    
    # Build the base URL for response actions
    base_url = f"{settings.FRONTEND_URL}/quote-response"
    approve_url = f"{base_url}?token={token}&action=APPROVED"
    reject_url = f"{base_url}?token={token}&action=REJECTED"
    modify_url = f"{base_url}?token={token}&action=MODIFICATION_REQUESTED"
    
    # Build line items rows for the email table
    items_html = ""
    for item in quote_data.get("items", []):
        items_html += f"""
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #334155;">{item.get('sr_no', '')}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 500;">{item.get('description_of_service', '')}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #334155; text-align: center;">{item.get('quantity', '')}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #334155; text-align: right;">{item.get('rate_excl_vat', 0):.2f}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 600; text-align: right;">{item.get('total_incl_vat', 0):.2f}</td>
        </tr>
        """
    
    customer_name = ticket_data.get("customer_name", "Valued Customer")
    company_name = ticket_data.get("company_name", "")
    
    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 40px 24px; color: #0F172A; background: #FFFFFF;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #1E3A8A; margin: 0;">SmartFab Lathe</h1>
            <p style="font-size: 12px; color: #64748B; margin-top: 4px; letter-spacing: 1px;">MANUFACTURING SERVICES</p>
        </div>

        <!-- Main Card -->
        <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 8px 0;">
                Dear <strong>{customer_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for your interest in SmartFab Lathe. Please find below the quotation 
                for the manufacturing services we discussed. We look forward to working with you.
            </p>

            <!-- Quote Summary Box -->
            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B;">Invoice No.</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #0F172A; font-weight: 600; text-align: right;">{invoice_no}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B;">Company</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #0F172A; text-align: right;">{company_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #64748B;">Payment Terms</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #0F172A; text-align: right;">{quote_data.get('payment_terms', 'N/A')}</td>
                    </tr>
                </table>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #F1F5F9;">
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600; text-align: left;">#</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600; text-align: left;">Description</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600; text-align: center;">Qty</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600; text-align: right;">Rate</th>
                        <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600; text-align: right;">Total (AED)</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>

            <!-- Totals -->
            <div style="margin-top: 16px; padding: 16px 12px; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748B;">Taxable Value</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #0F172A; text-align: right;">{quote_data.get('taxable_value', 0):.2f} AED</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748B;">VAT (5%)</td>
                        <td style="padding: 4px 0; font-size: 14px; color: #0F172A; text-align: right;">{quote_data.get('vat_total', 0):.2f} AED</td>
                    </tr>
                    <tr style="border-top: 2px solid #1E3A8A;">
                        <td style="padding: 12px 0 4px 0; font-size: 15px; color: #1E3A8A; font-weight: 700;">INVOICE TOTAL</td>
                        <td style="padding: 12px 0 4px 0; font-size: 18px; color: #1E3A8A; font-weight: 700; text-align: right;">AED {quote_data.get('invoice_total', 0):.2f}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Action Buttons -->
        <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #334155; margin: 0 0 20px 0; font-weight: 500;">
                Please respond to this quote:
            </p>
            <div>
                <a href="{approve_url}" 
                   style="display: inline-block; background: #16A34A; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 0 6px 8px 6px;">
                    ✅ Approve Quote
                </a>
                <a href="{modify_url}" 
                   style="display: inline-block; background: #F59E0B; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 0 6px 8px 6px;">
                    🔄 Request Changes
                </a>
                <a href="{reject_url}" 
                   style="display: inline-block; background: #DC2626; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; margin: 0 6px 8px 6px;">
                    ❌ Decline Quote
                </a>
            </div>
        </div>

        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.6;">
            This quote is valid for 30 days from the date of issue.<br/>
            SmartFab Lathe · Industrial 2, Ajman, UAE · +971 542133637
        </p>
    </div>
    """

    try:
        # 1. Generate the actual PDF file as raw bytes
        pdf_bytes = generate_quote_pdf(quote_data, ticket_data)
        
        # 2. Build the email — use "mixed" type to support both HTML body AND file attachment
        #    "alternative" = only HTML or text (no attachments)
        #    "mixed"       = HTML body + file attachments together
        msg = MIMEMultipart("mixed")
        msg["From"] = f"SmartFab Lathe <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = f"Quote {invoice_no} — SmartFab Lathe Manufacturing Services"
        
        # Attach the HTML body (the email text the customer sees)
        msg.attach(MIMEText(html_body, "html"))
        
        # 3. Attach the PDF file
        if pdf_bytes:
            pdf_attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
            pdf_filename = f"SmartFab_Quote_{invoice_no}.pdf"
            pdf_attachment.add_header("Content-Disposition", "attachment", filename=pdf_filename)
            msg.attach(pdf_attachment)
            print(f"  [PDF] Generated {len(pdf_bytes)} bytes for {pdf_filename}")
        else:
            print(f"  [PDF WARNING] PDF generation failed for {invoice_no}, sending without attachment")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)

        print(f"  [EMAIL] Quote {invoice_no} sent to {to_email}")
        return True

    except Exception as e:
        print(f"  [EMAIL ERROR] Failed to send quote {invoice_no} to {to_email}: {e}")
        return False


# =============================================================================
# FOLLOW-UP EMAIL — Sent when customer APPROVES the quote
# =============================================================================
# This asks the customer to send their Local Purchase Order (LPO).
# The LPO is a formal document confirming they want to proceed with the order.
# =============================================================================
def send_approval_followup_email(to_email: str, customer_name: str, invoice_no: str) -> bool:
    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #1E3A8A; margin: 0;">SmartFab Lathe</h1>
            <p style="font-size: 12px; color: #64748B; margin-top: 4px;">Manufacturing Services</p>
        </div>

        <div style="background: #DCFCE7; border: 1px solid rgba(22,163,74,0.2); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
                Hi <strong>{customer_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for approving Quote <strong>{invoice_no}</strong>! We're excited to get started on your project.
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                To proceed, we need your <strong>Local Purchase Order (LPO)</strong>. Please send it to us via email at:
            </p>
            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748B; margin: 0 0 6px 0; font-weight: 600;">Send your LPO to</p>
                <a href="mailto:lathe.smartfab@gmail.com" style="font-size: 16px; font-weight: 700; color: #2563EB; text-decoration: none;">
                    lathe.smartfab@gmail.com
                </a>
            </div>
            <p style="font-size: 13px; color: #64748B; line-height: 1.6; margin: 0;">
                Once we receive your LPO, we'll begin coordinating with our vendors and start production. You'll receive updates at every stage.
            </p>
        </div>

        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.6;">
            SmartFab Lathe · Industrial 2, Ajman, UAE · +971 542133637
        </p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"SmartFab Lathe <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = f"Quote {invoice_no} Approved — Please Send Your LPO"
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)

        print(f"  [EMAIL] Approval follow-up sent to {to_email}")
        return True
    except Exception as e:
        print(f"  [EMAIL ERROR] Approval follow-up failed for {to_email}: {e}")
        return False


# =============================================================================
# FOLLOW-UP EMAIL — Sent when customer REJECTS the quote
# =============================================================================
# We want to understand what went wrong, so we ask for feedback.
# This is important for business — helps improve future quotes.
# =============================================================================
def send_rejection_followup_email(to_email: str, customer_name: str, invoice_no: str) -> bool:
    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #1E3A8A; margin: 0;">SmartFab Lathe</h1>
            <p style="font-size: 12px; color: #64748B; margin-top: 4px;">Manufacturing Services</p>
        </div>

        <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
                Hi <strong>{customer_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                We noticed you've declined Quote <strong>{invoice_no}</strong>. We completely understand — and we'd genuinely appreciate your feedback so we can improve.
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Could you take a moment to let us know what influenced your decision? Common reasons include:
            </p>
            <ul style="font-size: 13px; color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li>Pricing was too high</li>
                <li>Delivery timeline didn't work</li>
                <li>Found an alternative supplier</li>
                <li>Project was cancelled or postponed</li>
                <li>Other reason</li>
            </ul>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Simply reply to this email with your feedback. It helps us serve you better in the future.
            </p>
            <p style="font-size: 13px; color: #64748B; line-height: 1.6; margin: 0;">
                If you change your mind or would like to discuss a revised quote, we're always here to help. Just reach out!
            </p>
        </div>

        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.6;">
            SmartFab Lathe · Industrial 2, Ajman, UAE · +971 542133637
        </p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"SmartFab Lathe <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = f"We'd Love Your Feedback — Quote {invoice_no}"
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)

        print(f"  [EMAIL] Rejection follow-up sent to {to_email}")
        return True
    except Exception as e:
        print(f"  [EMAIL ERROR] Rejection follow-up failed for {to_email}: {e}")
        return False


# =============================================================================
# FOLLOW-UP EMAIL — Sent when customer REQUESTS MODIFICATIONS
# =============================================================================
# Acknowledges their request and tells them someone will call them.
# =============================================================================
def send_modification_followup_email(to_email: str, customer_name: str, invoice_no: str) -> bool:
    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #0F172A;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #1E3A8A; margin: 0;">SmartFab Lathe</h1>
            <p style="font-size: 12px; color: #64748B; margin-top: 4px;">Manufacturing Services</p>
        </div>

        <div style="background: #FEF3C7; border: 1px solid rgba(245,158,11,0.2); border-radius: 16px; padding: 32px; margin-bottom: 24px;">
            <p style="font-size: 15px; color: #334155; margin: 0 0 12px 0;">
                Hi <strong>{customer_name}</strong>,
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for your feedback on Quote <strong>{invoice_no}</strong>. We've noted your request for modifications.
            </p>
            <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <p style="font-size: 13px; color: #334155; margin: 0; line-height: 1.6;">
                    <strong>A member of our team will contact you within 24 hours</strong> to discuss the changes you'd like and prepare a revised quote.
                </p>
            </div>
            <p style="font-size: 13px; color: #64748B; line-height: 1.6; margin: 0;">
                If you'd like to reach us sooner, call us at <strong>+971 542133637</strong> or reply to this email.
            </p>
        </div>

        <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.6;">
            SmartFab Lathe · Industrial 2, Ajman, UAE · +971 542133637
        </p>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"SmartFab Lathe <{settings.SMTP_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = f"Quote {invoice_no} — Modification Request Received"
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)

        print(f"  [EMAIL] Modification follow-up sent to {to_email}")
        return True
    except Exception as e:
        print(f"  [EMAIL ERROR] Modification follow-up failed for {to_email}: {e}")
        return False
