"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2Icon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
	{ href: "/", label: "Dashboard" },
	{ href: "/backlog", label: "Backlog" },
	{ href: "/vote", label: "Vote" },
	{ href: "/events", label: "Events" },
];

export function SiteNav() {
	const pathname = usePathname();

	return (
		<header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
				<Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
					<Gamepad2Icon className="size-5 text-primary" />
					stooge-log
				</Link>
				<nav className="flex items-center gap-1 text-sm">
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={cn(
								"rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
								pathname === link.href && "bg-accent text-accent-foreground"
							)}
						>
							{link.label}
						</Link>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
