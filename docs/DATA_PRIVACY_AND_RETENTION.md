# Data Privacy and Retention Baseline

This is an implementation baseline, not legal advice.

## Data categories
The platform may process:
- corporate identity: name, work email, role, organization;
- authentication/session metadata;
- learning progress and assessment scores;
- assignments and deadlines;
- audit events;
- voice/audio only when the user explicitly records an answer and sends it to the configured transcription backend.

## Current code behavior
- Browser learning progress can exist locally and can be synchronized to the corporate backend after login.
- Corporate records are stored in Cloudflare D1 when that backend is deployed.
- AI API credentials are not placed in browser code.
- Reporting CSV endpoints do not export recorded audio.

## Enterprise deployment decisions that must be configured by the operator
Before production procurement, define:
1. retention period for inactive users and audit records;
2. deletion/export process for a data-subject request;
3. geography/data-residency requirements;
4. list of subprocessors;
5. whether voice input is permitted for the organization;
6. legal basis and notices applicable to employees;
7. backup retention and deletion behavior.

## Recommended defaults for a pilot
- learner records: duration of pilot + 90 days unless contract requires otherwise;
- expired sessions: delete automatically;
- SCIM-deactivated employees: revoke access immediately and apply contractual retention;
- audio: avoid persistent storage unless specifically required.
