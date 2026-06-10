import type { Metadata } from "next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
			<Card>
				<CardHeader>
					<CardTitle>Coming in Phase 1</CardTitle>
					<CardDescription>
						Approve or reject pending members and manage admin roles.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	);
}
