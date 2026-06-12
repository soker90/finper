CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`amount` real NOT NULL,
	`category_id` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_month_year_category_idx` ON `budgets` (`user`,`month`,`year`,`category_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`budget_rule_class` text DEFAULT 'none' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`from` text NOT NULL,
	`date` integer,
	`amount` real NOT NULL,
	`concept` text,
	`type` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` integer,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `loans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`initial_amount` real NOT NULL,
	`pending_amount` real NOT NULL,
	`interest_rate` real NOT NULL,
	`start_date` integer NOT NULL,
	`monthly_payment` real NOT NULL,
	`initial_estimated_cost` real NOT NULL,
	`account_id` text NOT NULL,
	`category_id` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `loans_user_idx` ON `loans` (`user`);--> statement-breakpoint
CREATE TABLE `loan_events` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`date` integer NOT NULL,
	`new_rate` real NOT NULL,
	`new_payment` real NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `loan_events_loan_user_idx` ON `loan_events` (`loan_id`,`user`);--> statement-breakpoint
CREATE INDEX `loan_events_user_idx` ON `loan_events` (`user`);--> statement-breakpoint
CREATE TABLE `loan_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`date` integer NOT NULL,
	`amount` real NOT NULL,
	`interest` real DEFAULT 0,
	`principal` real NOT NULL,
	`accumulated_principal` real NOT NULL,
	`pending_capital` real NOT NULL,
	`type` text DEFAULT 'ordinary' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `loan_payments_loan_user_date_idx` ON `loan_payments` (`loan_id`,`user`,`date`);--> statement-breakpoint
CREATE INDEX `loan_payments_user_idx` ON `loan_payments` (`user`);--> statement-breakpoint
CREATE TABLE `pensions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`employee_amount` real NOT NULL,
	`employee_units` real NOT NULL,
	`company_amount` real NOT NULL,
	`company_units` real NOT NULL,
	`value` real NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`type` text NOT NULL,
	`property_id` text NOT NULL,
	`contracted_power_peak` real,
	`contracted_power_off_peak` real,
	`current_price_power_peak` real,
	`current_price_power_off_peak` real,
	`current_price_energy_peak` real,
	`current_price_energy_flat` real,
	`current_price_energy_off_peak` real,
	`user` text NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supply_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`supply_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`amount` real NOT NULL,
	`consumption` real,
	`consumption_peak` real,
	`consumption_flat` real,
	`consumption_off_peak` real,
	`user` text NOT NULL,
	FOREIGN KEY (`supply_id`) REFERENCES `supplies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`shares` real NOT NULL,
	`price` real NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscription_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`subscription_ids` text NOT NULL,
	`user` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text,
	`cycle` integer NOT NULL,
	`next_payment_date` integer,
	`category_id` text NOT NULL,
	`account_id` text NOT NULL,
	`logo_url` text,
	`user` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`category_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`account_id` text NOT NULL,
	`note` text,
	`store_id` text,
	`subscription_id` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transactions_user_type_date_idx` ON `transactions` (`user`,`type`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_user_idx` ON `transactions` (`user`);