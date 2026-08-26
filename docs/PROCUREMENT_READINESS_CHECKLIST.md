# Enterprise Procurement Readiness Checklist

## Product
- [x] Corporate roles and server-side RBAC
- [x] Organization/team structure
- [x] Assignments and deadlines
- [x] Baseline/final assessment
- [x] Manager dashboard
- [x] HR/L&D CSV exports
- [x] Audit trail
- [x] OIDC/PKCE architecture
- [x] SCIM provisioning
- [ ] Buyer-specific SSO integration tested with target IdP
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] English enterprise curriculum/content review

## Security / operations
- [x] API secrets kept server-side
- [x] Session revocation
- [x] Hashed passwords and session tokens
- [x] Tenant-scoped corporate queries
- [ ] Independent penetration test
- [ ] CI security scanning
- [ ] Production monitoring and alerting
- [ ] Backup/restore drill
- [ ] Formal incident contacts and escalation
- [ ] SOC 2 / ISO evidence if required

## Privacy / legal
- [ ] Privacy policy approved
- [ ] DPA approved
- [ ] Subprocessor list published
- [ ] Data-retention schedule approved
- [ ] Data-subject deletion/export workflow tested
- [ ] Regional legal review completed

Do not mark unchecked items as complete without operational or legal evidence.


## v9.1 production-hardening evidence
- [x] GitHub Actions quality gate for JavaScript/PWA/schema checks
- [x] Dependency update monitoring configuration (Dependabot)
- [x] Backend health and readiness endpoints
- [x] Keyboard/ARIA/reduced-motion accessibility baseline
- [ ] Independent WCAG 2.2 AA audit
- [ ] External uptime alerting configured in the production account
- [ ] Independent penetration test
