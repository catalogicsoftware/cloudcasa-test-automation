# Specs — Test Plans for Automation

Markdown test plans consumed by the `playwright-test-planner` / `playwright-test-generator` agents.
Compiled from CloudCasa documentation (docs.cloudcasa.io), live exploration of the staging UI
(`ui.staging.cloudcasa.io`, 2026-07-09) and a **support-ticket analysis (Jira)** of the areas causing
the most customer pain.

## Priority legend

| Mark | Priority     | Meaning                                                                                 |
| ---- | ------------ | --------------------------------------------------------------------------------------- |
| 🔴   | **CRITICAL** | Core value / security path or a proven customer-pain area. Automate first; smoke suite. |
| 🟡   | High         | Important feature behavior; automate second.                                            |
| ⚪   | Medium       | Validation, filters, persistence details.                                               |
| 🟢   | Low          | Render/smoke checks of secondary pages.                                                 |

## Status legend

Every `TC-*` heading in a plan ends with its status: `## TC-XXX-001 — title 🔴 CRITICAL — ⬜ To automate`.

| Mark | Status      | Meaning                                                                                |
| ---- | ----------- | -------------------------------------------------------------------------------------- |
| ✅   | Automated   | Fully covered; the `**Test:**` line under the heading points to the spec file.         |
| 🟨   | Partial     | Some steps covered; the `**Test:**` line names what is covered and what is not.        |
| ⬜   | To automate | No test yet. A `[needs …]` marker in the title means infrastructure is required first. |

**Coverage: 29 of 73 cases touched** — 23 ✅, 6 🟨, 44 ⬜.
(73 = every `TC-*` heading; TC-AUTH-001/002 are cross-references to TC-NAV-002/003, so 71 are distinct.)
Written test files: 31. Twelve of them cover login / password reset / sign-up cases tracked as a flat list
in [auth/auth.md](auth/auth.md#already-automated-) instead of `TC-*` IDs; the rest are TC-AUTH-004,
TC-USR-002, TC-USR-005, TC-NAV-003, TC-NAV-005, TC-DASH-003, TC-AUTH-007/003 (one file), the five
storage tests carrying TC-STG-001/002/003/004/007/009/011, TC-CL-002/003/005/007 (one file), and
TC-CA-001/002 (one file).

## Customer-driven priorities (from support tickets)

1. **Backup/Object Storage "Add + Validate" wizard** — ~16 tickets (CC-763, CC-659→663, CC-770, CC-646,
   CC-701, CC-607, CC-499, CC-516, CC-689). Blocks the first backup for trials/POCs.
   → [configuration/storage.md](configuration/storage.md): TC-STG-001…005 critical.
2. **Cluster-agent install flow from the dashboard** — 4 tickets (CC-549/550/551, CC-811): generated YAML
   missing `imagePullSecret`, image tag not in registry.
   → [clusters/clusters.md](clusters/clusters.md): ~~TC-CL-008~~ ✅ manifest contract test.
3. **Login / org-visibility / session** — ~6 tickets (CC-590 login loop, CC-474 identity mixup,
   CC-651/652/655/724 org not visible after invite).
   → [auth/auth.md](auth/auth.md) TC-AUTH-007; [configuration/user-management.md](configuration/user-management.md) TC-USR-005, TC-USR-006.

## Plans

| File                                                                         | Area                                                | Cases | Status                            | Critical cases                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------- | ----- | --------------------------------- | ------------------------------------------------------------------------------- |
| [configuration/storage.md](configuration/storage.md)                         | **Backup storage add/validate (top customer pain)** | 11    | ✅ 3/11, 🟨 4                     | TC-STG-001 🟨, TC-STG-002 🟡 Blocked, TC-STG-003 🟨, TC-STG-004 🟨, TC-STG-005† |
| [auth/auth.md](auth/auth.md)                                                 | Sign In / Sign-Up — coverage map + gaps             | 7     | ✅ 4/7 (+12 tests without TC-IDs) | ~~TC-AUTH-007~~ ✅                                                              |
| [navigation/navigation.md](navigation/navigation.md)                         | App shell, user menu, logout, route guards          | 8     | ✅ 6/8                            | TC-NAV-001, ~~TC-NAV-002~~ ✅, ~~TC-NAV-003~~ ✅                                |
| [dashboard/dashboard.md](dashboard/dashboard.md)                             | Dashboard widgets, jobs tabs, shortcuts, help modal | 7     | ✅ 5/7                            | ~~TC-DASH-001~~ ✅, ~~TC-DASH-003~~ ✅                                          |
| [clusters/clusters.md](clusters/clusters.md)                                 | Clusters list, Add Cluster dialog, install manifest | 8     | ✅ 5/8                            | —                                                                               |
| [clusters/backups-restores.md](clusters/backups-restores.md)                 | Backup wizard, restores, recovery points            | 8     | ✅ 1/8                            | TC-BAK-001, TC-BAK-002†, TC-BAK-003†, TC-RST-001†                               |
| [configuration/policies.md](configuration/policies.md)                       | Policy CRUD                                         | 6     | ✅ 6/6                            | ~~TC-POL-001~~ ✅                                                               |
| [configuration/user-management.md](configuration/user-management.md)         | Users, invitations, roles, API keys, org scoping    | 9     | ✅ 1/9, 🟨 1                      | ~~TC-USR-002~~ ✅, TC-USR-005 🟨, TC-USR-006                                    |
| [configuration/cloud-accounts-misc.md](configuration/cloud-accounts-misc.md) | Cloud accounts, audit logs, settings, hooks         | 6     | ✅ 2/6, 🟨 1                      | —                                                                               |
| [reports/reports.md](reports/reports.md)                                     | Reports, Databases & DR smoke                       | 4     | ⬜ 0/4                            | —                                                                               |

`†` — needs a live connected Kubernetes cluster. For TC-STG-005 that is what runs the asynchronous
storage validation: with zero clusters the storage stays at `validate_state: VALIDATING` forever.

S3 targets are no longer a blocker: the catalog in `data/storage.ts` holds one entry per target and the
happy-path test generates one run per entry, so adding MinIO is a catalog entry plus a CI credential pair.

## Recommended automation order

Done items are struck through; keep this list in sync when a case flips to ✅.

1. **Customer-pain critical (no infra):** ~~TC-STG-001, TC-STG-002~~ 🟨, ~~TC-CL-008~~ ✅, ~~TC-AUTH-007~~ ✅, TC-USR-005 (🟨 — finish steps 3–7), TC-USR-006
2. **Smoke / critical suite:** ~~TC-DASH-001~~ ✅, ~~TC-DASH-003~~ ✅, TC-NAV-001, ~~TC-NAV-002~~ ✅, ~~TC-NAV-003~~ ✅, ~~TC-CL-002~~ ✅, TC-BAK-001, TC-POL-001, ~~TC-USR-002~~ ✅
3. **Infra-enabled critical:** ~~TC-STG-003~~ 🟨 and ~~TC-STG-009~~ ✅ run against the staging AWS bucket,
   ~~TC-STG-011~~ ✅ against the Azure storage account, and a second S3 target (DataCore) is in the catalog;
   dedicated staging k8s cluster → TC-STG-005,
   ~~TC-CL-003~~ ✅, TC-BAK-002/003, TC-RST-001
4. **High → Medium → Low** per the marks inside each plan
