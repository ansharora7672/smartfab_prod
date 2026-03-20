import resend
from app.config import settings


def send_welcome_email(to_email: str, full_name: str, temp_password: str):

    resend.api_key = settings.RESEND_API_KEY

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
        resend.Emails.send({
            "from": "SmartFab Lathe <onboarding@resend.dev>",
            "to": [to_email],
            "subject": "Welcome to SmartFab Lathe — Your Account is Ready",
            "html": html_body,
        })
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send welcome email to {to_email}: {e}")
