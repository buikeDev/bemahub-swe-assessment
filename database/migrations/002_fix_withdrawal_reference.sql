-- Forward-only correction. Run once after 001_initial.sql.
-- Preflight: reconcile any existing duplicate instructor/reference pairs before
-- applying. Do not automatically delete financial history. The assessment
-- duplicate probes were rolled back, and the preflight found no other duplicates.
-- Cancellation must not permit reuse of the same idempotency reference.
ALTER TABLE wp_bl_withdrawals
    DROP INDEX uq_reference,
    ADD UNIQUE KEY uq_reference (instructor_id, payout_reference);
