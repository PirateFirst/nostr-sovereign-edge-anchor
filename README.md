# nostr-sovereign-edge-anchor
Local-first continuity primitives for sovereign authors.
This system provides cryptographic proof-of-existence, explicit availability signaling,
and controlled edge-based serving of local markdown files using Nostr events.

It is not a hosting platform.
It does not store content on relays.
It does not accept user uploads.
It does not provide anonymity services.
## Stability Covenant

This repository defines a minimal, auditable continuity primitive.

Future changes will:
- Preserve fail-closed behavior
- Never introduce content storage on relays
- Never auto-activate stewardship
- Never remove author revocation authority

Breaking changes require a new major version.
