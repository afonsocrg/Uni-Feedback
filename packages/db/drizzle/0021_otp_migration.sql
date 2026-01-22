-- OTP Authentication Migration
-- Creates tables for OTP-based authentication

-- OTP Tokens table
CREATE TABLE IF NOT EXISTS otp_tokens (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  referral_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for OTP tokens
CREATE INDEX IF NOT EXISTS idx_otp_tokens_email ON otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires_at ON otp_tokens(expires_at);

-- OTP Rate Limits table
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  last_request_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for OTP rate limits
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_email ON otp_rate_limits(email);
