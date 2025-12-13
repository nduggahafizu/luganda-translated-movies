# 🔐 PesaPal Configuration Guide

## Your PesaPal Credentials

**Consumer Key:** `WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN`  
**Consumer Secret:** `qXoCe4qrb4RzDCr9nDu3y/yvTiU=`

---

## Setup Instructions

### Step 1: Update `.env` File

Open `server/.env` file and add these lines:

```env
# PesaPal Payment Configuration
PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_IPN_URL=http://localhost:5000/api/payments/callback
```

### Step 2: Verify Configuration

Your complete `server/.env` file should now include:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_EXPIRE=30d

# Client Configuration
CLIENT_URL=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# PesaPal Payment Configuration
PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_IPN_URL=http://localhost:5000/api/payments/callback

# TMDB API (Optional - for movie search)
TMDB_API_KEY=your-tmdb-api-key-here

# Email Configuration (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lugandamovies.com
```

### Step 3: Restart Server

After updating the `.env` file, restart your server:

1. Stop the current server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd server
   node server.js
   ```

### Step 4: Test Payment Integration

Once the server is restarted, you can test the payment endpoints:

```bash
# Test payment initiation
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "UGX",
    "description": "Premium Subscription",
    "email": "test@example.com"
  }'
```

---

## PesaPal Environment

**Current Environment:** Sandbox (Testing)

### Sandbox vs Production

- **Sandbox:** For testing only, no real money transactions
- **Production:** For live transactions with real money

To switch to production:
1. Get production credentials from PesaPal
2. Update `PESAPAL_ENVIRONMENT=production` in `.env`
3. Update IPN URL to your production domain

---

## Payment Flow

1. **User initiates payment** → Frontend calls `/api/payments/initiate`
2. **Backend creates payment** → Returns PesaPal payment URL
3. **User redirects to PesaPal** → Completes payment
4. **PesaPal sends callback** → `/api/payments/callback` receives notification
5. **Backend verifies payment** → Updates user subscription status

---

## Available Payment Endpoints

### 1. Initiate Payment
```
POST /api/payments/initiate
```

**Request Body:**
```json
{
  "amount": 5000,
  "currency": "UGX",
  "description": "Premium Subscription",
  "email": "user@example.com",
  "userId": "user-id-here"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.pesapal.com/...",
  "transactionId": "TXN123456",
  "message": "Payment initiated successfully"
}
```

### 2. Verify Payment
```
GET /api/payments/verify/:transactionId
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "transactionId": "TXN123456",
    "status": "completed",
    "amount": 5000,
    "currency": "UGX"
  }
}
```

### 3. Payment Callback (IPN)
```
POST /api/payments/callback
```

This endpoint is called automatically by PesaPal when payment status changes.

### 4. Get User Payments
```
GET /api/payments/user/:userId
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "transactionId": "TXN123456",
      "amount": 5000,
      "status": "completed",
      "createdAt": "2025-12-13T..."
    }
  ]
}
```

---

## Testing Payment Integration

### Test Credentials (Sandbox)

PesaPal provides test cards for sandbox testing:

**Test Card Numbers:**
- Visa: `4111111111111111`
- Mastercard: `5500000000000004`

**Expiry:** Any future date  
**CVV:** Any 3 digits

### Test Scenarios

1. **Successful Payment:**
   - Use test card numbers above
   - Complete payment flow
   - Verify callback received

2. **Failed Payment:**
   - Use invalid card number
   - Verify error handling

3. **Pending Payment:**
   - Initiate payment but don't complete
   - Check status remains pending

---

## Security Best Practices

✅ **Never commit `.env` file to Git**  
✅ **Use environment variables for all secrets**  
✅ **Validate all payment callbacks**  
✅ **Log all payment transactions**  
✅ **Use HTTPS in production**  
✅ **Implement rate limiting on payment endpoints**  
✅ **Verify payment amounts server-side**  

---

## Troubleshooting

### Issue: Payment initiation fails

**Solution:**
1. Check PesaPal credentials are correct
2. Verify environment is set to 'sandbox'
3. Check internet connection
4. Review server logs for errors

### Issue: Callback not received

**Solution:**
1. Verify IPN URL is accessible
2. Check PesaPal dashboard for callback logs
3. Ensure server is running and accessible
4. Test callback endpoint manually

### Issue: Payment verification fails

**Solution:**
1. Check transaction ID is correct
2. Verify payment was completed on PesaPal
3. Check database for payment record
4. Review payment status in PesaPal dashboard

---

## Production Checklist

Before going live:

- [ ] Get production PesaPal credentials
- [ ] Update `PESAPAL_ENVIRONMENT=production`
- [ ] Update IPN URL to production domain
- [ ] Enable HTTPS
- [ ] Test all payment flows
- [ ] Set up payment monitoring
- [ ] Configure email notifications
- [ ] Review security settings
- [ ] Test error handling
- [ ] Set up logging and alerts

---

## Resources

- **PesaPal Dashboard:** https://www.pesapal.com/
- **PesaPal API Docs:** https://developer.pesapal.com/
- **Support:** support@pesapal.com

---

## Summary

✅ **Credentials Provided:** Consumer Key and Secret  
✅ **Environment:** Sandbox (Testing)  
✅ **Endpoints:** All payment endpoints ready  
✅ **Next Step:** Add credentials to `.env` and restart server  

Your payment integration is ready to use once you add the credentials to your `.env` file!
