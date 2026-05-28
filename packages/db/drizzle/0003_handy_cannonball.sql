DROP TABLE `tags`;--> statement-breakpoint
DROP TABLE `transaction_tags`;--> statement-breakpoint
ALTER TABLE `subscription_candidates` ADD `transaction_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_candidates` ADD `subscription_ids` text NOT NULL;--> statement-breakpoint
ALTER TABLE `subscription_candidates` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `transactions` ADD `tags` text DEFAULT '[]' NOT NULL;