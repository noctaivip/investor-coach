# Investor Coach — Enterprise Security Overview

Version: 9.0

This document describes controls implemented in the supplied codebase. It is **not** a SOC 2, ISO 27001, penetration-test, or regulatory certification.

## Identity and access
- Roles: admin, manager, learner.
- OIDC Authorization Code + PKCE foundation.
- Server-side validation of OIDC issuer, audience, expiry, nonce and JWKS signature.
- SCIM 2.0 user provisioning/deactivation.
- Passwords are PBKDF2-SHA256 hashed with per-user salt.
- Session tokens are stored server-side only as SHA-256 hashes.
- Admin can revoke another user's active sessions.

## Authorization
- Corporate APIs enforce server-side role checks.
- Managers receive reporting/assignment permissions but cannot manage SSO, SCIM, roles or audit.
- Audit export is admin-only.

## Secrets
- OpenAI and OIDC client secrets must be Cloudflare Worker secrets.
- SCIM raw bearer tokens are shown once; only their SHA-256 hashes are persisted.

## Data boundaries
- Each corporate query is scoped by organization ID.
- Learning-state synchronization is tied to authenticated user ID.
- CSV exports contain organization learning/assignment metadata; no audio files are included by the reporting endpoints.

## Audit
The application records selected security and administrative events including login, logout, membership changes, assignments, role changes, session revocation, SSO/SCIM changes and report exports.

## Still required before large-enterprise production
- Independent penetration test.
- Formal SDLC/change-control process.
- Managed backups and tested restore procedure.
- Centralized runtime monitoring/alerting.
- Vulnerability/dependency scanning in CI.
- Documented incident-response ownership and contacts.
- Legal/privacy review for target jurisdictions.
- Evidence program for SOC 2 / ISO 27001 if required by buyer.
