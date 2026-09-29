// spec: specs/auth/auth.md (TC-AUTH-007, TC-AUTH-003)
// CC-590: proves one login gives one stable dashboard, with no loop and no 401/403 answer.

import { Response } from '@playwright/test';
import { test, expect } from '@fixtures/base';
import { LOGIN_REDIRECT_TIMEOUT } from '@data/timeouts';

test.describe('Authentication', () => {
  test('The session stays on the dashboard after the login', async ({
    page,
    loginPage,
    dashboardPage,
    clustersPage,
    toast,
    adminUser: user,
  }) => {
    // 1. Collect all API answers of the page. Use the response event of the page.
    const apiResponses: Response[] = [];
    page.on('response', response => apiResponses.push(response));

    // Record every top-level navigation so a bounce back to the login page shows up as a redirect.
    const navigationHistory: string[] = [];
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        navigationHistory.push(frame.url());
      }
    });

    // 2. Open the login page.
    await loginPage.goto();

    // 3. Log in with CC_EMAIL and CC_PASSWORD.
    await loginPage.login(user.email, user.password);

    // 4. Make sure that the last URL is the dashboard URL.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: LOGIN_REDIRECT_TIMEOUT });
    expect(
      navigationHistory.at(-1),
      `Redirect chain recorded by framenavigated: ${navigationHistory.join(' -> ')}`,
    ).toMatch(/\/dashboard/);

    // 5. Make sure that the browser is not on the login page.
    expect(
      page.url(),
      `Redirect chain recorded by framenavigated: ${navigationHistory.join(' -> ')}`,
    ).not.toMatch(/\/login/);

    await dashboardPage.dashboardContainer.shouldBeVisible();
    await dashboardPage.userHelpModal.closeModal();

    // 6. Make sure that no toast shows the text "Unauthorized".
    await expect(toast.notifications.getLocator()).not.toContainText('Unauthorized');

    // 7. Make sure that no collected answer of the API has the status 401 or 403.
    const unauthorizedResponses = apiResponses.filter(response =>
      [401, 403].includes(response.status()),
    );
    expect(
      unauthorizedResponses.map(response => `${response.status()} ${response.url()}`),
      'No collected API response should answer with 401 or 403',
    ).toEqual([]);

    // 8. Reload the dashboard page.
    await dashboardPage.reloadPage();

    // 9. Make sure that the user is still on the dashboard.
    await dashboardPage.shouldOpen();

    // 10. Open the clusters page in the same context.
    await clustersPage.goto('/clusters');

    // 11. Make sure that the application does not ask for the credentials again.
    await expect(page).not.toHaveURL(/\/login/);
    await expect(loginPage.emailInput.getLocator()).toBeHidden();

    // 12. Make sure that the clusters page opens and shows its heading.
    await expect(page).toHaveURL(/\/clusters/);
    await clustersPage.clustersContainer.shouldBeVisible();
    await clustersPage.heading.shouldHaveText('Clusters');
  });
});
