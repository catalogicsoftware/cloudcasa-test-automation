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

  /** Forced because the styled label covers the input; check() still verifies the state (see README.md). */
  async select(props: RadioProps = {}): Promise<void> {
    await test.step(`Select the ${this.typeOf} ${this.named(props.value)}`, async () => {
      await this.radio(props).check({ force: true });
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
