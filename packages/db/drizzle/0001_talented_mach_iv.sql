PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`number` text,
	`balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "name", "bank", "number", "balance", "is_active", "user") SELECT "id", "name", "bank", "number", "balance", "is_active", "user" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`amount` real NOT NULL,
	`category_id` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_budgets`("id", "year", "month", "amount", "category_id", "user") SELECT "id", "year", "month", "amount", "category_id", "user" FROM `budgets`;--> statement-breakpoint
DROP TABLE `budgets`;--> statement-breakpoint
ALTER TABLE `__new_budgets` RENAME TO `budgets`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_month_year_category_idx` ON `budgets` (`user`,`month`,`year`,`category_id`);--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`parent_id` text,
	`budget_rule_class` text DEFAULT 'none' NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "type", "color", "icon", "parent_id", "budget_rule_class", "user") SELECT "id", "name", "type", "color", "icon", "parent_id", "budget_rule_class", "user" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE TABLE `__new_debts` (
	`id` text PRIMARY KEY NOT NULL,
	`from` text NOT NULL,
	`date` integer,
	`amount` real NOT NULL,
	`concept` text,
	`type` text NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_debts`("id", "from", "date", "amount", "concept", "type", "user") SELECT "id", "from", "date", "amount", "concept", "type", "user" FROM `debts`;--> statement-breakpoint
DROP TABLE `debts`;--> statement-breakpoint
ALTER TABLE `__new_debts` RENAME TO `debts`;--> statement-breakpoint
CREATE TABLE `__new_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` integer,
	`color` text NOT NULL,
	`icon` text NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_goals`("id", "name", "target_amount", "current_amount", "deadline", "color", "icon", "user") SELECT "id", "name", "target_amount", "current_amount", "deadline", "color", "icon", "user" FROM `goals`;--> statement-breakpoint
DROP TABLE `goals`;--> statement-breakpoint
ALTER TABLE `__new_goals` RENAME TO `goals`;--> statement-breakpoint
CREATE TABLE `__new_loans` (
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
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_loans`("id", "name", "initial_amount", "pending_amount", "interest_rate", "start_date", "monthly_payment", "initial_estimated_cost", "account_id", "category_id", "user") SELECT "id", "name", "initial_amount", "pending_amount", "interest_rate", "start_date", "monthly_payment", "initial_estimated_cost", "account_id", "category_id", "user" FROM `loans`;--> statement-breakpoint
DROP TABLE `loans`;--> statement-breakpoint
ALTER TABLE `__new_loans` RENAME TO `loans`;--> statement-breakpoint
CREATE INDEX `loans_user_idx` ON `loans` (`user`);--> statement-breakpoint
CREATE TABLE `__new_loan_events` (
	`id` text PRIMARY KEY NOT NULL,
	`loan_id` text NOT NULL,
	`date` integer NOT NULL,
	`new_rate` real NOT NULL,
	`new_payment` real NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_loan_events`("id", "loan_id", "date", "new_rate", "new_payment", "user") SELECT "id", "loan_id", "date", "new_rate", "new_payment", "user" FROM `loan_events`;--> statement-breakpoint
DROP TABLE `loan_events`;--> statement-breakpoint
ALTER TABLE `__new_loan_events` RENAME TO `loan_events`;--> statement-breakpoint
CREATE INDEX `loan_events_loan_user_idx` ON `loan_events` (`loan_id`,`user`);--> statement-breakpoint
CREATE INDEX `loan_events_user_idx` ON `loan_events` (`user`);--> statement-breakpoint
CREATE TABLE `__new_loan_payments` (
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
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_loan_payments`("id", "loan_id", "date", "amount", "interest", "principal", "accumulated_principal", "pending_capital", "type", "user") SELECT "id", "loan_id", "date", "amount", "interest", "principal", "accumulated_principal", "pending_capital", "type", "user" FROM `loan_payments`;--> statement-breakpoint
DROP TABLE `loan_payments`;--> statement-breakpoint
ALTER TABLE `__new_loan_payments` RENAME TO `loan_payments`;--> statement-breakpoint
CREATE INDEX `loan_payments_loan_user_date_idx` ON `loan_payments` (`loan_id`,`user`,`date`);--> statement-breakpoint
CREATE INDEX `loan_payments_user_idx` ON `loan_payments` (`user`);--> statement-breakpoint
CREATE TABLE `__new_pensions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`employee_amount` real NOT NULL,
	`employee_units` real NOT NULL,
	`company_amount` real NOT NULL,
	`company_units` real NOT NULL,
	`value` real NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_pensions`("id", "date", "employee_amount", "employee_units", "company_amount", "company_units", "value", "user") SELECT "id", "date", "employee_amount", "employee_units", "company_amount", "company_units", "value", "user" FROM `pensions`;--> statement-breakpoint
DROP TABLE `pensions`;--> statement-breakpoint
ALTER TABLE `__new_pensions` RENAME TO `pensions`;--> statement-breakpoint
CREATE TABLE `__new_properties` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_properties`("id", "name", "user") SELECT "id", "name", "user" FROM `properties`;--> statement-breakpoint
DROP TABLE `properties`;--> statement-breakpoint
ALTER TABLE `__new_properties` RENAME TO `properties`;--> statement-breakpoint
CREATE TABLE `__new_supplies` (
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
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_supplies`("id", "name", "type", "property_id", "contracted_power_peak", "contracted_power_off_peak", "current_price_power_peak", "current_price_power_off_peak", "current_price_energy_peak", "current_price_energy_flat", "current_price_energy_off_peak", "user") SELECT "id", "name", "type", "property_id", "contracted_power_peak", "contracted_power_off_peak", "current_price_power_peak", "current_price_power_off_peak", "current_price_energy_peak", "current_price_energy_flat", "current_price_energy_off_peak", "user" FROM `supplies`;--> statement-breakpoint
DROP TABLE `supplies`;--> statement-breakpoint
ALTER TABLE `__new_supplies` RENAME TO `supplies`;--> statement-breakpoint
CREATE TABLE `__new_supply_readings` (
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
	FOREIGN KEY (`supply_id`) REFERENCES `supplies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_supply_readings`("id", "supply_id", "start_date", "end_date", "amount", "consumption", "consumption_peak", "consumption_flat", "consumption_off_peak", "user") SELECT "id", "supply_id", "start_date", "end_date", "amount", "consumption", "consumption_peak", "consumption_flat", "consumption_off_peak", "user" FROM `supply_readings`;--> statement-breakpoint
DROP TABLE `supply_readings`;--> statement-breakpoint
ALTER TABLE `__new_supply_readings` RENAME TO `supply_readings`;--> statement-breakpoint
CREATE TABLE `__new_stocks` (
	`id` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`shares` real NOT NULL,
	`price` real NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_stocks`("id", "platform", "ticker", "name", "shares", "price", "type", "date", "user") SELECT "id", "platform", "ticker", "name", "shares", "price", "type", "date", "user" FROM `stocks`;--> statement-breakpoint
DROP TABLE `stocks`;--> statement-breakpoint
ALTER TABLE `__new_stocks` RENAME TO `stocks`;--> statement-breakpoint
CREATE TABLE `__new_stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_stores`("id", "name", "user") SELECT "id", "name", "user" FROM `stores`;--> statement-breakpoint
DROP TABLE `stores`;--> statement-breakpoint
ALTER TABLE `__new_stores` RENAME TO `stores`;--> statement-breakpoint
CREATE TABLE `__new_subscription_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_subscription_candidates`("id", "name", "user", "created_at") SELECT "id", "name", "user", "created_at" FROM `subscription_candidates`;--> statement-breakpoint
DROP TABLE `subscription_candidates`;--> statement-breakpoint
ALTER TABLE `__new_subscription_candidates` RENAME TO `subscription_candidates`;--> statement-breakpoint
CREATE TABLE `__new_subscriptions` (
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
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_subscriptions`("id", "name", "amount", "currency", "cycle", "next_payment_date", "category_id", "account_id", "logo_url", "user") SELECT "id", "name", "amount", "currency", "cycle", "next_payment_date", "category_id", "account_id", "logo_url", "user" FROM `subscriptions`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_subscriptions` RENAME TO `subscriptions`;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "name", "user") SELECT "id", "name", "user" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE TABLE `__new_transaction_tags` (
	`transaction_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`user` text NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transaction_tags`("transaction_id", "tag_id", "user") SELECT "transaction_id", "tag_id", "user" FROM `transaction_tags`;--> statement-breakpoint
DROP TABLE `transaction_tags`;--> statement-breakpoint
ALTER TABLE `__new_transaction_tags` RENAME TO `transaction_tags`;--> statement-breakpoint
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
	`user` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "date", "category_id", "amount", "type", "account_id", "note", "store_id", "subscription_id", "user") SELECT "id", "date", "category_id", "amount", "type", "account_id", "note", "store_id", "subscription_id", "user" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE INDEX `transactions_user_type_date_idx` ON `transactions` (`user`,`type`,`date`);--> statement-breakpoint
CREATE INDEX `transactions_user_idx` ON `transactions` (`user`);