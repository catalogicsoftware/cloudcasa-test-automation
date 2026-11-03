import test, { expect, Locator } from '@playwright/test';
import { LocatorProps } from '../types/page-factory/component';
import { Component } from './component';

/** A whole radio group can share one locator — `value` then picks the button inside it. */
type RadioProps = { value?: string } & LocatorProps;

export class Radio extends Component {
  get typeOf(): string {
    return 'radio button';
  }

  private radio({ value, ...locatorProps }: RadioProps): Locator {
    const group = this.getLocator(locatorProps);
    return value ? group.and(this.page.locator(`[value="${value}"]`)) : group;
  }

  private named(value?: string): string {
    return value ? `"${this.componentName}" with value "${value}"` : `"${this.componentName}"`;
  }

  /** The styled label owns the working click handler; the hidden input itself ignores forced clicks. */
  async select(props: RadioProps = {}): Promise<void> {
    await test.step(`Select the ${this.typeOf} ${this.named(props.value)}`, async () => {
      const radio = this.radio(props);
      const id = await radio.getAttribute('id');
      if (!id) throw new Error(`${this.named(props.value)} has no id for its label`);
      await this.page.locator(`label[for="${id}"]`).click();
      await expect(radio).toBeChecked();
    });
  }

  async shouldBeSelected(props: RadioProps = {}): Promise<void> {
    await test.step(`${this.typeOfUpper} ${this.named(props.value)} should be selected`, async () => {
      await expect(this.radio(props)).toBeChecked();
    });
  }

  async shouldNotBeSelected(props: RadioProps = {}): Promise<void> {
    await test.step(`${this.typeOfUpper} ${this.named(props.value)} should not be selected`, async () => {
      await expect(this.radio(props)).not.toBeChecked();
    });
  }
}
