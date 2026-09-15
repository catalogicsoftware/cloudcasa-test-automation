import { Page } from '@playwright/test';

export type ComponentProps = {
  page: Page;
  name?: string;
  locator: string;
};

export type LocatorProps = { locator?: string };
