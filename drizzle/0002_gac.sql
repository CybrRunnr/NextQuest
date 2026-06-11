CREATE TYPE "public"."availability_response" AS ENUM('yes', 'no', 'if_need_be');--> statement-breakpoint
CREATE TYPE "public"."poll_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "availability_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_by" text,
	"closes_at" timestamp with time zone,
	"status" "poll_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_responses" (
	"option_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"response" "availability_response" NOT NULL,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_responses_option_id_user_id_pk" PRIMARY KEY("option_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "availability_poll_id" uuid;--> statement-breakpoint
ALTER TABLE "availability_options" ADD CONSTRAINT "availability_options_poll_id_availability_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."availability_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_polls" ADD CONSTRAINT "availability_polls_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_responses" ADD CONSTRAINT "availability_responses_option_id_availability_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."availability_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_responses" ADD CONSTRAINT "availability_responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_availability_poll_id_availability_polls_id_fk" FOREIGN KEY ("availability_poll_id") REFERENCES "public"."availability_polls"("id") ON DELETE set null ON UPDATE no action;