CREATE TABLE `credit_card_movement_splits` (
	`id` text PRIMARY KEY NOT NULL,
	`movement_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`movement_id`) REFERENCES `credit_card_movements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cc_mov_splits_movement_idx` ON `credit_card_movement_splits` (`movement_id`);--> statement-breakpoint
CREATE INDEX `cc_mov_splits_user_category_idx` ON `credit_card_movement_splits` (`user`,`category_id`);