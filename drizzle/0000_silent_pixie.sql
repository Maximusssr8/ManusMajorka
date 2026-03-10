CREATE TYPE "public"."product_status" AS ENUM('research', 'validate', 'build', 'launch', 'optimize', 'scale');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "conversation_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tool_name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text,
	"niche" varchar(255),
	"description" text,
	"status" "product_status" DEFAULT 'research' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_outputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"toolId" varchar(128) NOT NULL,
	"toolName" varchar(255) NOT NULL,
	"stage" varchar(64) NOT NULL,
	"outputJson" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"plan" varchar(64) DEFAULT 'pro' NOT NULL,
	"priceInCents" integer DEFAULT 9900 NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"periodStart" timestamp DEFAULT now() NOT NULL,
	"periodEnd" timestamp,
	"externalRef" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"experience_level" varchar(20),
	"main_goal" varchar(100),
	"budget" varchar(50),
	"business_name" varchar(255),
	"target_niche" varchar(255),
	"monthly_revenue" varchar(50),
	"country" varchar(100),
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
