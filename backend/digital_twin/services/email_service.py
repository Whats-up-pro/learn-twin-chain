"""
Email service for authentication and notifications
"""
import os
import logging
from typing import Dict, Any
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending authentication and notification emails"""
    
    def __init__(self):
        # Get email configuration from environment
        mail_username = os.getenv("MAIL_USERNAME", "")
        mail_from = os.getenv("MAIL_FROM", mail_username)  # Fallback to username
        
        # Skip email service if not configured
        if not mail_username or not mail_from:
            logger.warning("Email service not configured - emails will be disabled")
            self.mail_config = None
            self.fastmail = None
            return
        
        try:
            self.mail_config = ConnectionConfig(
                MAIL_USERNAME=mail_username,
                MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
                MAIL_FROM=mail_from,
                MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
                MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
                MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "LearnTwinChain"),
                MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
                MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
                USE_CREDENTIALS=True,
                VALIDATE_CERTS=True
            )
            
            self.fastmail = FastMail(self.mail_config)
            logger.info("Email service configured successfully")
            
        except Exception as e:
            logger.error(f"Email service configuration failed: {e}")
            self.mail_config = None
            self.fastmail = None
        
        # Setup Jinja2 templates
        template_dir = Path(__file__).parent / "email_templates"
        template_dir.mkdir(exist_ok=True)
        self.jinja_env = Environment(loader=FileSystemLoader(str(template_dir)))
        
        # Create default templates if they don't exist
        self._create_default_templates()
    
    def _create_default_templates(self):
        """Create default email templates"""
        template_dir = Path(__file__).parent / "email_templates"
        
        # Email verification template
        verification_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email - LearnTwinChain</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to LearnTwinChain!</h1>
        </div>
        <div class="content">
            <p>Hello {{ name }},</p>
            <p>Thank you for registering with LearnTwinChain. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{{ verification_url }}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ verification_url }}">{{ verification_url }}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Password reset template
        reset_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - LearnTwinChain</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello {{ name }},</p>
            <p>We received a request to reset your password for your LearnTwinChain account.</p>
            <p style="text-align: center;">
                <a href="{{ reset_url }}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ reset_url }}">{{ reset_url }}</a></p>
            <div class="warning">
                <strong>Security Notice:</strong>
                <ul>
                    <li>This reset link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you use this link</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Welcome template
        welcome_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to LearnTwinChain!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to LearnTwinChain!</h1>
        </div>
        <div class="content">
            <p>Hello {{ name }},</p>
            <p>Congratulations! Your email has been verified and your account is now active.</p>
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
                <h4>🎓 Start Learning</h4>
                <p>Browse our courses and begin your personalized learning journey</p>
            </div>
            
            <div class="feature">
                <h4>🔗 Connect Your Wallet</h4>
                <p>Link your MetaMask wallet to earn NFT certificates for your achievements</p>
            </div>
            
            <div class="feature">
                <h4>👤 Build Your Digital Twin</h4>
                <p>Your learning progress and skills will be tracked in your personal digital twin</p>
            </div>
            
            <p style="text-align: center;">
                <a href="{{ dashboard_url }}" class="button">Go to Dashboard</a>
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """
        
        # Write templates to files
        templates = {
            "verification.html": verification_template,
            "password_reset.html": reset_template,
            "welcome.html": welcome_template
        }
        
        for filename, content in templates.items():
            template_path = template_dir / filename
            if not template_path.exists():
                with open(template_path, "w", encoding="utf-8") as f:
                    f.write(content.strip())
    
    async def send_verification_email(self, email: str, name: str, verification_url: str):
        """Send email verification email"""
        if not self.fastmail:
            logger.warning("Email service not configured - verification email not sent")
            return
            
        try:
            template = self.jinja_env.get_template("verification.html")
            html_content = template.render(name=name, verification_url=verification_url)
            
            message = MessageSchema(
                subject="Verify Your Email - LearnTwinChain",
                recipients=[email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Verification email sent to: {email}")
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {email}: {e}")
            raise
    
    async def send_password_reset_email(self, email: str, name: str, reset_url: str):
        """Send password reset email"""
        if not self.fastmail:
            logger.warning("Email service not configured - password reset email not sent")
            return
            
        try:
            template = self.jinja_env.get_template("password_reset.html")
            html_content = template.render(name=name, reset_url=reset_url)
            
            message = MessageSchema(
                subject="Password Reset Request - LearnTwinChain",
                recipients=[email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Password reset email sent to: {email}")
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            raise
    
    async def send_welcome_email(self, email: str, name: str, dashboard_url: str):
        """Send welcome email after email verification"""
        if not self.fastmail:
            logger.warning("Email service not configured - welcome email not sent")
            return
            
        try:
            template = self.jinja_env.get_template("welcome.html")
            html_content = template.render(name=name, dashboard_url=dashboard_url)
            
            message = MessageSchema(
                subject="Welcome to LearnTwinChain!",
                recipients=[email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Welcome email sent to: {email}")
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {email}: {e}")
            # Don't raise exception for welcome email failures
    
    async def send_notification_email(self, email: str, subject: str, template_data: Dict[str, Any]):
        """Send custom notification email"""
        if not self.fastmail:
            logger.warning("Email service not configured - notification email not sent")
            return
            
        try:
            # Basic HTML template for notifications
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{subject}</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>LearnTwinChain</h1>
                    </div>
                    <div class="content">
                        {template_data.get('body', '')}
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = MessageSchema(
                subject=subject,
                recipients=[email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Notification email sent to: {email}")
            
        except Exception as e:
            logger.error(f"Failed to send notification email to {email}: {e}")
            raise
    
    async def send_course_completion_email(self, to_email: str, user_name: str, course_title: str, certificate_title: str):
        """Send course completion notification email"""
        if not self.fastmail:
            logger.warning("Email service not configured - course completion email not sent")
            return
            
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Course Completed - LearnTwinChain</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .certificate {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border: 2px solid #10b981; text-align: center; }}
                    .button {{ display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Course Completed!</h1>
                    </div>
                    <div class="content">
                        <p>Hello {user_name},</p>
                        <p>Congratulations! You have successfully completed the course:</p>
                        <h2 style="color: #10b981;">{course_title}</h2>
                        
                        <div class="certificate">
                            <h3>🏆 Certificate Earned</h3>
                            <p><strong>{certificate_title}</strong></p>
                            <p>Your certificate has been minted as an NFT and is now part of your digital learning portfolio!</p>
                        </div>
                        
                        <p>You can view and share your certificate in your dashboard.</p>
                        
                        <p style="text-align: center;">
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/certificates" class="button">View Certificates</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = MessageSchema(
                subject=f"Course Completed: {course_title} - LearnTwinChain",
                recipients=[to_email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Course completion email sent to: {to_email}")
            
        except Exception as e:
            logger.error(f"Failed to send course completion email to {to_email}: {e}")
            raise
    
    async def send_achievement_email(self, to_email: str, user_name: str, achievement_title: str, points_earned: int = 0):
        """Send achievement notification email"""
        if not self.fastmail:
            logger.warning("Email service not configured - achievement email not sent")
            return
            
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Achievement Unlocked - LearnTwinChain</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .achievement {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border: 2px solid #f59e0b; text-align: center; }}
                    .button {{ display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏆 Achievement Unlocked!</h1>
                    </div>
                    <div class="content">
                        <p>Hello {user_name},</p>
                        <p>Great job! You've earned a new achievement:</p>
                        
                        <div class="achievement">
                            <h3>🎖️ {achievement_title}</h3>
                            {f'<p><strong>Points Earned: {points_earned}</strong></p>' if points_earned > 0 else ''}
                            <p>Keep up the excellent work!</p>
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/achievements" class="button">View Achievements</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = MessageSchema(
                subject=f"Achievement Unlocked: {achievement_title} - LearnTwinChain",
                recipients=[to_email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Achievement email sent to: {to_email}")
            
        except Exception as e:
            logger.error(f"Failed to send achievement email to {to_email}: {e}")
            raise
    
    async def send_certificate_email(self, to_email: str, user_name: str, certificate_title: str, certificate_type: str, issuer: str = "LearnTwinChain"):
        """Send certificate notification email"""
        if not self.fastmail:
            logger.warning("Email service not configured - certificate email not sent")
            return
            
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Certificate Earned - LearnTwinChain</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .certificate {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border: 2px solid #3b82f6; text-align: center; }}
                    .button {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📜 Certificate Earned!</h1>
                    </div>
                    <div class="content">
                        <p>Hello {user_name},</p>
                        <p>Congratulations! You have earned a new certificate:</p>
                        
                        <div class="certificate">
                            <h3>🎓 {certificate_title}</h3>
                            <p><strong>Type:</strong> {certificate_type.replace('_', ' ').title()}</p>
                            <p><strong>Issuer:</strong> {issuer}</p>
                            <p>Your certificate has been securely stored on the blockchain!</p>
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/certificates" class="button">View Certificates</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = MessageSchema(
                subject=f"Certificate Earned: {certificate_title} - LearnTwinChain",
                recipients=[to_email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Certificate email sent to: {to_email}")
            
        except Exception as e:
            logger.error(f"Failed to send certificate email to {to_email}: {e}")
            raise
    
    async def send_milestone_email(self, to_email: str, user_name: str, milestone_title: str, milestone_description: str):
        """Send milestone notification email"""
        if not self.fastmail:
            logger.warning("Email service not configured - milestone email not sent")
            return
            
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Learning Milestone - LearnTwinChain</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .milestone {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border: 2px solid #8b5cf6; text-align: center; }}
                    .button {{ display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 Milestone Reached!</h1>
                    </div>
                    <div class="content">
                        <p>Hello {user_name},</p>
                        <p>Amazing progress! You've reached a learning milestone:</p>
                        
                        <div class="milestone">
                            <h3>🌟 {milestone_title}</h3>
                            <p>{milestone_description}</p>
                            <p>Keep up the fantastic work!</p>
                        </div>
                        
                        <p style="text-align: center;">
                            <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/dashboard" class="button">View Progress</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 LearnTwinChain. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            message = MessageSchema(
                subject=f"Milestone Reached: {milestone_title} - LearnTwinChain",
                recipients=[to_email],
                body=html_content,
                subtype=MessageType.html
            )
            
            await self.fastmail.send_message(message)
            logger.info(f"Milestone email sent to: {to_email}")
            
        except Exception as e:
            logger.error(f"Failed to send milestone email to {to_email}: {e}")
            raise