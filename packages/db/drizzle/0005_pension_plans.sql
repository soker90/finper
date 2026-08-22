CREATE TABLE `pension_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user` text NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pension_plans_user_idx` ON `pension_plans` (`user`);--> statement-breakpoint
ALTER TABLE `pensions` ADD `plan_id` text REFERENCES pension_plans(id);--> statement-breakpoint
CREATE INDEX `pensions_plan_user_idx` ON `pensions` (`plan_id`,`user`);