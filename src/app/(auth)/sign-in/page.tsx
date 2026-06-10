import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

// TODO(Phase 1): wire to authClient.signIn.social({ provider: "google" })
// and redirect approved members to the dashboard, pending ones to
// /pending-approval.
export default function SignInPage() {
	return (
		<div className="mx-auto flex max-w-sm flex-col gap-6 pt-16">
			<Card>
				<CardHeader>
					<CardTitle>Sign in</CardTitle>
					<CardDescription>
						Sign in with Google to join the group. New accounts need admin approval.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button className="w-full" disabled>
						Continue with Google (Phase 1)
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
