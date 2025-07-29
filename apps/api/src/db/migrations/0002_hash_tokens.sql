-- Drop old sessions table and rename new one
DROP TABLE `sessions`;
CREATE TABLE `sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `access_token_hash` text NOT NULL UNIQUE,
  `refresh_token_hash` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `created_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Update password_reset_tokens table
DROP TABLE `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `token_hash` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Update user_creation_tokens table
DROP TABLE `user_creation_tokens`;
CREATE TABLE `user_creation_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `email` text NOT NULL,
  `token_hash` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_by` integer NOT NULL,
  `created_at` integer,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Recreate indexes for better performance
CREATE INDEX `idx_sessions_user_id` ON `sessions`(`user_id`);
CREATE INDEX `idx_sessions_access_token_hash` ON `sessions`(`access_token_hash`);
CREATE INDEX `idx_sessions_refresh_token_hash` ON `sessions`(`refresh_token_hash`);
CREATE INDEX `idx_password_reset_tokens_token_hash` ON `password_reset_tokens`(`token_hash`);
CREATE INDEX `idx_password_reset_tokens_user_id` ON `password_reset_tokens`(`user_id`);
CREATE INDEX `idx_user_creation_tokens_token_hash` ON `user_creation_tokens`(`token_hash`);
CREATE INDEX `idx_user_creation_tokens_email` ON `user_creation_tokens`(`email`);