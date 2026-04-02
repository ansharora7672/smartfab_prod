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
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


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
