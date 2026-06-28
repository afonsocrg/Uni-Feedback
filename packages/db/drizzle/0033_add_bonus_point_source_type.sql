-- Add 'bonus' to the point_registry source type enum.
-- Used for manually-credited campaign bonuses (e.g. Instagram follow, quality
-- milestones) that are awarded outside the automatic feedback/referral flow but
-- still show up in the user's point ledger and total.
ALTER TYPE point_source_type ADD VALUE IF NOT EXISTS 'bonus';
