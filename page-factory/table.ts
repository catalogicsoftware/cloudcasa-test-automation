import test, { expect, Locator } from '@playwright/test';
import { Component } from './component';

export class Table extends Component {
  get typeOf(): string {
    return 'table';
  }

  /** All data rows of the table body. */
  private get rows(): Locator {
    return this.getLocator().locator('tbody tr.table__row');
  }

  /**
   * Header sort buttons carry the column titles. Service header cells
   * (row actions, column selector) have no sort button and come after all
   * data columns, so the index among sort buttons equals the td index.
   */
  private get headerTitles(): Locator {
    return this.getLocator().locator('thead th.table__header-cell button.table__sort-button');
  }

  /**
   * Resolved at call time from the visible headers: columns can be hidden
   * via the column selector, but th and td disappear in pairs, so the
   * header index always matches the cell index.
   */
  private async columnIndex(columnTitle: string): Promise<number> {
    const titles = (await this.headerTitles.allInnerTexts()).map(title => title.trim());
    const index = titles.indexOf(columnTitle);

    if (index === -1) {
      throw new Error(
        `The ${this.typeOf} with name "${this.componentName}" and locator "${this.locator}" has no column "${columnTitle}". Visible columns: ${titles.join(', ')}`,
      );
    }

    return index;
  }

  /** Row containing the text (usually a unique value such as an email). No assertion — for composition. */
  getRow(text: string | RegExp): Locator {
    return this.rows.filter({ hasText: text });
  }

  private async getCell(rowText: string | RegExp, columnTitle: string): Promise<Locator> {
    const index = await this.columnIndex(columnTitle);
    return this.getRow(rowText).locator('td').nth(index);
  }

  async getCellValue(rowText: string | RegExp, columnTitle: string): Promise<string> {
    return test.step(`Get value of cell "${columnTitle}" in row "${rowText}" of ${this.typeOf} "${this.componentName}"`, async () => {
      const cell = await this.getCell(rowText, columnTitle);
      return (await cell.innerText()).trim();
    });
  }

  async shouldHaveCellValue(
    rowText: string | RegExp,
    columnTitle: string,
    expected: string | RegExp,
  ): Promise<void> {
    await test.step(`Cell "${columnTitle}" in row "${rowText}" of ${this.typeOf} "${this.componentName}" should have value "${expected}"`, async () => {
      const cell = await this.getCell(rowText, columnTitle);
      await expect(cell, {
        message: `The ${this.typeOf} with name "${this.componentName}" and locator "${this.locator}" does not have value "${expected}" in cell "${columnTitle}" of row "${rowText}"`,
      }).toContainText(expected);
    });
  }

  async shouldHaveRow(text: string | RegExp): Promise<void> {
    await test.step(`${this.typeOfUpper} "${this.componentName}" should have a row containing "${text}"`, async () => {
      await expect(this.getRow(text), {
        message: `The ${this.typeOf} with name "${this.componentName}" and locator "${this.locator}" has no visible row containing "${text}"`,
      }).toBeVisible();
    });
  }

  async shouldNotHaveRow(text: string | RegExp): Promise<void> {
    await test.step(`${this.typeOfUpper} "${this.componentName}" should not have a row containing "${text}"`, async () => {
      await expect(this.getRow(text), {
        message: `The ${this.typeOf} with name "${this.componentName}" and locator "${this.locator}" unexpectedly has a row containing "${text}"`,
      }).toHaveCount(0);
    });
  }

  /** Row action buttons are revealed on hover, hence the hover before the click. */
  async clickRowAction(rowText: string | RegExp, actionName: string): Promise<void> {
    await test.step(`Click "${actionName}" action in row "${rowText}" of ${this.typeOf} "${this.componentName}"`, async () => {
      const row = this.getRow(rowText);
      await row.hover();
      await row.locator('td.table__actions-wrapper button', { hasText: actionName }).click();
    });
  }
}
