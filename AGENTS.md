# Community frontend

- This public repository preserves the history of nagisanzenin/truanayangi, transferred with Walter's explicit authorization on 2026-09-10.
- Keep community participation open: welcome issues and fork PRs to `main` in Vietnamese or English, including draft PRs. Do not require a prior approved issue, internal ticket, enterprise membership, organization invitation, estimates, project boards, mandatory templates or multiple approvals.
- Maintainers review changes before merging and may help contributors with checks proportional to the change. Keep repository settings and contribution guidance community-friendly; enterprise-only policies belong to the private repositories.
- Current code is a standalone local frontend. No backend, OAuth/login, production API clients, cloud credentials or infrastructure state.
- Use pnpm, compatible current stable packages and committed lockfiles. Build locally; do not add Entire, GitHub Projects or a CI pipeline for MVP.
- Store preferences in bounded, versioned, host-only cookies. Validate imported/untrusted values and handle unavailable/full storage visibly.
- Keep two counters distinct: the completed-open count in bounded, versioned, host-only cookies is browser-local; the Redis-backed completed-open count is shared by clients of this same local app server and may be labeled server-wide, never as a hosted/community deployment metric.
- Exception to the local-frontend restriction: this app may use one Node.js Route Handler and one server-only Redis client configured by the server-only `REDIS_URL` environment variable solely for the `toinaylogi:opens` server-wide counter. Do not expose Redis credentials to the browser or add any other backend/database integration.
- truanayangi.com remains on Cloudflare + GCP using three private repositories. Never point its DNS to GitHub Pages.
- Retain source and asset attribution. Historical code does not define the current deployment.

- GitHub Pages redirects to https://truanayangi.com/ by explicit request. Publish only pages-redirect/ to gh-pages; keep the standalone application source in main.

- This app is for local use: bind dev/preview to loopback, use cookie-only automatic preference persistence, and do not add login, account screens, backend endpoints or database clients beyond the explicitly approved local Redis counter, or hosted-demo deployment. Only user-clicked external links may leave the local app; background asset loads stay local.

- Commit rule: Follow `rules/commit_rule.md`. Keep commit messages concise, and never include detailed edits or sensitive/adult keywords from modified source files in commit messages.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
