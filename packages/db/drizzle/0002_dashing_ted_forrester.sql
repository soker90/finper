CREATE TABLE `passkeys` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`credential_id` text NOT NULL,
	`public_key` text NOT NULL,
	`counter` integer DEFAULT 0 NOT NULL,
	`transports` text,
	`device_label` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passkeys_credential_id_idx` ON `passkeys` (`credential_id`);