# CI — Jenkins + Docker

Runs the CloudCasa Playwright suite inside a container on a Jenkins worker.

## Files

| File               | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `Dockerfile`       | Test image (official Playwright image + `npm ci`)               |
| `Jenkinsfile`      | Declarative pipeline: build image → run tests → publish reports |
| `../.dockerignore` | Trims the docker build context (repo root)                      |

## How it works

Two stages on one node (`agent any`, so they share a workspace). **Build image** runs
`docker.build(env.TEST_IMAGE, '-f ci/Dockerfile .')` from the repo root; **Run tests**
then does `docker.image(env.TEST_IMAGE).inside('--ipc=host') { ... }` and runs its `sh`
steps inside that container. `CI=true` activates the CI branch of
`playwright.config.ts` (headless, `retries: 2`, `workers: 2`).

The image is handed over by tag, not by object: `TEST_IMAGE` is a pipeline-level
`environment` entry because a `docker.build()` return value cannot cross a stage
boundary, and the `post` block needs the same name again. `.inside()` runs
`docker inspect` before any `docker pull`, so a locally built tag is found without
touching a registry, and `disableConcurrentBuilds()` keeps two builds off the same tag.

`--ipc=host` is required once `workers` is above 1: Docker gives a container 64 MB
of `/dev/shm` by default, which is enough for a single Chromium and makes parallel
ones crash with unhelpful renderer errors (`--shm-size=1gb` is the alternative).

`workers` is deliberately low rather than "number of cores": every test logs in as
the same CloudCasa account (`CC_EMAIL`), so parallel workers share that account's
server-side state — organization membership, pending invites. Per-file testmail
tags and self-healing invite cleanup keep the current suite independent, but
raising this further needs the same check for whatever tests exist by then.

This intentionally does **not** use the declarative `agent { dockerfile { ... } }`
sugar — see the first two Troubleshooting entries below for why.

**Build image** starts by deleting `allure-results/`, `playwright-report/` and
`test-results/` **on the node, before the image is built**. The workspace is
reused between builds, and `allure-playwright` appends rather than replaces, so
without this a build would publish its whole accumulated history as one run.
Doing it before the build rather than inside the container also means that a
stage which dies early (image build, credentials, mount) leaves nothing behind
for the `post` block to publish as this build's results.

## Jenkins prerequisites

- **Docker** available on the agent (the pipeline shells out to `docker build` / `docker run`).
- **`curl`** available on the node (used to publish to Allure and Nexus and to post the Teams card).
- **Network access from the node** to the Allure host (`ALLURE_URL`) and Nexus.
- **Outbound HTTPS from the node** to `*.testmo.net` and to the Teams webhook's own host —
  read it out of the `teams-webhook-url` credential rather than assuming, because Power
  Automate issues these on both `*.logic.azure.com` and `*.api.powerplatform.com` depending
  on the tenant. Every other integration talks inward only, so these are the paths that may
  need the corporate proxy.
- A pipeline job pointed at this repo with **Script Path** = `ci/Jenkinsfile`.

## Publish target variables

The four publish targets are each switched on or off through environment variables —
the `Jenkinsfile` holds no addresses, so moving a host or switching a project is a
Jenkins change, not a commit and a push.

Set them in _Manage Jenkins → System → **Global properties** → Environment
variables_. Node properties override those per agent. Folder-scoped variables
need the Folder Properties plugin **and** a `withFolderProperties { }` wrapper in
the pipeline, so they are not a drop-in alternative here — on a controller shared
with jobs that use these names, prefix them instead.

| Variable             | What it is                                                      | Value in use                            |
| -------------------- | --------------------------------------------------------------- | --------------------------------------- |
| `ALLURE_URL`         | Allure Docker Service root, no trailing slash                   | `http://cc-allure.ad.catalogic.us:5050` |
| `ALLURE_PROJECT_ID`  | Allure project — must stay stable, it carries the trend history | `cloudcasa-e2e`                         |
| `NEXUS_URL`          | Nexus root, no trailing slash                                   | `https://cc-nexus.ad.catalogic.us`      |
| `NEXUS_REPORTS_REPO` | `raw (hosted)` repo the report tree is PUT into                 | `cloudcasa-test-reports`                |
| `TESTMO_URL`         | Testmo Cloud tenant                                             | not provisioned yet                     |
| `TESTMO_PROJECT_ID`  | numeric Testmo project id, from the project's URL               | not provisioned yet                     |
| `TEAMS_NOTIFY`       | `true` enables the Teams card; anything else switches it off    | `true`                                  |

The Testmo tenant and project do not exist yet, so those two stay unset and that
step stays off; `TESTMO_URL` takes the form `https://<tenant>.testmo.net`.

**An unset variable switches its step off**, which is also the kill switch: clear
`TESTMO_URL` in Jenkins and the submit stops without touching the repo. The three
targets with a variable pair need both of theirs, so a half-filled pair skips rather
than failing against an incomplete address. Values are trimmed and any trailing slash
is dropped, so a stray one is not an outage.

Teams is the one target whose address is **not** here: the Workflows webhook URL embeds a
signature token, so it is a credential (`teams-webhook-url`), and `TEAMS_NOTIFY` is the
separate non-secret switch. Both are required — the credential alone does nothing.

Nexus is the exception: unsetting it does not stop publishing, it redirects to
archiving `playwright-report/**` + `test-results/**` **on the controller** — which
is the one thing the rest of this setup avoids. Turning Nexus off entirely means
deleting that branch of the `post` block.

What the console prints when a step is off:

```
ALLURE_URL / ALLURE_PROJECT_ID not set in Jenkins — skipping the Allure publish.
NEXUS_URL / NEXUS_REPORTS_REPO not set in Jenkins. Falling back to archiving on the controller so reports are not lost during setup.
TESTMO_URL / TESTMO_PROJECT_ID not set in Jenkins — skipping the Testmo submit.
TEAMS_NOTIFY not set to true in Jenkins — skipping the Teams notification.
```

The "value in use" column exists so a fresh controller can be brought up without
archaeology — it is not read by anything, so treat Jenkins as the source of truth
if the two disagree.

## Required credentials

Create each as a **Secret text** credential in Jenkins
(_Manage Jenkins → Credentials_); the ID is referenced in the `withCredentials([...])`
block of the `Jenkinsfile`. Current IDs used:

| Env var               | Jenkins credential ID          |
| --------------------- | ------------------------------ |
| `BASE_URL`            | `cloudcasa-base-url`           |
| `CC_EMAIL`            | `cloudcasa-cc-email`           |
| `CC_PASSWORD`         | `cloudcasa-cc-password`        |
| `TESTMAIL_NAMESPACE`  | `cloudcasa-testmail-namespace` |
| `TESTMAIL_API_KEY`    | `cloudcasa-testmail-api-key`   |
| `CLOUDCASA_API_URL`   | `cloudcasa-api-url`            |
| `CLOUDCASA_API_TOKEN` | `cloudcasa-api-token`          |
| `TESTMAIL_API_URL`    | `cloudcasa-testmail-api-url`   |

`TESTMAIL_API_URL` is required, despite `.env.example` documenting a default
value — `utils/testmail.ts` reads `process.env.TESTMAIL_API_URL` directly with
no fallback, so outside local dev (where a real `.env` file supplies it) it
must be provided explicitly, e.g. via this credential. Confirmed by a live
run: every testmail-dependent test failed with `TypeError: Failed to parse
URL from undefined?apikey=...` until this credential was added.

Five more credentials are used by the publish steps in the `post` block. The
Allure, Nexus and Teams ones run on the node; the Testmo one runs inside the test
image, which is why its key needs the `IN_*` indirection described under Troubleshooting.
Two are **Username with password**, one a **Secret file** and two **Secret text**:

| Credential ID       | Kind            | What it is                                                                                                                |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `allure-creds`      | user/password   | the Allure service admin user (`SECURITY_USER` / `SECURITY_PASS` from its `.env`) — must contain no `"` or `\`, see below |
| `nexus-creds`       | user/password   | a Nexus account with **write** access to the reports repo                                                                 |
| `internal-ca-cert`  | **Secret file** | PEM of the internal root CA that signed the Nexus certificate                                                             |
| `testmo-token`      | Secret text     | Testmo API key with write access for automation runs                                                                      |
| `teams-webhook-url` | Secret text     | Power Automate Workflows webhook URL for the target Teams channel                                                         |

`allure-creds` has one constraint: the Allure login body is a JSON document built
with `printf` in the `post` block, so a password containing `"` or `\` produces
invalid JSON and every login fails with a misleading 400. Escaping it properly
would mean four levels of quoting (Groovy → shell → sed → JSON) in code no test
covers, so the constraint is documented rather than handled. Any other character
is fine — the value never reaches an argument list or the disk.

`internal-ca-cert` is needed because Nexus is served over HTTPS with a
certificate chain rooted in the corporate (AD) CA, which the agents don't trust
out of the box — without it the upload dies with `curl: (60) SSL certificate
problem: self-signed certificate in certificate chain`. It is passed to `curl`
as `--cacert`, so no change to the node's system trust store is required, and
verification stays on. The certificate itself is public material; Secret file is
just a convenient way to get it onto the node. Extract the root (the last
certificate in the chain) with:

```bash
openssl s_client -connect cc-nexus.ad.catalogic.us:443 -showcerts </dev/null
```

Alternatively, install that root into the node's trust store
(`/usr/local/share/ca-certificates/` + `update-ca-certificates`) and drop the
`--cacert` flag — that fixes every HTTPS call from the agent, but needs root on
the host.

### Creating the Teams webhook

In the target channel: **⋯ → Workflows → "Post to a channel when a webhook request is
received"**, pick the team and channel, and copy the URL it generates. Store it as the
`teams-webhook-url` Secret text credential. The host varies by tenant — older flows are on
`prod-NN.<region>.logic.azure.com`, newer ones on
`<env>.<region>.environment.api.powerplatform.com` — so the path in it, not the host, is what
identifies it: `/triggers/manual/paths/invoke` with an `sp`, `sv` and `sig` query string. The
`sig` is what makes the whole URL a secret.

Paste it with no trailing newline or space. The `post` block hands it to `curl` through a config
on stdin without trimming — trimming it would mean materialising the secret in Groovy — so stray
whitespace produces a malformed config and a `Teams notification failed: ...` UNSTABLE rather
than a request. Same class of constraint as the `allure-creds` password above.

This is deliberately **not** the old _Connectors → Incoming Webhook_ route: Microsoft retired
Office 365 connector webhooks in 2025, and the two take different payloads — connectors take a
`MessageCard`, Workflows takes a Teams message envelope wrapping an Adaptive Card, which is what
the `post` block sends.

The endpoint answers `202 Accepted` before the flow renders the card, so a `202` is not proof the
message arrived. When a card is missing but the build log says the notification was sent, check
the flow's run history in Power Automate.

## Reports

Four publish targets, all off the controller:

| Target                                  | What it is                                                     | Renders?                  |
| --------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| **Allure Docker Service** on its own VM | the browsable report + cross-build trend history               | Yes                       |
| **Nexus `raw` repo**                    | the Playwright HTML report kept as a plain file store          | No — nginx CSP, see below |
| **Testmo Cloud**                        | automation run history and team-facing reporting               | Yes — Testmo's own UI     |
| **Teams channel**                       | one card per build with the link to that build's Allure report | Yes — Adaptive Card       |

- **Allure is the report people open.** The `post` block POSTs the raw
  `allure-results` to the service, which generates the report on its own host and
  keeps the history there. Allure attachments (screenshots, screencasts, traces)
  are referenced by relative path from inside the report, so whatever serves an
  Allure report must hold its attachments too — which is why this needed a host
  with persistent storage, not just a renderer.
- **The Playwright HTML report still goes to Nexus** as an unpacked tree. Its
  individual files stay fetchable by URL; `index.html` itself does not render
  (CSP). It is kept as a second, independent copy of the artifacts — drop that
  branch of the `post` block if that isn't wanted.
- **Nothing is kept on the controller.** No archived artifacts, no Allure
  results, no trend history.
- **Each publish step is off while its variables are unset** (see "Publish target
  variables"); for Nexus that also re-enables archiving `playwright-report/**` +
  `test-results/**` on the controller.
- **A publish failure marks the build UNSTABLE rather than failing it** — the
  suite's own verdict is what matters, and a broken upload must not read as a
  test failure.
- **Testmo gets one automation run per build**, submitted from the `post` block by
  `testmo automation:run:submit` reading `test-results/junit.xml`. Statuses, durations
  and failure messages only: no attachments (they are already in Allure and Nexus)
  and no links to manual test cases. It runs inside the test image because the CLI is
  installed there, not on the node.
- **Teams gets one card per build**, sent last in the `post` block but reporting the verdict as
  it stood **before** any publish step ran — a broken Nexus or Testmo upload leaves the build
  `UNSTABLE` in Jenkins without recolouring the card, so a yellow card in the channel points at
  the test run rather than at an unconfigured publish target. It carries that verdict and this
  build's Allure link only — no Nexus, no Testmo, no test counters. If Allure was not published
  the card still goes out; it links the Jenkins build instead when `BUILD_URL` is configured,
  and carries no link at all otherwise — silence would be indistinguishable from the pipeline
  never having run.

> `playwright.config.ts` enables the `allure-playwright` reporter unconditionally,
> so a local `npm test` and a CI run produce the same results. `allure-playwright`
> **appends** to `allure-results`, which is why **Build image** clears it first
> (see "How it works"). Locally the same accumulation happens silently: a month of
> runs had grown to 938 files / 853 MB.

### Nexus — file hosting works, HTML rendering doesn't

**Works:** `curl`-uploading the report tree, and serving the individual files
back — **screenshots, screencasts, logs and traces** are all fetchable by URL.
Nexus remains a valid artifact store, and the repo was created with Content
Disposition = Inline.

**Doesn't work:** `index.html` as a **rendered page**. The nginx reverse proxy in
front of Nexus sends a `Content-Security-Policy` header that blocks the report's
scripts, so the report UI loads blank/broken. This is a proxy-level restriction,
not a Nexus repo setting — no combination of repo options fixes it.

Making this route work requires relaxing that CSP at nginx — which affects
everything served through that proxy, not just these reports — or stripping the
header for this path only. That's a security trade-off pending a decision with
DevOps, which is why the option is documented rather than fixed here.

This is why Nexus ended up as an artifact store only, and the browsable report
lives on the Allure host instead.

### Why not the Allure Jenkins plugin

It renders fine (the CSP problem is specific to Nexus/nginx), but it keeps
per-build results **and** trend history on the controller, and for this suite the
bulk of that is failure attachments. Moving that storage off the controller is
harder than it looks:

- **Artifact Manager plugins (S3, Artifactory) do not help.** The Allure plugin
  writes `allure-results.zip` straight into the build's `archive/` directory
  instead of going through Jenkins' artifact-manager abstraction, so an artifact
  manager silently doesn't pick it up
  ([allure-plugin#359](https://github.com/jenkinsci/allure-plugin/issues/359)).
- **Relocating the build records does work**, via the core system property
  `jenkins.model.Jenkins.buildsDir` — but it's a startup property (no UI since
  Jenkins 2.119, because it does not migrate existing build records), so it needs a
  restart plus a manual move of existing builds, and NFS wants tuned mount options
  for Jenkins' many small reads/writes.

The Docker service on its own VM avoids all of that: results, reports, history and
attachments live on that host's own disk.

### Allure server

A dedicated Ubuntu 24 VM, containers only — reached by its `ad.catalogic.us` DNS name now, not the bare IP it used before.

| Thing             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| API / report      | `http://cc-allure.ad.catalogic.us:5050/allure-docker-service` |
| UI (project list) | `http://cc-allure.ad.catalogic.us:5252`                       |
| Project ID        | `cloudcasa-e2e` — must stay stable, it carries the history    |
| Compose file      | `/opt/allure/docker-compose.yml` + `/opt/allure/.env`         |
| Data              | `/var/lib/allure/projects` — dedicated 100 GB ext4 disk       |
| Images            | `frankescobar/allure-docker-service:2.44.0` + `-ui`           |

`ALLURE_URL` must stay on **5050**: the UI on 5252 is an Express server that answers `200` with `index.html` for every path, so a wrong port breaks the upload without an error.

Notable service settings: `CHECK_RESULTS_EVERY_SECONDS=NONE` (the pipeline pushes
and calls `generate-report` explicitly, so directory polling is pointless),
`KEEP_HISTORY_LATEST=25`, `OPTIMIZE_STORAGE=1`, `SECURITY_ENABLED=1` with an admin
user for CI plus `MAKE_VIEWER_ENDPOINTS_PUBLIC=1` so report links open without a
login while writes stay authenticated.

**Publish flow in the `post` block:** `POST /login` (cookie jar + CSRF token) →
`POST /send-results` in batches of 20 files → `GET /generate-report`, whose
response carries the `report_url` for this build, which the build description
shows as a bare URL — Jenkins' default markup formatter is Plain text, so an
`<a>` tag would render as literal markup instead of a link. Batching is deliberate: one request per file is needlessly slow, and one
request for all of them can carry hundreds of MB of traces and videos.

Gotchas worth keeping in mind when touching that host:

- **Volume ownership.** The container does not run as root. The host directory must
  be owned by the image's own UID/GID (read them with
  `docker run --rm --entrypoint sh <image> -c 'id; ls -ldn /app/allure-docker-api/static/projects'`),
  otherwise report generation dies with `AccessDeniedException` while the API keeps
  answering — see Troubleshooting.
- **`ALLURE_DOCKER_PUBLIC_API_URL` must be the URL the browser sees.** The UI is a
  browser-side SPA that calls the API directly; `localhost` there only works when
  the UI is opened on the VM itself.
- **No TLS yet**, and it must not be put behind the shared corporate nginx — the
  same CSP that blocks the Playwright report would block this one. A reverse proxy
  on that VM is the way in, and `ALLURE_DOCKER_PUBLIC_API_URL` has to move to
  `https` in the same step or mixed content breaks the UI.
- **Docker bypasses ufw.** Published ports are wired into the `DOCKER`/`DOCKER-USER`
  chains, not `INPUT`, so `ufw deny 5050` does nothing. Restrict via `DOCKER-USER`
  rules (and persist them) or bind the ports to loopback behind a proxy.
- **Allure CLI in the image is 2.44 while this repo uses `allure-playwright` 3.x.**
  The on-disk results format is Allure 2-compatible, so the pair works — this was
  verified with a manual push before wiring the pipeline. If a future
  `allure-playwright` upgrade breaks it, the fallback is generating the report in
  the pipeline (`npx allure generate`) and serving the static tree, at the cost of
  handling history by hand.

### Nexus report repository

The `post` step uploads `playwright-report/` as an **unpacked tree** (one `curl`
PUT per file) to a Nexus `raw (hosted)` repo. Final URL:
`<NEXUS_URL>/repository/<repo>/<job>/<build>/index.html` — reachable, but see
the CSP note above.

`NEXUS_URL` and `NEXUS_REPORTS_REPO` come from Jenkins, not from the repo — see
"Publish target variables".

**Repo settings** (Nexus UI → _Settings → Repositories_), if it ever needs
recreating as a `raw (hosted)` repository:

| Setting             | Value                                                         |
| ------------------- | ------------------------------------------------------------- |
| Name                | `cloudcasa-test-reports`                                      |
| Deployment policy   | **Allow redeploy**                                            |
| Content Disposition | **Inline** ⚠️ (`Attachment` would download instead of render) |

Also required: a **username/password** (service account or token) Jenkins
credential with **write** access to the repo, ID `nexus-creds`, plus the
`internal-ca-cert` Secret file for the HTTPS chain.

The controller node must have `curl` available (standard on most agents).

## Maintenance

- **Keep the image tag in sync with Playwright.** `@playwright/test` is pinned to
  an exact version in `package.json` so a routine `npm update` cannot move it out
  from under the image; upgrading means editing that pin **and** the
  `FROM mcr.microsoft.com/playwright:vX.Y.Z-noble` tag in `Dockerfile` together.
  A mismatch breaks only CI, with `Executable doesn't exist at /ms-playwright/…`.
- **After an `allure-playwright` major upgrade, check the Allure host still
  renders the results** — the image ships Allure CLI 2.44, the reporter is on 3.x,
  and the compatibility is the results format, not a guarantee.
- **Watch disk on the Allure host.** `KEEP_HISTORY_LATEST=25` bounds it, but the
  attachments are what fill the 100 GB: `df -h /var/lib/allure`.

## Local sanity check

```bash
# From the repo root — build the image the same way Jenkins does:
docker build -f ci/Dockerfile -t cloudcasa-tests .

# Run the suite (pass secrets via --env or --env-file):
docker run --rm -e CI=true --env-file .env cloudcasa-tests npx playwright test
```

## Troubleshooting

Gotchas hit (and fixed) while running this pipeline end-to-end; they apply to
any Jenkins setup where the agent runs the suite in a Docker container.

- **Credentials silently empty inside the test container, but fine on the
  controller.** Jenkins/docker-workflow drops any environment variable whose
  _name_ matches a built-in "sensitive name" heuristic (case-insensitive
  `token`, `password`, `key`, `secret`, ...) before passing it into a spawned
  container via `docker run/exec -e` — a real security measure (those flags
  are visible via `docker inspect`/`docker top` to anyone with host docker
  access, which would defeat Jenkins' own console masking). Since this app's
  env-var contract requires exactly those names (`CLOUDCASA_API_TOKEN`,
  `CC_PASSWORD`, `TESTMAIL_API_KEY`), the
  `Jenkinsfile` binds credentials to innocuous placeholder names (`IN_*`) and
  `export`s the real names from inside the container's own `sh` step, where
  the filter no longer applies.
- **`agent { dockerfile { ... reuseNode true } }` + credentials in a stage
  `environment` block never reach `sh` steps.** The container is started once,
  up front; credentials bound afterward (even correctly, even before this
  sensitive-name issue) are invisible to `docker exec`-based `sh` steps run
  against it. This is why the pipeline uses `docker.build(...).inside {}`
  scripted style instead, with `withCredentials` wrapping `.inside{}` (not
  nested inside it) so the binding exists before the container starts.
- **git "dubious ownership" on the checkout.** `agent { dockerfile {} }`/any
  git checkout of a bind-mounted repo needs `git config --system --add
safe.directory <path>` for both the repo's top-level path _and_ its literal
  `.git` path — the `file://` transport's upload-pack subprocess checks the
  gitdir path specifically, not just the resolved toplevel. Must be
  `--system`, not `--global`, if `$HOME` is a volume that gets mounted over
  whatever was baked into the image there.
- **`npm ci` dies mid-install with `EAI_AGAIN` DNS errors**, inside a
  Docker-in-Docker build. containers the inner dockerd spawns can't use its
  own embedded loopback resolver, so Docker substitutes public
  `8.8.8.8`/`8.8.4.4` defaults for anything nested — pin `dockerd --dns` to
  a resolver reachable on your network.
- **`docker build` fails on `COPY package.json ...`** when the `dockerfile`
  agent's `dir` is set to the Dockerfile's own directory: `dir` sets the
  build **context**, not just where Jenkins looks for the file, so
  `dir 'ci'` builds with context `ci/` (no `package.json` there). Point the
  context at the repo root instead.
- **`TESTMAIL_API_URL` undefined** → every testmail-dependent test fails with
  `TypeError: Failed to parse URL from undefined?apikey=...`. See "Required
  credentials" above — despite what `.env.example` implies, there is no
  code-level default.
- **`curl: (60) SSL certificate problem: self-signed certificate in certificate
chain`** on the Nexus upload. The Nexus certificate chains up to the corporate
  (AD) CA, which the agent doesn't trust; `curl` has its own trust store, so a
  Java/JVM truststore change does not help either. Supply the root via the
  `internal-ca-cert` credential (see "Required credentials"). `-k` would also
  "work", but that upload carries the Nexus password in a Basic-auth header, so
  it must not go over an unverified connection.
- **`CredentialNotFoundException` in the `post` block** — the steps that run on the
  node need `allure-creds`, `nexus-creds`, `internal-ca-cert` and
  `teams-webhook-url` to exist before the first build. All three branches are
  wrapped in `try/catch`, so a missing credential (or an unreachable host) shows up
  only as `Allure publish failed: ...` / `Nexus publish failed: ...` /
  `Teams notification failed: ...` in the console plus an UNSTABLE build — easy to
  miss in a long log, so check for those lines when a build is green-ish but no
  report or card appeared.
- **`Testmo submit failed: ...` with the build UNSTABLE.** The submit is wrapped like
  the other publish steps, so this never fails the build. Usual causes: the
  `testmo-token` credential is missing, the key lacks write access, `TESTMO_PROJECT_ID`
  points at a project the key cannot see, or the node has no outbound HTTPS to
  `*.testmo.net`.
- **A publish step reports "not set in Jenkins" and skips.** The variable is missing
  from _Global properties_ (or misspelled there), or a folder/node property with the
  same name overrides it with an empty value. Both variables of the pair are
  required — see "Publish target variables".
- **`No JUnit results — skipping the Testmo submit.`** `test-results/junit.xml` was
  never written, which means **Run tests** did not get as far as running them — look
  for a failure in **Build image** or a workspace-mount problem above, not at Testmo.
- Real app/test failures seen against a live staging target are not stack
  issues: e.g. `page.waitForResponse: Test timeout of 120000ms exceeded` on
  login/password-reset flows reflects the live app's actual response time
  under test, not a pipeline misconfiguration.
- **`Teams notification failed: ...` with the build UNSTABLE.** Wrapped like the other publish
  steps, so it never fails the build. Usual causes: the `teams-webhook-url` credential is
  missing, the flow behind the webhook was deleted or turned off, or the node has no outbound
  HTTPS to the webhook's host.
- **The build log says `Teams notification sent.` but no card appears.** The webhook returns
  `202` before the flow runs, so the failure is inside Power Automate — open the flow's run
  history. A rejected `Post card in a chat or channel` action means the payload is wrong; a
  missing run means the URL points at a deleted flow.
- **`Scripts not permitted to use staticMethod groovy.json.JsonOutput toJson`.** The Groovy
  sandbox rejected the card builder on this controller. Approve it in _Manage Jenkins →
  In-process Script Approval_; it is a read-only serializer, not a sandbox escape.

Allure host specifically:

- **`AccessDeniedException` / `mkdir: Permission denied` under
  `/app/allure-docker-api/static/projects` while the API still answers.** The bind
  mount landed correctly (`/app/projects` is a symlink to that path) but the host
  directory isn't writable by the container's non-root user. Read the expected
  owner out of the image and `chown -R` the host directory to it — do not "fix" it
  by running the container as root.
- **A report that opens but is empty ("There are no items", all counters 0).** That
  is the auto-created `default` project, not ours. Pick `cloudcasa-e2e` in the UI's
  project selector.
- **Admin buttons greyed out in the UI** (SEND RESULTS, GENERATE REPORT, CLEAN…) —
  expected: `MAKE_VIEWER_ENDPOINTS_PUBLIC=1` grants anonymous **read** only. Log in
  as the admin user to get them.
- **`send-results` returns 401/403 from a script.** With `SECURITY_ENABLED=1`,
  writes need the `POST /login` cookie jar **plus** the CSRF token from the
  `csrf_access_token` cookie in an `X-CSRF-TOKEN` header — basic auth is not
  enough. See the `post` block for the working sequence.
- **The whole upload fails at once with an argument-list error.** Don't build a
  single request out of every result file: locally that command line reached ~65 000
  characters (Windows caps at ~32 767). Hence the batching in the `post` block.
