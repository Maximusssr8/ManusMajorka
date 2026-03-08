CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` text,
	`niche` varchar(255),
	`description` text,
	`status` enum('research','validate','build','launch','optimize','scale') NOT NULL DEFAULT 'research',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_outputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`toolId` varchar(128) NOT NULL,
	`toolName` varchar(255) NOT NULL,
	`stage` varchar(64) NOT NULL,
	`outputJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_outputs_id` PRIMARY KEY(`id`)
);
