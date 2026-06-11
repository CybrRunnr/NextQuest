import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		// Steam art CDNs (game_metadata cover/header URLs)
		remotePatterns: [
			{ protocol: "https", hostname: "**.steamstatic.com" },
			{ protocol: "https", hostname: "**.akamaihd.net" },
		],
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
