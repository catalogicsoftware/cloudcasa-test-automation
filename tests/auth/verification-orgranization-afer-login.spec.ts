import { test } from '@fixtures/base';
import { ORGANIZATION_NAME_CHECK_TEST_TIMEOUT } from '@data/timeouts';

test.beforeEach(async ({ loginPage }) => {
  await loginPage.goto();
});

test.describe('Organization verification', () => {
  test.describe.configure({ timeout: ORGANIZATION_NAME_CHECK_TEST_TIMEOUT });

  test('After Sign-In user should see the organizaiotn he has registred', async ({
    organizationNameLock,
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
