CREATE TABLE `api_rate_limits` (
  `key` text PRIMARY KEY NOT NULL,
  `hits` integer NOT NULL,
  `reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_rate_limits_reset_at_idx` ON `api_rate_limits` (`reset_at`);
