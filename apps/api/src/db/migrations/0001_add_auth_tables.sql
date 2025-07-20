-- Create users table
CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `email` text NOT NULL UNIQUE,
  `username` text NOT NULL,
  `password_hash` text NOT NULL,
  `superuser` integer DEFAULT false,
  `created_at` integer,
  `updated_at` integer
);

-- Create sessions table
CREATE TABLE `sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `access_token` text NOT NULL UNIQUE,
  `refresh_token` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `created_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Create password_reset_tokens table
CREATE TABLE `password_reset_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` integer NOT NULL,
  `token` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Create user_creation_tokens table
CREATE TABLE `user_creation_tokens` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `email` text NOT NULL,
  `token` text NOT NULL UNIQUE,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_by` integer NOT NULL,
  `created_at` integer,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE cascade
);

-- Create indexes for better performance
CREATE INDEX `idx_sessions_user_id` ON `sessions`(`user_id`);
CREATE INDEX `idx_sessions_access_token` ON `sessions`(`access_token`);
CREATE INDEX `idx_sessions_refresh_token` ON `sessions`(`refresh_token`);
CREATE INDEX `idx_password_reset_tokens_token` ON `password_reset_tokens`(`token`);
CREATE INDEX `idx_password_reset_tokens_user_id` ON `password_reset_tokens`(`user_id`);
CREATE INDEX `idx_user_creation_tokens_token` ON `user_creation_tokens`(`token`);
CREATE INDEX `idx_user_creation_tokens_email` ON `user_creation_tokens`(`email`);