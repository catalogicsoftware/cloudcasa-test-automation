/** A page star adds a shortcut to the page itself; a drawer star adds one that reopens the drawer. */
export type ShortcutKind = 'page' | 'drawer';

export type ShortcutCase = {
  /** Opens the page or the drawer that holds the star — the exact href of the tile the star adds. */
  route: string;
  /** Path the app redirects `route` to, when it does (/clusters → /clusters/overview). */
  opensAt?: string;
  /** First line of the tile (the `<small>` caption), e.g. "Clusters". */
  section: string;
  /** Second line of the tile, e.g. "Restores". */
  name: string;
  /** Actual vs. expected behavior of a known app defect: the generated test is marked fixme with it. */
  defect?: string;
};

export type DrawerShortcutCase = ShortcutCase & {
  /** Path the app settles on once the drawer has opened and it has dropped `?new=true` from the URL. */
  opensAt: string;
  /** Heading of the drawer the tile reopens, e.g. "Define restore cluster". */
  drawerTitle: string;
};
