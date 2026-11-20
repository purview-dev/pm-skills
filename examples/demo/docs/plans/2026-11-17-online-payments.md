# R-007 Online payments at booking Implementation Plan

Demo data: an invented plan for the invented product Slotwise.

**Goal:** A client pays by card when booking, and the booking is confirmed by the provider's webhook.

## Tasks

### Task 1: Payments table

- [x] **Step 1: Write the failing migration test**
- [x] **Step 2: Add the payments table keyed by booking**
- [x] **Step 3: Commit**

### Task 2: Hosted checkout

- [x] **Step 1: Write the failing test for the checkout redirect**
- [x] **Step 2: Create the payment intent on booking**
- [x] **Step 3: Redirect to the hosted checkout**
- [ ] **Step 4: Commit**

### Task 3: Webhook confirms the booking

- [ ] **Step 1: Write the failing signature test**
- [ ] **Step 2: Verify the webhook signature**
- [ ] **Step 3: Confirm the booking on success, free the slot on failure**
- [ ] **Step 4: Commit**

### Task 4: Dashboard lists payments

- [ ] **Step 1: Write the failing dashboard test**
- [ ] **Step 2: Show each payment beside its booking**
- [ ] **Step 3: Commit**
