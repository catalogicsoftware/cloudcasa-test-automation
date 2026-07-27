# CI — Jenkins + Docker

Runs the CloudCasa Playwright suite inside a container on a Jenkins worker.

## Files

| File               | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `Dockerfile`       | Test image (official Playwright image + `npm ci`)               |
| `Jenkinsfile`      | Declarative pipeline: build image → run tests → publish reports |
| `../.dockerignore` | Trims the docker build context (repo root)                      |

## How it works

The pipeline (`agent any`) explicitly runs `docker.build('cloudcasa-playwright-tests',
'-f ci/Dockerfile .')` from the repo root, then `image.inside { ... }` to run the
`Test` stage's `sh` steps inside that container. `CI=true` activates the CI
branch of `playwright.config.ts` (headless, `retries: 2`, `workers: 1`).

This intentionally does **not** use the declarative `agent { dockerfile { ... } }`
sugar — see the comment at the top of `Jenkinsfile` and the Troubleshooting
section below for why.

## Jenkins prerequisites

- **Docker** available on the agent (the pipeline shells out to `docker build` / `docker run`).
- **`curl`** available on the node (used to upload the report to Nexus).
- A pipeline job pointed at this repo with **Script Path** = `ci/Jenkinsfile`.

## Required credentials

Create each as a **Secret text** credential in Jenkins
(_Manage Jenkins → Credentials_); the ID is referenced in the `withCredentials([...])`
block of the `Jenkinsfile`. Current IDs used:

| Env var                    | Jenkins credential ID                |
| -------------------------- | ------------------------------------ |
| `BASE_URL`                 | `cloudcasa-base-url`                 |
| `CC_EMAIL`                 | `cloudcasa-cc-email`                 |
| `CC_PASSWORD`              | `cloudcasa-cc-password`              |
| `TESTMAIL_NAMESPACE`       | `cloudcasa-testmail-namespace`       |
| `TESTMAIL_API_KEY`         | `cloudcasa-testmail-api-key`         |
| `CLOUDCASA_API_URL`        | `cloudcasa-api-url`                  |
| `CLOUDCASA_API_TOKEN`      | `cloudcasa-api-token`                |
| `REGISTERED_USER_PASSWORD` | `cloudcasa-registered-user-password` |
| `TESTMAIL_API_URL`         | `cloudcasa-testmail-api-url`         |

`TESTMAIL_API_URL` is required, despite `.env.example` documenting a default
value — `utils/testmail.ts` reads `process.env.TESTMAIL_API_URL` directly with
no fallback, so outside local dev (where a real `.env` file supplies it) it
must be provided explicitly, e.g. via this credential. Confirmed by a live
run: every testmail-dependent test failed with `TypeError: Failed to parse
URL from undefined?apikey=...` until this credential was added.

## Reports

**Design goal: keep nothing on the Jenkins controller.** Nexus is the single
source of truth for reports.

- The **Playwright HTML report** is self-contained: `index.html` plus a `data/`
  folder holding the failure **screenshots, videos and traces**. The whole tree
  is pushed to a Nexus `raw` repo, which **renders it in the browser** directly
  (repo must use Content Disposition = Inline). Jenkins keeps only a **link** to
  it in the build description — no archived artifacts, no Allure results on the
  controller.
- **Fallback (inactive).** Nexus is wired — `NEXUS_URL` holds a real host, so
  reports go straight to Nexus. The pipeline still falls back to archiving
  `playwright-report/**` + `test-results/**` on the controller if `NEXUS_URL` is
  ever reset to a `REPLACE-ME` placeholder, so nothing is lost mid-reconfiguration.

> **Allure is local-only.** `playwright.config.ts` enables the `allure-playwright`
> reporter only when `process.env.CI` is unset, so `npm test` on a developer
> machine still produces Allure results, while CI emits just the HTML report.
> The Allure plugin step was removed from the pipeline — it stores results and
> trend history on the controller, which conflicts with the no-controller-storage
> goal, and the failure artifacts it would show are already inside the Playwright
> report served from Nexus.

### Nexus report repository

The `post` step uploads `playwright-report/` as an **unpacked tree** (one `curl`
PUT per file) to a Nexus `raw (hosted)` repo, so `index.html` opens in the
browser. Final URL: `<NEXUS_URL>/repository/<repo>/<job>/<build>/index.html`.

**Current wiring** (set in the `environment` block of the `Jenkinsfile`):

| Setting              | Value                              |
| -------------------- | ---------------------------------- |
| `NEXUS_URL`          | `https://cc-nexus.ad.catalogic.us` |
| `NEXUS_REPORTS_REPO` | `cloudcasa-test-reports`           |

**Repo settings** (Nexus UI → _Settings → Repositories_), if it ever needs
recreating as a `raw (hosted)` repository:

| Setting             | Value                                                         |
| ------------------- | ------------------------------------------------------------- |
| Name                | `cloudcasa-test-reports`                                      |
| Deployment policy   | **Allow redeploy**                                            |
| Content Disposition | **Inline** ⚠️ (`Attachment` would download instead of render) |

Also required: a **username/password** (service account or token) Jenkins
credential with **write** access to the repo, ID `nexus-creds`. `NEXUS_URL`
must have no trailing slash; while it contains `REPLACE-ME` the upload step is
skipped and the rest of the pipeline runs normally.

The controller node must have `curl` available (standard on most agents).

## Maintenance

- **Keep the image tag in sync with Playwright.** When `@playwright/test` is
  upgraded in `package.json`, bump the `FROM mcr.microsoft.com/playwright:vX.Y.Z-noble`
  tag in `Dockerfile` to the matching version.

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
  `CC_PASSWORD`, `TESTMAIL_API_KEY`, `REGISTERED_USER_PASSWORD`), the
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
- **Missing `REGISTERED_USER_PASSWORD`** — acceptable if left blank; only the
  test(s) that depend on a pre-registered user's password fail, with a clear
  assertion error, not a stack/mechanism failure.
- Real app/test failures seen against a live staging target are not stack
  issues: e.g. `page.waitForResponse: Test timeout of 120000ms exceeded` on
  login/password-reset flows reflects the live app's actual response time
  under test, not a pipeline misconfiguration.
