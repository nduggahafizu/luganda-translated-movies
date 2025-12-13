# Pesapal Configuration for Unruly Movies

## Your Pesapal Credentials

**Consumer Key:**
```
WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
```

**Consumer Secret:**
```
qXoCe4qrb4RzDCr9nDu3y/yvTiU=
```

**API URL:**
```
https://www.pesapal.com/API
```

---

## Setup Instructions

### 1. Create .env file:
```bash
cd server
cp .env.example .env
```

### 2. Edit .env file and add these values:

```env
# Pesapal Payment Configuration (Uganda Mobile Money)
PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=
PESAPAL_API_URL=https://www.pesapal.com/API
```

### 3. Complete .env configuration:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
CLIENT_URL=https://watch.unrulymovies.com

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/unruly_movies
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/unruly_movies

# JWT Configuration
JWT_SECRET=unruly_movies_super_secret_key_2025_change_this
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=unruly_movies_refresh_secret_2025
JWT_REFRESH_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@unrulymovies.com

# Stripe Payment Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Pesapal Payment Configuration (Uganda Mobile Money)
PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=
PESAPAL_API_URL=https://www.pesapal.com/API

# File Upload Configuration
MAX_FILE_SIZE=500000000
UPLOAD_PATH=./uploads

# Video Streaming Configuration
VIDEO_CHUNK_SIZE=1048576

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=unruly_session_secret_2025

# Admin Configuration
ADMIN_EMAIL=admin@unrulymovies.com
ADMIN_PASSWORD=change_this_admin_password_immediately
```

---

## Payment Testing

### Test Mobile Money Payments:

**MTN Mobile Money:**
- Network: MTN
- Phone: 256XXXXXXXXX (your test number)
- Amount: UGX 37,000 (Basic) or UGX 55,000 (Premium)

**Airtel Money:**
- Network: AIRTEL
- Phone: 256XXXXXXXXX (your test number)
- Amount: UGX 37,000 (Basic) or UGX 55,000 (Premium)

---

## Pesapal Integration Flow

1. User selects Mobile Money payment
2. Enters phone number and network (MTN/Airtel)
3. Backend calls Pesapal API with your credentials
4. Pesapal sends payment prompt to user's phone
5. User approves payment on phone
6. Pesapal sends callback to your server
7. Backend activates subscription
8. User receives confirmation email

---

## Important Notes

⚠️ **Security:**
- Never commit .env file to git
- Keep credentials secure
- Use HTTPS in production
- Rotate secrets regularly

✅ **Production Ready:**
- Your Pesapal credentials are production keys
- Test thoroughly before going live
- Monitor transactions in Pesapal dashboard
- Set up proper error logging

📊 **Pesapal Dashboard:**
- Login: https://www.pesapal.com
- View transactions
- Download reports
- Manage settlements

---

## Quick Start

```bash
# 1. Install dependencies
cd server
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your credentials (see above)
nano .env

# 4. Start MongoDB
mongod

# 5. Start server
npm start

# Server will run on http://localhost:5000
```

---

## Testing Checklist

- [ ] MongoDB connected
- [ ] Server starts without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can access payment page
- [ ] Can select MTN Mobile Money
- [ ] Can enter phone number
- [ ] Payment initiates successfully
- [ ] Receives payment prompt on phone
- [ ] Payment completes
- [ ] Subscription activates
- [ ] Confirmation email sent

---

## Support

If you encounter issues:
1. Check server logs
2. Verify Pesapal credentials
3. Test with Pesapal sandbox first
4. Contact Pesapal support: support@pesapal.com

---

**Your Pesapal integration is ready to use!** 🎉
