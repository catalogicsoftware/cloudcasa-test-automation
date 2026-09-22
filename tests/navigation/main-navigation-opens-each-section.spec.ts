// spec: specs/navigation/navigation.md (TC-NAV-001, TC-CL-001)

import { expect, test } from '@fixtures/auth';
import { Link } from '@page-factory/link';
import { ClusterSection } from '@page-object-model/components/clusters-sidebar.components';

const CLUSTER_SUB_SECTIONS: ClusterSection[] = [
  'Overview',
  'Backups',
  'Restores',
  'Migration',
  'Replication',
  'Recovery points',
];

test.describe('Global Navigation & User Menu', () => {
  test('The main navigation opens each section', async ({
    loggedInPage,
    dashboardPage,
    clustersPage,
    databasesPage,
    drPage,
    reportsPage,
    policiesConfigurationPage,
  }) => {
    // Console errors are labelled with the section that was open when they fired, so a
    // failure names the page that broke instead of just "something threw".
    let currentSection = 'Dashboard';
    const consoleErrors: string[] = [];
    loggedInPage.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(`${currentSection}: ${message.text()}`);
      }
    });

    // 1. Log in as the admin user.

    // 2. Close the help modal.
    await dashboardPage.userHelpModal.closeModal();

    const topNav = dashboardPage.topNavigationBar;
    const NAV_LINKS: { name: string; link: Link; url: RegExp }[] = [
      { name: 'Clusters', link: topNav.clustersLink, url: /\/clusters/ },
      { name: 'Databases', link: topNav.databasesLink, url: /\/databases/ },
      { name: 'DR', link: topNav.drLink, url: /\/dr/ },
      { name: 'Reports', link: topNav.reportsLink, url: /\/reports/ },
      { name: 'Configuration', link: topNav.configurationLink, url: /\/configuration/ },
      { name: 'Dashboard', link: topNav.dashboardLink, url: /\/dashboard/ },
    ];
    const [clusters, databases, dr, reports, configuration, dashboard] = NAV_LINKS;

    // 3. Click the link "Clusters".
    currentSection = clusters.name;
    await clusters.link.click();

    // 4. Make sure that the URL is /clusters and the heading is "Clusters".
    await expect(loggedInPage).toHaveURL(clusters.url);
    await clustersPage.heading.shouldHaveText('Clusters');

    // 5. Make sure that the clusters page shows its sub-navigation. The sub-navigation holds
    //    Overview, Backups, Restores, Migration, Replication and Recovery points.
    for (const section of CLUSTER_SUB_SECTIONS) {
      await clustersPage.clustersSideBar.navItem(section).shouldBeVisible();
    }

    // 6. Make sure that the clusters table shows the columns Name, Kubernetes version, Agent
    //    version, Nodes, State and Last updated.
    await clustersPage.shouldHaveColumns();

    // 7. Click the link "Databases". Make sure that the URL is /databases.
    currentSection = databases.name;
    await databases.link.click();
    await expect(loggedInPage).toHaveURL(databases.url);
    await databasesPage.shouldOpen();

    // 8. Click the link "DR". Make sure that the URL is /dr and the heading is "DR clusters".
    currentSection = dr.name;
    await dr.link.click();
    await expect(loggedInPage).toHaveURL(dr.url);
    await drPage.heading.shouldHaveText('DR clusters');

    // 9. Click the link "Reports". Make sure that the URL is /reports.
    currentSection = reports.name;
    await reports.link.click();
    await expect(loggedInPage).toHaveURL(reports.url);
    await reportsPage.shouldOpen();

    // 10. Click the link "Configuration". Make sure that the URL is /configuration.
    currentSection = configuration.name;
    await configuration.link.click();
    await expect(loggedInPage).toHaveURL(configuration.url);

    // 11. Make sure that the Configuration page opens the sub-page "Policies" by default.
    await policiesConfigurationPage.shouldOpen();

    // 12. Click the link "Dashboard". Make sure that the URL is /dashboard.
    currentSection = dashboard.name;
    await dashboard.link.click();
    await expect(loggedInPage).toHaveURL(dashboard.url);
    await dashboardPage.shouldOpen();

    // 13. Make sure that no page of the steps 3 to 12 stays empty.
    expect(
      consoleErrors,
      `Console errors were reported while navigating: ${consoleErrors.join('; ')}`,
    ).toEqual([]);
  });
});
