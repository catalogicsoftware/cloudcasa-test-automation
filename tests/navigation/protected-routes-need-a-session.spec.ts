// spec: specs/navigation/navigation.md (TC-NAV-003)
// seed: seed.spec.ts

import { test, expect } from '@fixtures/base';
import { LOGIN_REDIRECT_TIMEOUT } from '@data/timeouts';

test.describe('Global Navigation & User Menu', () => {
  test('A protected route sends an unknown user to the login page', async ({
    page,
    loginPage,
    dashboardPage,
    clustersPage,
    usersConfigurationPage,
    adminUser: user,
  }) => {
    const protectedRoutes = [
      { route: '/dashboard', content: dashboardPage.dashboardContainer },
      { route: '/clusters', content: clustersPage.clustersContainer },
      { route: '/configuration/users', content: usersConfigurationPage.usersContainer },
    ];

    // 1. Start the test in a clean context. Do not log in.
    for (const { route, content } of protectedRoutes) {
      // 2, 5, 6. Open the route with a direct navigation.
      await page.goto(route);

      // 3. Make sure that the Sign In form is visible.
      await loginPage.emailInput.shouldBeVisible();
      await loginPage.signInButton.shouldBeVisible();

      // 4. Make sure that the route's own protected content is not rendered.
      await expect(content.getLocator()).toBeHidden();
    }

    // 7. Log in with CC_EMAIL and CC_PASSWORD from a fresh challenge on /dashboard, since the IdP returns to whatever route started it and the last probe above started one on /configuration/users.
    await loginPage.goto('/dashboard');
    await loginPage.login(user.email, user.password);
    await page.waitForURL('**/dashboard**', { timeout: LOGIN_REDIRECT_TIMEOUT });
    await dashboardPage.userHelpModal.closeModal();

    // 8. Make sure that the user gets the dashboard.
    await dashboardPage.shouldOpen();

    // 9. Open /configuration/users again.
    await page.goto('/configuration/users');

    // 10. Make sure that the users page shows the table of the members.
    await usersConfigurationPage.shouldOpen();
    await usersConfigurationPage.usersTable.shouldHaveRow(user.email);
  });
});
