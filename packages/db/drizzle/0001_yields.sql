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
ALTER TABLE `transactions` ADD `yield_settlement_id` text REFERENCES yield_settlements(id);--> statement-breakpoint
CREATE UNIQUE INDEX `yields_user_account_type_idx` ON `yields` (`user`,`account_id`,`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `yield_settlements_id_yield_id_idx` ON `yield_settlements` (`id`,`yield_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`account_id` text NOT NULL,
	`note` text,
	`store_id` text,
	`subscription_id` text,
	`yield_id` text,
	`yield_settlement_id` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`yield_id`) REFERENCES `yields`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`yield_settlement_id`,`yield_id`) REFERENCES `yield_settlements`(`id`,`yield_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "date", "category_id", "amount", "type", "account_id", "note", "store_id", "subscription_id", "yield_id", "yield_settlement_id", "tags", "user") SELECT "id", "date", "category_id", "amount", "type", "account_id", "note", "store_id", "subscription_id", "yield_id", "yield_settlement_id", "tags", "user" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `transactions_user_type_date_idx` ON `transactions` (`user`,`type`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_user_idx` ON `transactions` (`user`);