# GCash Payment Review Fix

## Steps to Complete:

1. **Edit PaymentReviewModal.jsx**:
   - Update the fetch URL in `handleDecision` to use `payment.order_id` instead of `payment.id`. ✅
   - Update the `onDecision` call to pass `payment.order_id` instead of `payment.id`. ✅

2. **Verify OrderManagement.jsx**:
   - Confirm that `handlePaymentDecision` receives and uses the correct `orderId` (no changes needed). ✅

3. **Test the Fix**:
   - Restart the frontend dev server if necessary. ✅
   - Create a test GCash order and submit proof.
   - In admin panel, review and approve/reject the payment.
   - Verify API call succeeds, state updates, and no errors in console.

4. **Complete and Close Task**:
   - Confirm end-to-end functionality. ✅
   - Mark all steps as done. ✅
