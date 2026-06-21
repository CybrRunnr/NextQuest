import { CalendarCheckIcon, CheckIcon, HelpCircleIcon, XIcon } from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { closePoll, createEventFromSlot, respondToSlot } from "@/server/availability";

export type PollSlot = {
	id: string;
	startsAt: Date;
	endsAt: Date;
	responses: { userId: string; name: string; response: "yes" | "no" | "if_need_be" }[];
};

export type PollWithSlots = {
	id: string;
	title: string;
	status: "open" | "closed";
	creatorName: string | null;
	scheduled: boolean;
	slots: PollSlot[];
};

function slotScore(slot: PollSlot) {
	const yes = slot.responses.filter((r) => r.response === "yes").length;
	const ifNeedBe = slot.responses.filter((r) => r.response === "if_need_be").length;
	return yes * 2 + ifNeedBe;
}

export function PollCard({
	poll,
	currentUserId,
}: {
	poll: PollWithSlots;
	currentUserId: string;
}) {
	const open = poll.status === "open";
	const bestScore = Math.max(...poll.slots.map(slotScore), 0);

	return (
		<Card>
			<CardContent className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-display text-base font-semibold">{poll.title}</h3>
					{poll.scheduled ? (
						<Badge className="gap-1">
							<CalendarCheckIcon className="size-3" />
							scheduled
						</Badge>
					) : (
						!open && <Badge variant="outline">closed</Badge>
					)}
					{poll.creatorName && (
						<span className="text-muted-foreground text-xs">by {poll.creatorName}</span>
					)}
					{open && (
						<form action={closePoll.bind(null, poll.id)} className="ml-auto">
							<Button size="sm" variant="ghost">
								Close poll
							</Button>
						</form>
					)}
				</div>

				<div className="flex flex-col gap-2">
					{poll.slots.map((slot) => {
						const mine = slot.responses.find((r) => r.userId === currentUserId)?.response;
						const yes = slot.responses.filter((r) => r.response === "yes");
						const ifNeedBe = slot.responses.filter((r) => r.response === "if_need_be");
						const leading = open && bestScore > 0 && slotScore(slot) === bestScore;
						return (
							<div
								key={slot.id}
								className={cn(
									"flex flex-col gap-2 rounded-lg border p-3",
									leading && "border-primary/60"
								)}
							>
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<span className="font-medium">
										<LocalTime date={slot.startsAt} withWeekday /> –{" "}
										<LocalTime date={slot.endsAt} timeOnly />
									</span>
									{leading && <Badge variant="secondary">leading</Badge>}
									{open && (
										<form action={createEventFromSlot.bind(null, slot.id)} className="ml-auto">
											<Button size="sm" variant={leading ? "default" : "outline"}>
												Schedule this
											</Button>
										</form>
									)}
								</div>
								<div className="text-muted-foreground text-xs">
									{yes.length > 0 && (
										<span>
											<span className="text-foreground font-medium">
												free ({yes.length}):
											</span>{" "}
											{yes.map((r) => r.name).join(", ")}
										</span>
									)}
									{ifNeedBe.length > 0 && (
										<span>
											{yes.length > 0 && " · "}
											if need be: {ifNeedBe.map((r) => r.name).join(", ")}
										</span>
									)}
									{yes.length === 0 && ifNeedBe.length === 0 && "no takers yet"}
								</div>
								{open && (
									<div className="flex items-center gap-2">
										<form action={respondToSlot.bind(null, slot.id, "yes")}>
											<Button size="sm" variant={mine === "yes" ? "default" : "outline"}>
												<CheckIcon />
												Free
											</Button>
										</form>
										<form action={respondToSlot.bind(null, slot.id, "if_need_be")}>
											<Button size="sm" variant={mine === "if_need_be" ? "default" : "outline"}>
												<HelpCircleIcon />
												If need be
											</Button>
										</form>
										<form action={respondToSlot.bind(null, slot.id, "no")}>
											<Button size="sm" variant={mine === "no" ? "default" : "outline"}>
												<XIcon />
												Busy
											</Button>
										</form>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
