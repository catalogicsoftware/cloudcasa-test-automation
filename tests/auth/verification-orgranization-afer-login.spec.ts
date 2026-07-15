import { test } from '@fixtures/base';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Organization verification', () => {
  test('After Sign-In user should see the organizaiotn he has registred', async ({
    loginPage,
    dashboardPage,
    adminUser: user,
  }) => {
    await loginPage.login(user.email, user.password);
    await dashboardPage.waitForDashboardData();
    await dashboardPage.waitForLoad();
    await dashboardPage.shouldOpen();

    await dashboardPage.userHelpModal.closeModal();

    await dashboardPage.userMenu.checkHeaderOragnization(user.organization);
    await dashboardPage.userMenu.open();
    await dashboardPage.userMenu.checkUserMenuOraganization(user.organization);
  });
});
