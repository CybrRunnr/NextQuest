import type { Metadata } from "next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pending approval" };

// TODO(Phase 1): unapproved members land here after sign-in; middleware
// keeps them out of the rest of the app until an admin approves them.
export default function PendingApprovalPage() {
	return (
		<div className="mx-auto flex max-w-sm flex-col gap-6 pt-16">
			<Card>
				<CardHeader>
					<CardTitle>Hang tight</CardTitle>
					<CardDescription>
						Your account is waiting for an admin to approve it. Pester them in the group
						chat.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	);
}
