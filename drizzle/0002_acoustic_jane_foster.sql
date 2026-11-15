CREATE TABLE `product_banner_image` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`alt` text,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `store_setting` ADD `social_urls` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `store_setting` ADD `footer_media_links` text DEFAULT '[]' NOT NULL;