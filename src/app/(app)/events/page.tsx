import type { Metadata } from "next";
import { asc, eq, inArray, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { requireApprovedUser } from "@/server/session";

import { CreateEventForm } from "./create-event-form";
import { EventCard, type EventWithDetails } from "./event-card";

export const metadata: Metadata = { title: "Events" };

// Plain helper, not a component: Date.now() here keeps render pure per the
// react-hooks purity rules (this is an RSC, evaluated once per request).
function partitionEvents(events: EventWithDetails[]) {
	const now = Date.now();
	return {
		upcoming: events.filter(
			(event) => event.status === "scheduled" && event.scheduledAt.getTime() > now
		),
		needsWrapUp: events.filter(
			(event) => event.status === "scheduled" && event.scheduledAt.getTime() <= now
		),
		past: events
			.filter((event) => event.status !== "scheduled")
			.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
			.slice(0, 10),
	};
}

export default async function EventsPage() {
	const user = await requireApprovedUser();
	const db = getDb();

	const creator = schema.user;
	const [eventRows, members, candidateGames] = await Promise.all([
		db
			.select({
				id: schema.events.id,
				title: schema.events.title,
				status: schema.events.status,
				scheduledAt: schema.events.scheduledAt,
				durationMinutes: schema.events.durationMinutes,
				location: schema.events.location,
				notes: schema.events.notes,
				gameTitle: schema.games.title,
				creatorName: creator.name,
			})
			.from(schema.events)
			.leftJoin(schema.games, eq(schema.events.gameId, schema.games.id))
			.leftJoin(creator, eq(schema.events.createdBy, creator.id))
			.orderBy(asc(schema.events.scheduledAt)),
		db
			.select({ id: schema.user.id, name: schema.user.name })
			.from(schema.user)
			.where(eq(schema.user.status, "approved"))
			.orderBy(asc(schema.user.name)),
		// Sessions are usually for what's being played or queued next.
		db
			.select({ id: schema.games.id, title: schema.games.title })
			.from(schema.games)
			.where(inArray(schema.games.status, ["playing", "backlog"]))
			.orderBy(sql`${schema.games.status} = 'playing' desc`, asc(schema.games.title)),
	]);

	// Attendance is public within the group (unlike votes) — names and all.
	const attendanceRows =
		eventRows.length === 0
			? []
			: await db
					.select({
						eventId: schema.eventAttendance.eventId,
						userId: schema.eventAttendance.userId,
						rsvp: schema.eventAttendance.rsvp,
						attended: schema.eventAttendance.attended,
						name: schema.user.name,
					})
					.from(schema.eventAttendance)
					.innerJoin(schema.user, eq(schema.eventAttendance.userId, schema.user.id))
					.where(
						inArray(
							schema.eventAttendance.eventId,
							eventRows.map((event) => event.id)
						)
					);

	const events: EventWithDetails[] = eventRows.map((event) => ({
		...event,
		attendance: attendanceRows
			.filter((row) => row.eventId === event.id)
			.map(({ userId, name, rsvp, attended }) => ({ userId, name, rsvp, attended })),
	}));

	const { upcoming, needsWrapUp, past } = partitionEvents(events);

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">Events</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Schedule sessions, RSVP, and keep the attendance receipts.
				</p>
			</div>

			<CreateEventForm games={candidateGames} />

			{needsWrapUp.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-medium tracking-wide uppercase">Needs wrap-up</h2>
					{needsWrapUp.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							currentUserId={user.id}
							members={members}
							needsWrapUp
						/>
					))}
				</section>
			)}

			<section className="flex flex-col gap-3">
				<h2 className="text-sm font-medium tracking-wide uppercase">
					Upcoming
					<span className="text-muted-foreground ml-2 font-normal">{upcoming.length}</span>
				</h2>
				{upcoming.length === 0 ? (
					<p className="text-muted-foreground text-sm">Nothing on the calendar.</p>
				) : (
					upcoming.map((event) => (
						<EventCard key={event.id} event={event} currentUserId={user.id} members={members} />
					))
				)}
			</section>

			{past.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-medium tracking-wide uppercase">Past</h2>
					{past.map((event) => (
						<EventCard key={event.id} event={event} currentUserId={user.id} members={members} />
					))}
				</section>
			)}
		</div>
	);
}
