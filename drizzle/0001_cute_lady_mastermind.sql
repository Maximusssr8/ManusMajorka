CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`plan` varchar(64) NOT NULL DEFAULT 'pro',
	`priceInCents` int NOT NULL DEFAULT 9900,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`periodStart` timestamp NOT NULL DEFAULT (now()),
	`periodEnd` timestamp,
	`externalRef` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
