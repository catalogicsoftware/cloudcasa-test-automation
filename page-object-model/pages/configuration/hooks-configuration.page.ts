import test, { expect, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Input } from '@page-factory/input';
import { Link } from '@page-factory/link';
import { Table } from '@page-factory/table';
import { Title } from '@page-factory/title';
import { HookDrawer } from '@page-object-model/components/drawers/hook.drawer';
import { ProceedConfirmation } from '@page-object-model/components/proceed-confirmation.components';
import { HOOK_LIST_RELOAD_TIMEOUT } from '@data/timeouts';
import { DEFAULT_CONTAINER_LABEL, HOOK_TYPE_LABELS, podSelectorInTable } from '@data/hooks';
import type { HookApp, HookCase } from '../../../types/data/hook';

export class HooksConfigurationPage extends BasePage {
  readonly hooksContainer = new Container({
    page: this.page,
    locator: 'app-hooks',
    name: 'App hooks',
  });
  readonly heading = new Title({ page: this.page, locator: 'app-hooks h4', name: 'App hooks' });
  readonly addHook = new Link({
    page: this.page,
    locator: 'app-hooks a:has-text("Add app hook")',
    name: 'Add app hook',
  });
  readonly hooksTable = new Table({
    page: this.page,
    locator: 'app-hooks table',
    name: 'App hooks',
  });
  readonly emptyState = new Container({
    page: this.page,
    locator: 'app-hooks .table__no-info',
    name: 'App hooks empty state',
  });
  /** Formly numbers the field id per form instance, so it is matched on its stable middle. */
  readonly nameFilter = new Input({
    page: this.page,
    locator: 'app-hooks input[id*="input_name"]',
    name: 'Name filter',
  });
  readonly typeFilter = new Button({
    page: this.page,
    locator: 'app-hooks button.mat-menu-trigger:has-text("Type")',
    name: 'Type filter',
  });
  readonly hookDrawer = new HookDrawer(this.page);
  readonly removeConfirmation = new ProceedConfirmation(this.page);

  constructor(page: Page) {
    super(page);
  }

  async shouldOpen(): Promise<void> {
    await test.step('App hooks page should be opened', async () => {
      await expect(this.page).toHaveURL(/\/configuration\/hooks/);
      await this.heading.shouldBeVisible();
    });
  }

  async openAddHookDrawer(): Promise<HookDrawer> {
    await this.addHook.click();
    await this.hookDrawer.shouldBeOpened();
    return this.hookDrawer;
  }

  async openEditHookDrawer(name: string): Promise<HookDrawer> {
    await this.hooksTable.clickRowAction(name, 'Edit');
    await this.hookDrawer.shouldBeOpened();
    return this.hookDrawer;
  }

  async openViewHookDrawer(name: string): Promise<HookDrawer> {
    await this.hooksTable.clickRowAction(name, 'View');
    await this.hookDrawer.shouldBeOpened();
    return this.hookDrawer;
  }

  async openCloneHookDrawer(name: string): Promise<HookDrawer> {
    await this.hooksTable.clickRowAction(name, 'Clone');
    await this.hookDrawer.shouldBeOpened();
    return this.hookDrawer;
  }

  /** Opens the "Do you want to proceed?" popover and leaves the answer to the caller. */
  async startRemovingHook(name: string): Promise<ProceedConfirmation> {
    await test.step(`Start removing hook "${name}"`, async () => {
      // The list reloads itself whenever a hook changes, and that closes the popover an instant after it opens.
      await expect(async () => {
        await this.hooksTable.clickRowAction(name, 'Remove');
        await expect(this.removeConfirmation.panel.getLocator()).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: HOOK_LIST_RELOAD_TIMEOUT });
    });
    return this.removeConfirmation;
  }

  /** The list only re-fetches on Enter; typing alone leaves it unfiltered. */
  async filterByName(name: string): Promise<void> {
    await test.step(`Filter app hooks by name "${name}"`, async () => {
      await this.nameFilter.fill(name);
      await this.nameFilter.getLocator().press('Enter');
    });
  }

  /** Each type is a checkbox in a mat-menu that closes itself on every click. */
  async toggleTypeFilter(typeLabel: string): Promise<void> {
    await test.step(`Toggle type "${typeLabel}" in the app hooks type filter`, async () => {
      await this.typeFilter.click();
      await this.page.locator(`.mat-menu-panel label:text-is("${typeLabel}")`).click();
      await expect(this.page.locator('.mat-menu-panel')).toHaveCount(0);
    });
  }

  /** The App & containers cell holds one line per app: its pod selector, then its container or "Default". */
  async shouldListHook(hook: HookCase): Promise<void> {
    await test.step(`App hook "${hook.name}" should be listed with its type and ${hook.apps.length} app(s)`, async () => {
      await this.hooksTable.shouldHaveRow(hook.name, HOOK_LIST_RELOAD_TIMEOUT);
      await this.hooksTable.shouldHaveCellValue(hook.name, 'Type', HOOK_TYPE_LABELS[hook.type]);
      const appLines = this.hooksTable.getRow(hook.name).locator('td div:has(> .badge)');
      await expect(appLines).toHaveCount(hook.apps.length);
      for (const [index, app] of hook.apps.entries()) {
        await expect(appLines.nth(index)).toContainText(podSelectorInTable(app.podSelector));
        await expect(appLines.nth(index)).toContainText(app.container || DEFAULT_CONTAINER_LABEL);
      }
    });
  }

  async shouldNotListApp(hookName: string, app: HookApp): Promise<void> {
    await test.step(`App hook "${hookName}" should not list app "${podSelectorInTable(app.podSelector)}"`, async () => {
      await expect(this.hooksTable.getRow(hookName)).not.toContainText(
        podSelectorInTable(app.podSelector),
      );
    });
  }

  async shouldNotListHook(name: string): Promise<void> {
    await test.step(`App hook "${name}" should not be listed`, async () => {
      await expect(this.hooksTable.getRow(name)).toHaveCount(0, {
        timeout: HOOK_LIST_RELOAD_TIMEOUT,
      });
    });
  }
}
