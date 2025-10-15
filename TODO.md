# Deployment TODO List

## 1. Set up Aiven MySQL Database
- [ ] Create Aiven account and MySQL service
- [ ] Get connection details (host, port, username, password, database name)
- [ ] Run schema.sql on Aiven to create tables (users, bookings, orders)

## 2. Prepare Backend for Render
- [x] Update backend/src/server.js for production (CORS origins, DB connection)
- [x] Create .env template for Render environment variables
- [x] Set Render env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, SESSION_SECRET, EMAIL configs (EMAIL_USER, EMAIL_PASS for Gmail SMTP), FRONTEND_URL (Vercel domain)
- [x] Email features: Already configured with Gmail SMTP in utils/email.js, orderEmail.js, gcashEmail.js - requires EMAIL_USER and EMAIL_PASS env vars
- [x] Update package.json with Node.js version and dev script
- [x] Update email links to use FRONTEND_URL environment variable

## 3. Deploy Backend to Render
- [ ] Connect GitHub repo to Render
- [ ] Deploy as Web Service (Node.js)
- [ ] Verify backend is running and DB connected

## 4. Prepare Frontend for Vercel
- [x] Update client/vite.config.js if needed for build
- [x] Update client/src/utils/auth.js to use VITE_API_BASE_URL environment variable
- [ ] Set Vercel env var: VITE_API_BASE_URL (Render backend URL)

## 5. Deploy Frontend to Vercel
- [ ] Connect GitHub repo to Vercel
- [ ] Deploy frontend
- [ ] Get Vercel domain

## 6. Update Backend CORS
- [ ] Update Render env var FRONTEND_URL with Vercel domain
- [ ] Redeploy backend on Render

## 7. Testing and Verification
- [ ] Test frontend-backend connection
- [ ] Test DB operations (auth, bookings, orders)
- [ ] Test email notifications (verification, password reset, order confirmations, GCash payments, rejections, ready for pickup, completion)
- [ ] Monitor logs for errors
