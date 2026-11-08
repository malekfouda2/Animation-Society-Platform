Read CLAUDE.md and every document it references. Inspect the existing repository before making changes.

Implement Stage 1 from docs/PLAN.md only. First give a short outline of the folder structure, chosen supported package versions and any conflicts with existing code, then proceed with the reversible local work.

Use the proposed TypeScript MERN architecture: Next.js as the React frontend, Express as the business API, MongoDB/Mongoose and npm workspaces. If existing code makes a different React setup preferable, explain that before changing it. Do not replace Express or MongoDB.

Create the workspace, validated environment examples, health/readiness endpoints, local transaction-capable MongoDB setup, bilingual /ar and /en layout shells, shared contracts structure, and working development/lint/typecheck/build commands. Add a basic CI definition using those real commands. Before UI work, use available frontend-design and UI/UX skills and follow docs/DESIGN_BRIEF.md. Inspect the Society Drive/local assets if supplied; otherwise record the missing URL. Build a provisional shell using editable tokens until the art direction is reviewed. Do not establish a generic template as the final design. Use clearly labeled sample content. Keep credentials out of files and logs.

Do not implement full authentication, payments, recurring billing or future-phase modules yet. Record unresolved provider and business decisions; they do not block the independent foundation work. Do not buy services, push to a remote repository or deploy.

Run the checks you can run. If Docker or another dependency is unavailable, document the failure and the exact next step; never pretend the database or tests worked. Verify both language routes and responsive shell if browser tooling is available; otherwise mark visual inspection pending.

Update docs/PROGRESS.md. Finish with what works, how I run it, actual checks/results, unresolved issues and the proposed Stage 2 task. Stop after Stage 1 so I can review the foundation.
