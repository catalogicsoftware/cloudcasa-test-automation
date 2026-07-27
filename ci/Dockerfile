# Test image for the CloudCasa Playwright suite.
#
# Base tag MUST match the installed @playwright/test version (see package.json).
# The Microsoft image already bundles the browsers + all system dependencies,
# so there is no `npx playwright install` step here.
#
# Bump this tag whenever @playwright/test is upgraded.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

# Install dependencies first so this layer is cached unless the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project.
COPY . .

# No CMD: the Jenkins pipeline supplies the test command.
