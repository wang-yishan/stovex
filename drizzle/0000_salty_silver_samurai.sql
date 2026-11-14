CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `collection` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`cover_image` text,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'system' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`href` text,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text DEFAULT '' NOT NULL,
	`full_description` text DEFAULT '' NOT NULL,
	`material` text,
	`category_id` text DEFAULT '' NOT NULL,
	`collection_ids` text DEFAULT '[]' NOT NULL,
	`base_price` integer DEFAULT 0 NOT NULL,
	`compare_at_price` integer,
	`sku` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`has_variants` integer DEFAULT false NOT NULL,
	`track_inventory` integer DEFAULT true NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_image` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`alt` text,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_variant` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`attributes` text DEFAULT '[]' NOT NULL,
	`sku` text,
	`price_override` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`low_threshold` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipment` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text DEFAULT '' NOT NULL,
	`destination` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`courier` text DEFAULT '' NOT NULL,
	`service` text DEFAULT '' NOT NULL,
	`tracking_number` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`weight_kg` integer DEFAULT 0 NOT NULL,
	`shipping_cost` integer DEFAULT 0 NOT NULL,
	`order_total` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`delivered_at` text
);
--> statement-breakpoint
CREATE TABLE `shipment_event` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`status` text NOT NULL,
	`label` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_movement` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`product_name` text NOT NULL,
	`variant_name` text,
	`sku` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`quantity_change` integer NOT NULL,
	`previous_stock` integer NOT NULL,
	`new_stock` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`priority` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);