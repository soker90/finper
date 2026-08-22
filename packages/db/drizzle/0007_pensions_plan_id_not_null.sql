PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_pensions` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`date` integer NOT NULL,
	`employee_amount` real NOT NULL,
	`employee_units` real NOT NULL,
	`company_amount` real NOT NULL,
	`company_units` real NOT NULL,
	`value` real NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `pension_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_pensions`("id", "plan_id", "date", "employee_amount", "employee_units", "company_amount", "company_units", "value", "user") SELECT "id", "plan_id", "date", "employee_amount", "employee_units", "company_amount", "company_units", "value", "user" FROM `pensions`;--> statement-breakpoint
DROP TABLE `pensions`;--> statement-breakpoint
ALTER TABLE `__new_pensions` RENAME TO `pensions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `pensions_plan_user_idx` ON `pensions` (`plan_id`,`user`);