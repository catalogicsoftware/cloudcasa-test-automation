import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Title } from '@page-factory/title';
import { TOOLTIP_OPEN_TIMEOUT } from '@data/timeouts';

/** A drawer (or the Add policy dialog) carries its star as a direct child of its header. */
const DRAWER_STAR = ':is(.sidebar-header, mat-dialog-container .modal-title) > cc-add-shortcut';

/** Next to a page heading; excludes the drawer star, since an open drawer leaves both stars in the DOM. */
const PAGE_STAR = `cc-add-shortcut:not(${DRAWER_STAR})`;

/** Dashboard shortcut star; the app marks a saved shortcut with the `active` class, which fills it yellow. */
export class ShortcutStar {
  readonly star: Button;
  readonly emptyStar: Button;
  readonly filledStar: Button;
  /** Heading of the drawer (or dialog) whose header holds the star. */
  readonly drawerTitle: Title;
  /** Rendered in the CDK overlay, outside the star itself, while the star is hovered. */
  readonly tooltip: Container;

  constructor(
    protected readonly page: Page,
    scope: 'page' | 'drawer',
  ) {
    const root = scope === 'page' ? PAGE_STAR : DRAWER_STAR;
    const name = scope === 'page' ? 'Page star' : 'Drawer star';
    this.star = new Button({ page, locator: `${root} button`, name });
    this.emptyStar = new Button({
      page,
      locator: `${root} button:not(.active)`,
      name: `${name} (empty)`,
    });
    this.filledStar = new Button({
      page,
      locator: `${root} button.active`,
      name: `${name} (filled)`,
    });
    this.drawerTitle = new Title({
      page,
      locator:
        ':is(.sidebar-header:has(> cc-add-shortcut) h3, h3.modal-title:has(> cc-add-shortcut))',
      name: 'Drawer title',
    });
    this.tooltip = new Container({
      page,
      locator: 'lib-tooltip .cc-tooltip',
      name: `${name} tooltip`,
    });
  }

  /** A hover that lands while the page settles misses the mouse-enter, so each retry moves the mouse away first. */
  async hover(): Promise<void> {
    await test.step(`Hover the ${this.star.componentName} until its tooltip shows`, async () => {
      await expect(async () => {
        await this.page.mouse.move(0, 0);
        await this.star.getLocator().hover();
        await this.tooltip.getLocator().waitFor({ timeout: TOOLTIP_OPEN_TIMEOUT });
      }).toPass({ timeout: TOOLTIP_OPEN_TIMEOUT * 5 });
    });
  }

  async toggle(): Promise<void> {
    await this.star.click();
  }
}
