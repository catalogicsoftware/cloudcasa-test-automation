// spec: specs/auth/auth.md (TC-AUTH-007, TC-AUTH-003)
// CC-590: the backend accepts the credentials, but the UI shows "Unauthorized"
// and sends the user back to the login page. This test proves one login gives
// one stable dashboard, with no loop and no 401/403 answer.

import { Response } from '@playwright/test';
import { test, expect } from '@fixtures/base';
import { LOGIN_REDIRECT_TIMEOUT, POST_LOGIN_LANDING_TEST_TIMEOUT } from '@data/timeouts';

test.describe('Authentication', () => {
  test.describe.configure({ timeout: POST_LOGIN_LANDING_TEST_TIMEOUT });

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

    // Records every top-level navigation, so a bounce back to the login page shows up
    // here even when the final URL happens to look right.
    const navigationHistory: string[] = [];
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        navigationHistory.push(frame.url());
      }
    });

    // Records every toast that ever shows "Unauthorized" text, even one that appears
    // and auto-dismisses during the reload or the clusters navigation.
    const getUnauthorizedToastHistory = await toast.watchFor(/Unauthorized/);

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

    const firstDashboardNavigation = navigationHistory.findIndex(url => /\/dashboard/.test(url));
    expect(
      firstDashboardNavigation,
      'The dashboard navigation should be recorded',
    ).toBeGreaterThanOrEqual(0);
    expect(
      navigationHistory.slice(firstDashboardNavigation + 1),
      'The redirect chain must not return to login after reaching the dashboard: ' +
        navigationHistory.join(' -> '),
    ).not.toContainEqual(expect.stringMatching(/\/login/));

    await dashboardPage.dashboardContainer.shouldBeVisible();
    await dashboardPage.userHelpModal.closeModal();

    // 6. Reload the dashboard page.
    await dashboardPage.reloadPage();

    // 7. Make sure that the user is still on the dashboard.
    await dashboardPage.shouldOpen();

    // 8. Open the clusters page in the same context.
    await clustersPage.goto('/clusters');

    // 9. Make sure that the application does not ask for the credentials again.
    await expect(page).not.toHaveURL(/\/login/);
    await expect(loginPage.emailInput.getLocator()).toBeHidden();

    // 10. Make sure that the clusters page shows its heading.
    await clustersPage.shouldOpen();
    await clustersPage.heading.shouldHaveText('Clusters');

    // 11. Make sure that no toast ever showed the text "Unauthorized" across the whole
    // session, including toasts that appeared and auto-dismissed during the reload or
    // the clusters navigation.
    expect(getUnauthorizedToastHistory(), 'No toast should ever have shown "Unauthorized"').toEqual(
      [],
    );

    // 12. Make sure that no collected answer of the API has the status 401 or 403,
    // including responses from the reload and the clusters navigation.
    const unauthorizedResponses = apiResponses.filter(response =>
      [401, 403].includes(response.status()),
    );
    expect(
      unauthorizedResponses.map(response => `${response.status()} ${response.url()}`),
      'No collected API response should answer with 401 or 403',
    ).toEqual([]);
  });
});
