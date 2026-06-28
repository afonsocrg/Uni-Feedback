-- Add 'referral_bonus' to the point_registry source type enum.
-- Awarded to the user who ACCEPTS a referral (the referee) once they submit
-- their first approved feedback. This mirrors the 'referral' reward given to
-- the referrer, so both sides of a successful referral are credited equally.
-- A distinct type (vs reusing 'referral') keeps getReferralCount, which counts
-- friends a user has referred, accurate.
ALTER TYPE point_source_type ADD VALUE IF NOT EXISTS 'referral_bonus';
