# Security Specification & Red-Team Audit (`security_spec.md`)

## 1. Data Invariants

1. **Default Deny**: All unmatched paths under `/databases/{database}/documents` are denied for both read and write.
2. **PII Isolation**: `/bookings/{bookingId}` and `/leads/{leadId}` contain Egyptian student/parent phone numbers, full names, and payment receipts. Public users can NEVER `get` or `list` `/bookings` or `/leads`.
3. **Cloud-Function-Free Safe Tracking**: `/bookingLookups/{lookupId}` uses a deterministic key `{ADM-XXXXX}_{01XXXXXXXXX}`. Only single-document `get` is allowed; `list` is strictly forbidden (preventing enumeration/scraping). Creation is bound atomically via `existsAfter` to `/bookings/{bookingId}`.
4. **Anti-Double-Booking Atomicity**: Non-admin updates to `/slots/{slotId}` are strictly limited to transitioning `status` from `'available'` to `'pending'`, touching ONLY `['status', 'bookingId', 'studentName']`, and proving via `existsAfter` that `/bookings/{bookingId}` is being created in the exact same transaction.
5. **State Integrity**: Public booking creation MUST start with `status == 'pending_review'`, `classLink == ''`, `rejectionReason == ''`, `createdAt == request.time`, and an existing `courseId`.
6. **Admin RBAC**: Admin access requires either the verified bootstrapped owner email (`adhamaohamd@gmail.com` with `email_verified == true`) OR a trusted UID entry in `/admins/{uid}`. Clients can never self-assign admin privileges.
7. **Volumetric & ID Poisoning Guards**: Every single-document path ID matches `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), every string checks `.size()`, and every array checks `.size() <= MAX`.

## 2. The "Dirty Dozen" Adversarial Payloads

| # | Attack Vector | Target Path | Malicious Payload / Operation | Expected Result |
|---|--------------|-------------|-------------------------------|-----------------|
| 1 | Shadow Field Injection | `create /leads/lead1` | `{ whatsapp: "01063379433", createdAt: serverTime, isAdmin: true }` | `PERMISSION_DENIED` (`hasOnly` rejects `isAdmin`) |
| 2 | Status Shortcutting | `create /bookings/bk1` | `{ ..., status: "confirmed", classLink: "https://evil.test" }` | `PERMISSION_DENIED` (public must create `pending_review` with empty `classLink`) |
| 3 | Unverified Email Spoof | `read /bookings/bk1` | Auth token `email: "adhamaohamd@gmail.com"`, `email_verified: false` | `PERMISSION_DENIED` (`email_verified == true` required) |
| 4 | PII Blanket Scrape | `list /bookings` | Unauthenticated or regular signed-in non-admin `getDocs(bookings)` | `PERMISSION_DENIED` (`isAdmin()` required) |
| 5 | Lookup Enumeration | `list /bookingLookups` | Unauthenticated `getDocs(bookingLookups)` | `PERMISSION_DENIED` (`allow list: if false`) |
| 6 | Slot Hijack (Orphaned Lock) | `update /slots/prep_20261120_1600` | `{ status: "pending", bookingId: "fake_id" }` without creating booking | `PERMISSION_DENIED` (`existsAfter` fails) |
| 7 | Double-Booking Overwrite | `update /slots/prep_20261120_1600` | Existing `status == "pending"` -> `{ status: "pending", bookingId: "bk2" }` | `PERMISSION_DENIED` (existing status must be `"available"`) |
| 8 | Slot Value Poisoning | `update /slots/prep_20261120_1600` | `{ status: "booked", bookingId: "bk1" }` by public user | `PERMISSION_DENIED` (public can only set `"pending"`) |
| 9 | Path ID Poisoning | `create /leads/<200-char-invalid-id>` | Invalid chars `../evil` or length > 128 | `PERMISSION_DENIED` (`isValidId` rejects) |
| 10 | Self-Assigned Admin | `create /admins/<my-uid>` | `{ email: "attacker@test.com" }` as non-admin | `PERMISSION_DENIED` (`isAdmin()` required) |
| 11 | Invalid Egyptian Phone | `create /leads/lead2` | `{ whatsapp: "999999", createdAt: serverTime }` | `PERMISSION_DENIED` (regex `^01[0125][0-9]{8}$` fails) |
| 12 | Client Timestamp Forgery | `create /leads/lead3` | `{ whatsapp: "01063379433", createdAt: Timestamp(2020-01-01) }` | `PERMISSION_DENIED` (`createdAt == request.time` fails) |
