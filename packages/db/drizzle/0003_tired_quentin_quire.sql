CREATE TABLE `credit_card_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`credit_card_id` text NOT NULL,
	`date` integer NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`note` text,
	`store_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` integer,
	`transaction_id` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`credit_card_id`) REFERENCES `credit_cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cc_movements_card_user_idx` ON `credit_card_movements` (`credit_card_id`,`user`);--> statement-breakpoint
CREATE INDEX `cc_movements_user_status_idx` ON `credit_card_movements` (`user`,`status`);--> statement-breakpoint
CREATE TABLE `credit_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account_id` text NOT NULL,
	`limit` real,
	`user` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `credit_cards_user_idx` ON `credit_cards` (`user`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `credit_card_id` text REFERENCES credit_cards(id);