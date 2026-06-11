"use client";

import { useSyncExternalStore } from "react";

// Server (and the hydration pass) renders UTC — it has no idea where the
// reader is; the client snapshot then re-renders in the browser's timezone.
// useSyncExternalStore is the React-sanctioned way to render
// environment-dependent values without hydration warnings.

const emptySubscribe = () => () => {};

function formatTime(value: Date, withWeekday: boolean, utc: boolean): string {
	const text = new Intl.DateTimeFormat(utc ? "en-US" : undefined, {
		...(withWeekday ? { weekday: "short" } : {}),
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		...(utc ? { timeZone: "UTC" } : {}),
	}).format(value);
	return utc ? `${text} UTC` : text;
}

export function LocalTime({
	date,
	withWeekday = false,
}: {
	date: Date | string;
	withWeekday?: boolean;
}) {
	const value = typeof date === "string" ? new Date(date) : date;
	const text = useSyncExternalStore(
		emptySubscribe,
		() => formatTime(value, withWeekday, false),
		() => formatTime(value, withWeekday, true)
	);

	return <time dateTime={value.toISOString()}>{text}</time>;
}
