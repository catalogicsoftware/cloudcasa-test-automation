import { expect, test } from '@fixtures/auth';
import { DRAWER_SHORTCUTS, PAGE_SHORTCUTS } from '@data/shortcuts';
import { DASHBOARD_SHORTCUTS_TEST_TIMEOUT, LAZY_ROUTE_LOAD_TIMEOUT } from '@data/timeouts';
import { escapeRegExp } from '@utils/generic';

/** Anchored on the whole path and query, so neither a child route nor a stray query matches. */
const exactUrl = (path: string): RegExp => new RegExp(`^https?://[^/]+${escapeRegExp(path)}$`);

// 3. Make the pages and the drawers two constant arrays. Each entry holds the route, the section line and the name line of its tile.
// A tile navigates to `navigatesTo` and the app settles on `settlesOn`: a drawer tile passes through ?new=true, which the app drops once the drawer opens.
const SHORTCUTS = [
  ...PAGE_SHORTCUTS.map(shortcut => ({
    ...shortcut,
    kind: 'page' as const,
    navigatesTo: exactUrl(shortcut.opensAt ?? shortcut.route),
    settlesOn: exactUrl(shortcut.opensAt ?? shortcut.route),
    drawerTitles: [],
  })),
  ...DRAWER_SHORTCUTS.map(shortcut => ({
    ...shortcut,
    kind: 'drawer' as const,
    navigatesTo: exactUrl(`${shortcut.opensAt}?new=true`),
    settlesOn: exactUrl(shortcut.opensAt),
    drawerTitles: [new RegExp(`^\\s*${escapeRegExp(shortcut.drawerTitle)}\\s*$`)],
  })),
];

test.describe('Dashboard', () => {
  // Every entry writes the same account's shortcuts, so they run one after another, in one worker.
  test.describe.configure({ mode: 'default', timeout: DASHBOARD_SHORTCUTS_TEST_TIMEOUT });

  for (const {
    kind,
    route,
    section,
    name,
    navigatesTo,
    settlesOn,
    drawerTitles,
    defect,
  } of SHORTCUTS) {
    test.describe(`${section} / ${name}`, () => {
      // A known app defect: `defect` gives the actual and the expected behavior (see @data/shortcuts).
      test.fixme(defect !== undefined, defect);

      test('A star adds its shortcut to the dashboard', async ({
        loggedInPage,
        dashboardPage,
        pageStar,
        drawerStar,
        toast,
        keepDashboardShortcuts,
      }) => {
        const star = { page: pageStar, drawer: drawerStar }[kind];

        // 1. Log in as the admin user.

        // 2. Close the help modal.
        await dashboardPage.userHelpModal.closeModal();

        // Precondition: the tile of the entry is not on the dashboard — remove it through the pencil modal if it is.
        await dashboardPage.removeShortcutIfPresent(section, name);

        // 4. Open the page of the entry, make sure that its star is empty, hover the star and make sure that the tooltip "Create shortcut" shows.
        await dashboardPage.goto(route);
        await star.emptyStar.shouldBeVisible({}, LAZY_ROUTE_LOAD_TIMEOUT);
        await star.hover();
        await star.tooltip.shouldHaveText('Create shortcut');

        // 5. Click the star. Make sure that the toast "Shortcut added successfully" shows and that the star is filled.
        await star.toggle();
        await toast.notifications.shouldHaveText('Shortcut added successfully');
        await star.filledStar.shouldBeVisible();

        // 6. Open the dashboard. Make sure that the Shortcuts widget holds the tile of the entry with its section line and its name line.
        await dashboardPage.goto('/dashboard');
        await dashboardPage.userHelpModal.closeIfVisible();
        await expect(dashboardPage.shortcutTile(section, name, kind)).toBeVisible();

        // 7. Click the tile. Make sure that the browser opens the route of the entry and that the star there is filled. A drawer entry opens its drawer, and its URL ends with ?new=true.
        await expect(dashboardPage.shortcutTile(section, name)).toHaveAttribute('href', route);
        await dashboardPage.openShortcut(section, name, navigatesTo);
        await expect(loggedInPage).toHaveURL(settlesOn);
        // A drawer tile opens exactly its own drawer; a page tile opens none.
        await expect(star.drawerTitle.getLocator()).toHaveText(drawerTitles);
        await star.filledStar.shouldBeVisible();

        // 8. Remove the shortcut again with the star. Make sure that the toast "Shortcut removed successfully" shows and that the tile leaves the dashboard.
        await star.toggle();
        await toast.notifications.shouldHaveText('Shortcut removed successfully');
        await star.emptyStar.shouldBeVisible();
        await dashboardPage.goto('/dashboard');
        await dashboardPage.userHelpModal.closeIfVisible();
        await dashboardPage.shortcutsPanel.shouldBeVisible();
        await expect(dashboardPage.shortcutTile(section, name)).toHaveCount(0);
      });
    });
  }
});
