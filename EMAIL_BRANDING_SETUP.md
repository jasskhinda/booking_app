# Custom Email Configuration for CCT

## Supabase Dashboard Configuration

### 1. SMTP Settings (Project → Settings → Authentication → SMTP Settings)

```
Enable Custom SMTP: ✅ Enabled
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP User: noreply@compassionatecaretransportation.com
SMTP Password: [Your Brevo SMTP Key]
Sender Name: Compassionate Care Transportation
Sender Email: noreply@compassionatecaretransportation.com
Minimum interval between emails: 10 seconds
```

**Brevo SMTP Details:**
- Host: `smtp-relay.brevo.com`
- Port: `587` (TLS encryption)
- Username: Your verified email address (format: xxxxxx@smtp-brevo.com)
- Password: Your Brevo SMTP API key (not your login password)
- **Rate Limit**: Set to 10 seconds (not 60) to avoid delays

### 2. Email Templates (Project → Settings → Authentication → Email Templates)

#### Confirm Signup Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #5fbfc0; margin: 0;">Compassionate Care Transportation</h1>
    <p style="color: #666; margin: 5px 0;">Professional Medical Transportation Services</p>
  </div>

  <h2 style="color: #333;">Welcome! Please Confirm Your Email</h2>
  
  <p>Thank you for signing up for our compassionate transportation services. We're committed to providing safe, reliable, and dignified transportation for all our clients.</p>
  
  <p>To complete your registration and access our booking platform, please confirm your email address:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="display: inline-block; padding: 15px 30px; background-color: #5fbfc0; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Confirm Your Email Address
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px;">{{ .ConfirmationURL }}</p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p><strong>Compassionate Care Transportation</strong></p>
    <p>🚗 Safe • Reliable • Dignified Transportation</p>
    <p>📧 Email: support@compassionatecaretransportation.com</p>
    <p>🌐 Website: <a href="https://book.compassionatecaretransportation.com" style="color: #5fbfc0;">book.compassionatecaretransportation.com</a></p>
  </div>
  
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    If you didn't create an account with us, you can safely ignore this email.
  </p>
</div>
```

#### Magic Link Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #5fbfc0; margin: 0;">Compassionate Care Transportation</h1>
    <p style="color: #666; margin: 5px 0;">Professional Medical Transportation Services</p>
  </div>

  <h2 style="color: #333;">Sign In to Your Account</h2>
  
  <p>Click the button below to securely sign in to your Compassionate Care Transportation account:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="display: inline-block; padding: 15px 30px; background-color: #5fbfc0; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Sign In to Your Account
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px;">{{ .ConfirmationURL }}</p>
  
  <p style="color: #e74c3c; font-size: 14px; background: #fdf2f2; padding: 10px; border-radius: 4px; border-left: 4px solid #e74c3c;">
    <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this sign-in link, please ignore this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p><strong>Compassionate Care Transportation</strong></p>
    <p>🚗 Safe • Reliable • Dignified Transportation</p>
    <p>📧 Email: support@compassionatecaretransportation.com</p>
    <p>🌐 Website: <a href="https://book.compassionatecaretransportation.com" style="color: #5fbfc0;">book.compassionatecaretransportation.com</a></p>
  </div>
</div>
```

#### Reset Password Template:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #5fbfc0; margin: 0;">Compassionate Care Transportation</h1>
    <p style="color: #666; margin: 5px 0;">Professional Medical Transportation Services</p>
  </div>

  <h2 style="color: #333;">Reset Your Password</h2>
  
  <p>We received a request to reset the password for your Compassionate Care Transportation account.</p>
  
  <p>Click the button below to create a new password:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="display: inline-block; padding: 15px 30px; background-color: #5fbfc0; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Reset Your Password
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px;">{{ .ConfirmationURL }}</p>
  
  <p style="color: #e74c3c; font-size: 14px; background: #fdf2f2; padding: 10px; border-radius: 4px; border-left: 4px solid #e74c3c;">
    <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
  </p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p><strong>Compassionate Care Transportation</strong></p>
    <p>🚗 Safe • Reliable • Dignified Transportation</p>
    <p>📧 Email: support@compassionatecaretransportation.com</p>
    <p>🌐 Website: <a href="https://book.compassionatecaretransportation.com" style="color: #5fbfc0;">book.compassionatecaretransportation.com</a></p>
  </div>
</div>
```

### 3. Site URL Settings (Project → Settings → Authentication → URL Configuration)

```
Site URL: https://book.compassionatecaretransportation.com
Redirect URLs: 
  - https://book.compassionatecaretransportation.com/auth/callback
  - https://book.compassionatecaretransportation.com/email-confirmed
```

### 4. Email Settings Summary

After configuration, emails will show:
- From: Compassionate Care Transportation <noreply@compassionatecaretransportation.com>
- Professional CCT branding
- Company colors (#5fbfc0)
- Clear call-to-action buttons
- Security notices
- Contact information
- Website links

### 5. Step-by-Step Configuration

#### A. Configure SMTP Settings
1. Log into Supabase Dashboard
2. Go to **Project → Settings → Authentication → SMTP Settings**
3. Enable Custom SMTP: **ON**
4. Enter the SMTP settings above
5. Click **Save**

#### B. Upload Email Templates  
1. Go to **Project → Settings → Authentication → Email Templates**
2. For each template (Confirm signup, Magic Link, Reset Password):
   - Click **Edit** 
   - Replace content with the HTML templates above
   - Click **Save**

#### C. Configure URLs
1. Go to **Project → Settings → Authentication → URL Configuration**
2. Set Site URL: `https://book.compassionatecaretransportation.com`
3. Add Redirect URLs as listed above
4. Click **Save**

### 6. Testing

After configuration:
1. Test signup flow with new email
2. Verify email sender and branding  
3. Check all email templates (signup, login, password reset)
4. Ensure all links work correctly
5. Run: `./test-email-config.sh` for guided testing

### 7. Production Checklist

✅ SMTP settings configured in Supabase  
✅ Custom email templates uploaded  
✅ Site URLs configured correctly  
✅ Domain verification completed  
✅ Test emails sent successfully  
✅ All email links work correctly  

🎉 **Professional email branding is now active!**
