import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getDb, schema } from "@/db";

type AuthEnv = {
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
};

// Build the auth instance per request: secrets live on the Cloudflare env
// binding, which is only available inside a request context.
// Schema changes here (plugins, additionalFields) must be mirrored in
// src/db/schema/auth.ts — regenerate with `npx @better-auth/cli generate`
// and reconcile rather than hand-drifting.
export function getAuth() {
	const { env } = getCloudflareContext();
	const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } =
		env as AuthEnv;

	return betterAuth({
		database: drizzleAdapter(getDb(), {
			provider: "pg",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		secret: BETTER_AUTH_SECRET,
		baseURL: BETTER_AUTH_URL,
		socialProviders: {
			google: {
				clientId: GOOGLE_CLIENT_ID ?? "",
				clientSecret: GOOGLE_CLIENT_SECRET ?? "",
			},
		},
		user: {
			additionalFields: {
				role: {
					type: "string",
					defaultValue: "member",
					input: false,
				},
				status: {
					type: "string",
					defaultValue: "pending",
					input: false,
				},
			},
		},
	});
}

export type Auth = ReturnType<typeof getAuth>;
