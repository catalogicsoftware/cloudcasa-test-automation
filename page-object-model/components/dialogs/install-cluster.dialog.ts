import { expect, Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';
import { DIALOG_CLOSE_TIMEOUT } from '@data/timeouts';

const DIALOG = 'mat-dialog-container:has(app-install-cluster-dialog)';

/**
 * The dialog the sidebar opens right after a successful cluster registration. Its default
 * "Manual (kubectl)" tab shows a `kubectl apply -f <url>` command pointing at the generated
 * agent install manifest.
 */
export class InstallClusterDialog {
  readonly dialog: Container;
  readonly closeButton: Button;
  readonly manualInstallCommand: Container;

  constructor(protected readonly page: Page) {
    this.dialog = new Container({ page, locator: DIALOG, name: 'Install Agent' });
    this.closeButton = new Button({
      page,
      locator: `${DIALOG} .modal-footer button:has-text("Close")`,
      name: 'Close',
    });
    this.manualInstallCommand = new Container({
      page,
      locator: `${DIALOG} app-manual-install-cluster app-copy-paste`,
      name: 'Manual (kubectl) install command',
    });
  }

  async shouldBeOpened(): Promise<void> {
    await this.dialog.shouldBeVisible();
  }

  /** The URL a `kubectl apply -f` would fetch — the manifest this contract test parses. */
  async manifestUrl(): Promise<string> {
    return test.step('Read the install manifest URL from the "Manual (kubectl)" command', async () => {
      const commandText = await this.manualInstallCommand.getLocator().innerText();
      const match = commandText.match(/https:\/\/\S+\.yaml/);
      if (!match) {
        throw new Error(`No manifest URL found in the install command: "${commandText}"`);
      }
      return match[0];
    });
  }

  async close(): Promise<void> {
    await test.step('Close the install instructions', async () => {
      await this.closeButton.click();
      await expect(this.dialog.getLocator()).toHaveCount(0, { timeout: DIALOG_CLOSE_TIMEOUT });
    });
  }
}
