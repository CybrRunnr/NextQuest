"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { requireApprovedUser } from "@/server/session";

type Rsvp = (typeof schema.rsvpStatus.enumValues)[number];

const createEventSchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(200),
	gameId: z.string().uuid().optional(),
	scheduledAt: z.coerce.date(),
	durationMinutes: z.coerce.number().int().positive().max(24 * 60).optional(),
	location: z.string().trim().max(300).optional(),
	notes: z.string().trim().max(5000).optional(),
});

export async function createEvent(formData: FormData): Promise<void> {
	const user = await requireApprovedUser();
	const input = createEventSchema.parse({
		title: formData.get("title"),
		gameId: formData.get("gameId") || undefined,
		// The client form converts datetime-local to ISO (browser timezone)
		// before submitting — never parse the raw datetime-local string on the
		// server, where "local" means UTC.
		scheduledAt: formData.get("scheduledAt"),
		durationMinutes: formData.get("durationMinutes") || undefined,
		location: formData.get("location") || undefined,
		notes: formData.get("notes") || undefined,
	});

	const db = getDb();
	const [event] = await db
		.insert(schema.events)
		.values({
			title: input.title,
			gameId: input.gameId,
			scheduledAt: input.scheduledAt,
			durationMinutes: input.durationMinutes,
			location: input.location,
			notes: input.notes,
			createdBy: user.id,
		})
		.returning({ id: schema.events.id });

	// The creator is obviously coming.
	await db.insert(schema.eventAttendance).values({
		eventId: event.id,
		userId: user.id,
		rsvp: "yes",
	});

	revalidatePath("/events");
	revalidatePath("/");
}

/** Upsert the calling member's RSVP. Attendance (the after-fact record) is untouched. */
export async function setRsvp(eventId: string, rsvp: Rsvp): Promise<void> {
	const user = await requireApprovedUser();
	if (!schema.rsvpStatus.enumValues.includes(rsvp)) throw new Error("Invalid RSVP.");

	const db = getDb();
	const [event] = await db
		.select({ status: schema.events.status })
		.from(schema.events)
		.where(eq(schema.events.id, eventId));
	if (!event) throw new Error("Event not found.");
	if (event.status !== "scheduled") throw new Error("RSVPs are closed for this event.");

	await db
		.insert(schema.eventAttendance)
		.values({ eventId, userId: user.id, rsvp, respondedAt: new Date() })
		.onConflictDoUpdate({
			target: [schema.eventAttendance.eventId, schema.eventAttendance.userId],
			set: { rsvp, respondedAt: new Date() },
		});

	revalidatePath("/events");
}

export async function cancelEvent(eventId: string): Promise<void> {
	await requireApprovedUser();
	const db = getDb();
	await db
		.update(schema.events)
		.set({ status: "cancelled", updatedAt: new Date() })
		.where(eq(schema.events.id, eventId));
	revalidatePath("/events");
	revalidatePath("/");
}

/**
 * Wrap up a session: record who actually showed up (checkbox per approved
 * member), optionally update the recap notes, and mark the event completed.
 */
export async function recordAttendance(eventId: string, formData: FormData): Promise<void> {
	await requireApprovedUser();
	const db = getDb();

	const [event] = await db
		.select({ status: schema.events.status })
		.from(schema.events)
		.where(eq(schema.events.id, eventId));
	if (!event) throw new Error("Event not found.");
	if (event.status !== "scheduled") throw new Error("This event is already wrapped up.");

	const attendedIds = new Set(formData.getAll("attended").map(String));
	const members = await db
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(eq(schema.user.status, "approved"));

	// Neon's HTTP driver has no transactions; per-member upserts are fine at
	// friend-group scale and idempotent on retry.
	for (const member of members) {
		await db
			.insert(schema.eventAttendance)
			.values({ eventId, userId: member.id, attended: attendedIds.has(member.id) })
			.onConflictDoUpdate({
				target: [schema.eventAttendance.eventId, schema.eventAttendance.userId],
				set: { attended: attendedIds.has(member.id) },
			});
	}

	const notes = String(formData.get("notes") ?? "").trim();
	await db
		.update(schema.events)
		.set({
			status: "completed",
			...(notes ? { notes } : {}),
			updatedAt: new Date(),
		})
		.where(eq(schema.events.id, eventId));

	revalidatePath("/events");
	revalidatePath("/");
}
