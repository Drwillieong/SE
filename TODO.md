# Simplify GcashPaymentModal Task

## Overview
Modify the GcashPaymentModal to only send an email to the admin, removing reference number and proof image collection.

## Tasks
- [ ] Update GcashPaymentModal.jsx: Remove reference number and proof inputs, simplify to just a submit button that sends email
- [ ] Update ScheduleBooking.jsx: Modify handleGcashPaymentSubmit to not send referenceNumber and proof
- [ ] Update orderController.js: Modify submitGcashPayment to not expect or process referenceNumber and proof, just send email
- [ ] Update gcashEmail.js: Modify sendGcashPaymentNotificationEmail to not include reference and proof in the email

## Files to Edit
- client/src/features/customer/components/GcashPaymentModal.jsx
- client/src/features/customer/routes/dashboard/ScheduleBooking.jsx
- backend/controllers/orderController.js
- backend/utils/gcashEmail.js
