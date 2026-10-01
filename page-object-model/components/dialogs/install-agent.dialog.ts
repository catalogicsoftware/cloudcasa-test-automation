import { Page, test } from '@playwright/test';
import { Button } from '@page-factory/button';
import { Container } from '@page-factory/container';

const DIALOG = 'mat-dialog-container:has(app-install-cluster-dialog)';

/** The command holds a URL unique to the cluster (`kubeclusteragents/<id>.yaml`) — that token is the identifier rule 14 asks for a regex on. */
export const INSTALL_COMMAND_PATTERN =
  /kubectl apply -f https:\/\/\S+\/kubeclusteragents\/[\w-]+\.yaml/;

export class InstallAgentDialog {
  readonly dialog: Container;
  readonly command: Container;
  readonly closeButton: Button;

  constructor(protected readonly page: Page) {
    this.dialog = new Container({ page, locator: DIALOG, name: 'Install Agent' });
    this.command = new Container({
      page,
      locator: `${DIALOG} app-copy-paste .alert`,
      name: 'Install command',
    });
    this.closeButton = new Button({
      page,
      locator: `${DIALOG} .modal-footer button:has-text("Close")`,
      name: 'Close',
    });
  }

  async close(): Promise<void> {
    await test.step('Close the install instructions', async () => {
      await this.closeButton.click();
    });
  }
}
