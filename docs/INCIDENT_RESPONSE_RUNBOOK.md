# Incident Response Runbook — Baseline

This runbook is intended for a corporate pilot and must be assigned to named owners before production.

## Severity
- SEV-1: confirmed unauthorized access to customer data or authentication compromise.
- SEV-2: material service/security degradation without confirmed data exposure.
- SEV-3: limited issue with low customer impact.

## Immediate response
1. Preserve timestamps, request IDs and relevant audit events.
2. Revoke affected sessions/tokens.
3. Rotate compromised Worker secrets.
4. Disable SSO/SCIM integration if it is the suspected entry point.
5. Restrict affected endpoint if necessary.
6. Determine affected organizations/users and data categories.
7. Record actions and evidence.

## Recovery
- Fix root cause.
- Verify authorization boundaries and regression tests.
- Restore service gradually.
- Monitor for recurrence.

## Post-incident
- Timeline and root-cause analysis.
- Corrective actions with owners/deadlines.
- Customer/legal notification according to contract and applicable law.
- Update tests and this runbook.

The codebase alone does not provide a 24/7 security operations function; operational ownership must be established by the deploying organization.
