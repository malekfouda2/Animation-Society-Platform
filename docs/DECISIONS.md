# Decisions and assumptions

Status as of 2 November 2026: no signed contract, settled amendments or provider selection has been supplied. Malek reports a Society Drive folder containing brand/card assets, but its URL and contents have not yet been supplied or inspected. Local engineering can begin with mocks/synthetic data. This does not confirm signature, payment receipt or commercial kickoff.

## Blocking decisions by implementation stage

| ID | Decision | Proposed temporary approach | Needed before |
| --- | --- | --- | --- |
| D01 | Society Drive URL and inspection of logos, identity and card templates | Request link/local copy; original provisional art allowed; no fabricated brand approval | Final branded design and card implementation |
| D02 | Membership types, prices, duration, eligibility and required fields | Synthetic explicitly marked demo plans | Production seed and membership acceptance |
| D03 | Gateway and merchant account capabilities | Provider adapter plus clearly marked development mock | Real sandbox integration |
| D04 | Manual versus recurring renewal | Build manual core and extension point; recurring is conditional included scope | Payment design freeze/live billing |
| D05 | Early/expired renewal, review, grace and reminder rules | Record proposed rules; test with synthetic values | Entitlement implementation acceptance |
| D06 | Hosting, email, storage, backup locations and remote access from Egypt | Local services/synthetic data | Any real data processing |
| D07 | QR public fields and verification privacy | Minimal status/member number; no contact fields | Public verification launch |
| D08 | Approved content/translations and entry quantities | Labeled sample copy | Content population and launch |
| D09 | Retention, deletion/export handling, consent and policy wording | Technical hooks; no invented retention periods | Real member onboarding |
| D10 | Free/honorary plans, if any | Do not infer them; define staff-issued entitlement only if requested | Plan-rule finalization |
| D11 | Refund/reversal/canceled subscriptions and overdue-payment policy | Reconcile and flag for review; never assume renewed entitlement | Live payments |
| D12 | Production domain, administrator contact and emergency access | Localhost/test inbox | Deployment |

The draft contract lists provisional annual membership fees (kept with the commercial notes outside the repository). They must not be seeded as approved production prices.

## Confirmed creative direction

Follow docs/DESIGN_BRIEF.md: artistic animation-specific design, meaningful interaction, frontend-design and UI/UX skills required for design tasks, original temporary artwork/animation with easy replacement, and Cinema Association as a conceptual reference only. These directions are confirmed by Malek; the asset URL and final visual approval remain pending.

## Proposed engineering decisions

TypeScript, npm workspaces, React via Next.js, Express API, MongoDB/Mongoose, secure server-side sessions, a Mongo-backed durable worker and protected file storage. These are recommendations; inspect existing code and confirm viable supported versions. Production hosting is not chosen. A single production host can be a modest launch option but is a single point of failure, not high availability. A replica set configuration enables transactions but alone does not establish resilience or backups.

## Open contract matters for Malek

The unresolved differences between the Society's draft contract and Malek's quotation are kept with the commercial notes outside this public repository. They are not accepted commitments. Do not add contractual promises to README, product screens, tickets or deployment settings. Ask Malek only when an unresolved decision affects the current task; proceed with independent work otherwise. Once a signed agreement is provided, reconcile it before production implementation of conflicting requirements.
