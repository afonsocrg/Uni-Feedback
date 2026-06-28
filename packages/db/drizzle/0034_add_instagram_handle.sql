-- Add nullable instagram_handle to users. Used for the "link Instagram" bonus.
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle text;
