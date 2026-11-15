CREATE TABLE `store_setting` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_name` text DEFAULT '' NOT NULL,
	`brand_wordmark` text DEFAULT '' NOT NULL,
	`brand_tagline` text DEFAULT '' NOT NULL,
	`brand_logo_url` text DEFAULT '' NOT NULL,
	`brand_favicon_url` text DEFAULT '' NOT NULL,
	`brand_domain` text DEFAULT '' NOT NULL,
	`brand_colors` text DEFAULT '{}' NOT NULL,
	`brand_fonts` text DEFAULT '{}' NOT NULL,
	`whatsapp_number` text DEFAULT '' NOT NULL,
	`whatsapp_template` text DEFAULT '' NOT NULL,
	`footer_text` text DEFAULT '' NOT NULL,
	`social` text DEFAULT '{}' NOT NULL,
	`default_seo` text DEFAULT '{}' NOT NULL,
	`header_links` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL
);
