import { pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

// GAC (Gamer Availability Checker): propose time slots, members mark
// yes / no / if-need-be, then the winning slot becomes an event
// (events.availability_poll_id points back). Responses are public within
// the group, like RSVPs — only votes are anonymous.

export const pollStatus = pgEnum("poll_status", ["open", "closed"]);

export const availabilityResponseValue = pgEnum("availability_response", [
	"yes",
	"no",
	"if_need_be",
]);

export const availabilityPolls = pgTable("availability_polls", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: text("title").notNull(),
	createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
	closesAt: timestamp("closes_at", { withTimezone: true }),
	status: pollStatus("status").notNull().default("open"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const availabilityOptions = pgTable("availability_options", {
	id: uuid("id").primaryKey().defaultRandom(),
	pollId: uuid("poll_id")
		.notNull()
		.references(() => availabilityPolls.id, { onDelete: "cascade" }),
	startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
	endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
});

export const availabilityResponses = pgTable(
	"availability_responses",
	{
		optionId: uuid("option_id")
			.notNull()
			.references(() => availabilityOptions.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		response: availabilityResponseValue("response").notNull(),
		respondedAt: timestamp("responded_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.optionId, table.userId] })]
);
