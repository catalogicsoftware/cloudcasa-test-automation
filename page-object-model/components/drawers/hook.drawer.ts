import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { Dropdown } from '@page-factory/dropdown';
import { Input } from '@page-factory/input';
import { Radio } from '@page-factory/radio';
import { Title } from '@page-factory/title';
import { CcApiRoutes } from '@data/api-routes';
import { podSelectorBadge, podSelectorInput } from '@data/hooks';
import { BaseDrawer } from './base.drawer';
import type { HookApp, HookCase, PodSelector } from '../../../types/data/hook';

const ROOT = 'app-hooks-sidebar';
const HOOKS_PATH = `/${CcApiRoutes.KUBEHOOKS}`;
/** An app block is the bordered box holding a pod selector; its nested container rows hold none. */
const APP_BLOCK = `${ROOT} div.border.rounded-sm:has(app-input-key-value)`;

export type HookDrawerMode = 'Add' | 'Edit' | 'View';

/** One "app" block of the drawer, addressed by its 1-based position. */
export class HookAppSection {
  readonly podSelector: Input;
  readonly podSelectorBadges: Container;
  readonly container: Input;
  readonly command: Input;
  readonly remove: Button;

  constructor(
    page: Page,
    readonly position: number,
  ) {
    const inApp = (selector: string): string =>
      `:nth-match(${APP_BLOCK}, ${position}) >> ${selector}`;

    this.podSelector = new Input({
      page,
      locator: inApp('app-input-key-value input'),
      name: `Pod selector of app ${position}`,
    });
    this.podSelectorBadges = new Container({
      page,
      locator: inApp('app-input-key-value .badge'),
      name: `Pod selector pairs of app ${position}`,
    });
    this.container = new Input({
      page,
      locator: inApp('input[id*="input_container"]'),
      name: `Container of app ${position}`,
    });
    this.command = new Input({
      page,
      locator: inApp('app-input-code textarea'),
      name: `Command of app ${position}`,
    });
    // Only the block's own side column is matched — a nested container row has a remove button of its own.
    this.remove = new Button({
      page,
      locator: `:nth-match(${APP_BLOCK} > div.flex-column > button.text-danger, ${position})`,
      name: `Remove app ${position}`,
    });
  }

  /** The pod selector only counts once its `key=value` pair is committed with Enter as a badge. */
  async addPodSelector(selector: PodSelector): Promise<void> {
    await test.step(`Add pod selector "${podSelectorInput(selector)}" to app ${this.position}`, async () => {
      await this.podSelector.fill(podSelectorInput(selector));
      await this.podSelector.getLocator().press('Enter');
    });
  }

  async removePodSelector(selector: PodSelector): Promise<void> {
    await test.step(`Remove pod selector "${podSelectorInput(selector)}" from app ${this.position}`, async () => {
      await this.podSelectorBadges
        .getLocator()
        .filter({ hasText: podSelectorBadge(selector) })
        .locator('button')
        .click();
    });
  }

  async fill(app: HookApp): Promise<void> {
    await test.step(`Fill app ${this.position}`, async () => {
      await this.addPodSelector(app.podSelector);
      if (app.container) {
        await this.container.fill(app.container);
      }
      await this.command.fill(app.command);
    });
  }

  /** The drawer only offers removal while more than one app is left. */
  async shouldNotBeRemovable(): Promise<void> {
    await test.step(`App ${this.position} should offer no remove button`, async () => {
      await expect(this.remove.getLocator()).toHaveCount(0);
    });
  }

  async shouldShow(app: HookApp): Promise<void> {
    await test.step(`App ${this.position} should show pod selector "${podSelectorInput(app.podSelector)}"`, async () => {
      await expect(
        this.podSelectorBadges.getLocator().filter({ hasText: podSelectorBadge(app.podSelector) }),
      ).toBeVisible();
      await this.container.shouldHaveValue(app.container);
      await this.command.shouldHaveValue(app.command);
    });
  }
}

/** One sidebar serves Add, Edit, View and Clone — only its title and footer change. */
export class HookDrawer extends BaseDrawer {
  readonly title: Title;
  readonly name: Input;
  readonly nameField: Container;
  readonly template: Dropdown;
  readonly hookType: Radio;
  readonly appBlocks: Container;
  readonly addApp: Button;
  readonly closeView: Button;

  constructor(page: Page) {
    super(page, ROOT, 'Application hook', 'Save');

    this.title = new Title({
      page,
      locator: this.scoped('.sidebar-header h5'),
      name: 'Application hook drawer title',
    });
    this.name = new Input({
      page,
      locator: this.scoped('input[id*="input_name"]'),
      name: 'Name',
    });
    this.nameField = new Container({
      page,
      locator: this.scoped('.form-group:has(input[id*="input_name"])'),
      name: 'Name field',
    });
    this.template = new Dropdown({
      page,
      locator: this.scoped('.form-group:has(label[for*="template"]) button.mat-menu-trigger'),
      name: 'Template',
    });
    this.hookType = new Radio({
      page,
      locator: this.scoped('input[id*="radio_hook_type"]'),
      name: 'Type',
    });
    this.appBlocks = new Container({ page, locator: APP_BLOCK, name: 'Apps' });
    this.addApp = new Button({
      page,
      locator: this.scoped('button:has-text("Add app")'),
      name: 'Add app',
    });
    this.closeView = new Button({
      page,
      locator: this.scoped('button:text-is("Close")'),
      name: 'Close',
    });
  }

  app(position: number): HookAppSection {
    return new HookAppSection(this.page, position);
  }

  /** The sidebar host only wraps a fixed-position panel, so it measures 0x0 — the Name field is the real open signal. */
  async shouldBeOpened(): Promise<void> {
    await this.name.shouldBeVisible();
  }

  /** The template menu closes itself on a pick, so its footer close button is never there to click. */
  async selectTemplate(templateName: string): Promise<void> {
    await this.template.selectByText(templateName, { keepOpen: true });
  }

  /** Fills the first app block and adds one more block for every further app. */
  async fillRequiredFields(hook: HookCase): Promise<void> {
    await test.step('Fill the required fields of the application hook drawer', async () => {
      await this.name.fill(hook.name);
      await this.hookType.select({ value: hook.type });
      for (const [index, app] of hook.apps.entries()) {
        if (index > 0) {
          await this.addApp.click();
        }
        await this.app(index + 1).fill(app);
      }
    });
  }

  /** Add and Clone both POST a new hook. */
  async saveNewHook(): Promise<void> {
    await this.submit.clickAndWaitForResponse(url => new URL(url).pathname === HOOKS_PATH, {
      method: 'POST',
    });
  }

  async saveChanges(): Promise<void> {
    await this.submit.clickAndWaitForResponse(
      url => new URL(url).pathname.startsWith(`${HOOKS_PATH}/`),
      { method: 'PUT' },
    );
  }

  async shouldHaveTitle(mode: HookDrawerMode): Promise<void> {
    await test.step(`Application hook drawer should be in "${mode}" mode`, async () => {
      await expect(this.title.getLocator()).toContainText(`${mode} application hook`);
    });
  }

  async shouldHaveAppCount(count: number): Promise<void> {
    await test.step(`Application hook drawer should hold ${count} app(s)`, async () => {
      await expect(this.appBlocks.getLocator()).toHaveCount(count);
    });
  }

  /** Clone leaves the name for the user, so pass an empty one to check that. */
  async shouldShowHook(hook: HookCase): Promise<void> {
    await test.step(`Application hook drawer should show hook "${hook.name}"`, async () => {
      await this.name.shouldHaveValue(hook.name);
      await this.hookType.shouldBeSelected({ value: hook.type });
      await this.shouldHaveAppCount(hook.apps.length);
      for (const [index, app] of hook.apps.entries()) {
        await this.app(index + 1).shouldShow(app);
      }
    });
  }

  async shouldShowNameError(message: string): Promise<void> {
    await test.step(`Name field should report "${message}"`, async () => {
      await expect(this.nameField.getLocator()).toContainText(message);
    });
  }

  async shouldNotShowNameError(message: string): Promise<void> {
    await test.step(`Name field should not report "${message}"`, async () => {
      await expect(this.nameField.getLocator()).not.toContainText(message);
    });
  }

  async shouldBeClosed(): Promise<void> {
    await test.step('Application hook drawer should be closed', async () => {
      await expect(this.name.getLocator()).toHaveCount(0);
    });
  }
}
