import Image from "next/image";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
	ActivityIcon,
	CalendarIcon,
	CalendarPlusIcon,
	CheckCircle2Icon,
	FlagIcon,
	LibraryIcon,
	PlayIcon,
	StarIcon,
	TrendingUpIcon,
	TrophyIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";

import { LocalTime } from "@/components/local-time";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData, type ActivityItem } from "@/server/dashboard";
import { cn } from "@/lib/utils";

import { BurnRateChart } from "./burn-rate-chart";

const STATUS_VERB: Record<string, { icon: typeof FlagIcon; before: string; after?: string }> = {
	proposed: { icon: FlagIcon, before: "proposed" },
	backlog: { icon: LibraryIcon, before: "moved", after: "to the backlog" },
	playing: { icon: PlayIcon, before: "started" },
	completed: { icon: TrophyIcon, before: "finished" },
	abandoned: { icon: XCircleIcon, before: "abandoned" },
	rejected: { icon: XCircleIcon, before: "rejected" },
};

function ActivityRow({ item }: { item: ActivityItem }) {
	if (item.kind === "event") {
		return (
			<li className="flex items-start gap-2.5 text-sm">
				<CalendarPlusIcon className="text-primary mt-0.5 size-4 shrink-0" />
				<span className="min-w-0">
					<span className="font-medium">{item.actor ?? "Someone"}</span> scheduled{" "}
					<span className="font-medium">{item.eventTitle}</span> for{" "}
					<LocalTime date={item.scheduledAt} withWeekday />
					<span className="text-muted-foreground block text-xs">
						{formatDistanceToNowStrict(item.at, { addSuffix: true })}
					</span>
				</span>
			</li>
		);
	}
	const verb = STATUS_VERB[item.toStatus] ?? STATUS_VERB.proposed;
	const Icon = verb.icon;
	return (
		<li className="flex items-start gap-2.5 text-sm">
			<Icon className="text-primary mt-0.5 size-4 shrink-0" />
			<span className="min-w-0">
				<span className="font-medium">{item.actor ?? "Someone"}</span> {verb.before}{" "}
				<span className="font-medium">{item.gameTitle}</span>
				{verb.after && ` ${verb.after}`}
				<span className="text-muted-foreground block text-xs">
					{formatDistanceToNowStrict(item.at, { addSuffix: true })}
				</span>
			</span>
		</li>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	detail,
	highlight,
}: {
	icon: typeof LibraryIcon;
	label: string;
	value: string;
	detail?: string;
	/** Nova: the headline metric (Completion) renders its value in the cyan accent. */
	highlight?: boolean;
}) {
	return (
		<Card className="py-4">
			<CardContent className="flex flex-col gap-1 px-5">
				<p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
					<Icon className="size-3.5" />
					{label}
				</p>
				<p className={cn("stat text-3xl font-semibold", highlight && "text-primary")}>{value}</p>
				{detail && <p className="text-muted-foreground text-xs">{detail}</p>}
			</CardContent>
		</Card>
	);
}

export default async function DashboardPage() {
	const { totals, burnRate, playing, upcomingEvents, activity, memberStats, completedEventCount } =
		await getDashboardData();
	const projection = burnRate.projectedCompletionDate
		? { label: format(new Date(burnRate.projectedCompletionDate), "MMM d") }
		: null;

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					{totals.gamesTotal === 0 ? (
						<>
							Nothing tracked yet —{" "}
							<Link href="/backlog" className="underline underline-offset-4">
								propose the first game
							</Link>
							.
						</>
					) : (
						"Group progress at a glance."
					)}
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={TrendingUpIcon}
					label="Completion"
					value={`${totals.completionPct}%`}
					detail={`${totals.completedPoints} of ${totals.totalPoints} points`}
					highlight
				/>
				<StatCard
					icon={CheckCircle2Icon}
					label="Games finished"
					value={String(totals.gamesCompleted)}
					detail={`of ${totals.gamesTotal} accepted`}
				/>
				<StatCard
					icon={LibraryIcon}
					label="In the backlog"
					value={String(totals.backlogCount)}
					detail={
						totals.unscoredCount > 0
							? `${totals.unscoredCount} still need scoring`
							: undefined
					}
				/>
				<StatCard
					icon={StarIcon}
					label="Burn rate"
					value={burnRate.weeklyRate !== null ? `${burnRate.weeklyRate}/wk` : "—"}
					detail={
						burnRate.projectedCompletionDate
							? `done ~${format(new Date(burnRate.projectedCompletionDate), "MMM d, yyyy")}`
							: "needs more completions"
					}
				/>
			</div>

			{/* Completion bar */}
			{totals.totalPoints > 0 && (
				<div
					className="bg-muted h-2 w-full overflow-hidden rounded-full"
					role="progressbar"
					aria-valuenow={totals.completionPct}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label="Backlog completion"
				>
					<div
						className="bg-primary h-full rounded-full transition-all"
						style={{ width: `${totals.completionPct}%` }}
					/>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Burn rate</CardTitle>
					<CardDescription>
						Cumulative completed points per week
						{projection && " — dashed line projects the current pace"}.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{burnRate.series.length > 0 ? (
						<BurnRateChart
							series={burnRate.series}
							totalPoints={totals.totalPoints}
							projection={projection}
						/>
					) : (
						<p className="text-muted-foreground py-8 text-center text-sm">
							The chart appears once the group completes its first game.
						</p>
					)}
				</CardContent>
			</Card>

			{upcomingEvents.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-medium tracking-wide uppercase">Next sessions</h2>
					<div className="grid gap-4 sm:grid-cols-3">
						{upcomingEvents.map((event) => (
							<Link key={event.id} href="/events">
								<Card className="hover:border-primary/50 h-full py-4 transition-colors">
									<CardContent className="flex flex-col gap-1 px-5">
										<p className="flex items-center gap-1.5 truncate text-sm font-semibold">
											<CalendarIcon className="text-primary size-3.5 shrink-0" />
											{event.title}
										</p>
										<p className="text-muted-foreground text-xs">
											<LocalTime date={event.scheduledAt} withWeekday />
											{event.location && ` · ${event.location}`}
										</p>
										<p className="text-muted-foreground flex items-center gap-1 text-xs">
											{event.gameTitle && <span className="truncate">{event.gameTitle}</span>}
											<span className="ml-auto flex shrink-0 items-center gap-1">
												<UsersIcon className="size-3" />
												{event.yesCount} in
											</span>
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>
			)}

			{playing.length > 0 && (
				<section className="flex flex-col gap-3">
					<h2 className="text-sm font-medium tracking-wide uppercase">Now playing</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{playing.map((game) => (
							<Card key={game.id} className="overflow-hidden py-0">
								<div className="flex items-center gap-4 pr-5">
									{game.art ? (
										<div className="relative h-20 w-40 shrink-0">
											<Image
												src={game.art}
												alt={game.title}
												fill
												className="object-cover"
												sizes="160px"
											/>
										</div>
									) : (
										<div className="bg-muted h-20 w-40 shrink-0" />
									)}
									<div className="min-w-0 py-3">
										<p className="truncate text-sm font-semibold">{game.title}</p>
										<div className="mt-1 flex items-center gap-2">
											{game.points !== null && (
												<Badge variant="secondary" className="gap-1">
													<StarIcon className="size-3" />
													{game.points} pts
												</Badge>
											)}
											{game.startedAt && (
												<span className="text-muted-foreground text-xs">
													started {formatDistanceToNowStrict(game.startedAt, { addSuffix: true })}
												</span>
											)}
										</div>
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			<div className="grid items-start gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ActivityIcon className="size-4" />
							Recent activity
						</CardTitle>
					</CardHeader>
					<CardContent>
						{activity.length === 0 ? (
							<p className="text-muted-foreground text-sm">Nothing has happened yet.</p>
						) : (
							<ul className="flex flex-col gap-3">
								{activity.map((item, index) => (
									<ActivityRow key={index} item={item} />
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UsersIcon className="size-4" />
							Members
						</CardTitle>
						<CardDescription>
							Proposals made and sessions attended
							{completedEventCount > 0 && ` (of ${completedEventCount} held)`}.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="divide-y">
							{memberStats.map((member) => (
								<li key={member.id} className="flex items-center gap-3 py-2 text-sm">
									<span className="min-w-0 flex-1 truncate font-medium">{member.name}</span>
									<span className="text-muted-foreground text-xs">
										{member.proposals} proposed
									</span>
									<span className="text-muted-foreground text-xs">
										{completedEventCount > 0
											? `${member.sessionsAttended}/${completedEventCount} sessions`
											: "no sessions yet"}
									</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
