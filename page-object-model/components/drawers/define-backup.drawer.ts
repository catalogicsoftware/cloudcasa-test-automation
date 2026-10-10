import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { BaseDrawer } from './base.drawer';

export class DefineBackupWizard extends BaseDrawer {
  readonly next: Button;

  private readonly WIZARD_STEPS = ['Cluster', 'Selections', 'App hooks', 'Policy', 'Summary'];
  // Every step but the first: it is the active one, the rest wait on a cluster selection.
  private readonly STEPS_LOCKED_WITHOUT_CLUSTER = this.WIZARD_STEPS.slice(1);

  constructor(page: Page) {
    super(page, 'app-backup-cluster', 'Define cluster backup', 'Create');

    this.next = new Button({
      page,
      locator: this.scoped('button:has-text("Next")'),
      name: 'Next',
    });
  }

  /**
   * The host element only wraps a fixed-position panel, so it measures 0x0 and
   * never counts as visible — the footer button is the reliable open signal
   * (see AddObjectStorageWizard.shouldBeOpened for the same gotcha).
   */
  async shouldBeOpened(): Promise<void> {
    await this.next.shouldBeVisible();
  }

  async shouldBeClosed(): Promise<void> {
    await test.step('Wizard should be closed', async () => {
      await expect(this.page.locator(this.scoped('button:has-text("Next")'))).toHaveCount(0);
    });
  }

  async shouldHaveWizardSteps(): Promise<void> {
    await test.step('Wizard should show the Cluster / Selections / App hooks / Policy / Summary steps', async () => {
      for (const step of this.WIZARD_STEPS) {
        await expect(
          this.page.locator(this.scoped(`.step-name:text-is("${step}")`)),
        ).toBeVisible();
      }
    });
  }

  async shouldLockStepsWithoutACluster(): Promise<void> {
    await test.step('Steps 2 to 5 should stay disabled while no cluster is selected', async () => {
      for (const step of this.STEPS_LOCKED_WITHOUT_CLUSTER) {
        await expect(
          this.page.locator(this.scoped(`.step-btn:has(.step-name:text-is("${step}"))`)),
        ).toBeDisabled();
      }
    });
  }

  async shouldDisableNextAndCreate(): Promise<void> {
    await test.step('"Next" and "Create" should be disabled while no cluster is selected', async () => {
      await this.next.shouldBeDisabled();
      await this.submit.shouldBeDisabled();
    });
  }
}
