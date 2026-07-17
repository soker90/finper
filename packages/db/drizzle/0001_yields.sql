CREATE TABLE `yield_settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`yield_id` text NOT NULL,
	`user` text NOT NULL,
	`tae` real,
	`average_balance` real,
	FOREIGN KEY (`yield_id`) REFERENCES `yields`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `yields` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`account_id` text NOT NULL,
	`category_ids` text DEFAULT '[]' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `yield_id` text REFERENCES yields(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `yield_settlement_id` text REFERENCES yield_settlements(id);