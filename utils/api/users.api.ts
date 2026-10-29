import { APIRequestContext } from '@playwright/test';
import { CcApiRoutes } from '@data/api-routes';
import { assertResponseOk } from '@utils/generic';
import { BaseApi, apiHeaders } from './base.api';
import type { CcUser, UsersListResponse } from '../../types/api/users';

const SHORTCUTS_PREF_PREFIX = 'shortcuts_org_';

// The /users resource rejects the static API key ("API Key access is not
// allowed for this resource"), so this client authenticates with a Bearer JWT
// captured from a logged-in admin browser session (see the adminJwt fixture).
export class UsersApi extends BaseApi {
  constructor(
    request: APIRequestContext,
    private readonly jwt: string,
  ) {
    super(request);
  }

  protected get headers(): Record<string, string> {
    return apiHeaders(this.jwt);
  }

  async findByEmail(email: string): Promise<CcUser | undefined> {
    const response = await this.request.get(this.url(CcApiRoutes.USERS), {
      headers: this.headers,
      params: { where: JSON.stringify({ email }) },
    });
    await assertResponseOk(response, 'GET users');
    const body = (await response.json()) as UsersListResponse;
    return body._items[0];
  }

  async remove(user: CcUser): Promise<void> {
    const response = await this.request.delete(this.url(`${CcApiRoutes.USERS}/${user._id}`), {
      // Eve REST API rejects DELETE without the resource's current etag.
      headers: { ...this.headers, 'If-Match': user._etag },
    });
    await assertResponseOk(response, `DELETE users/${user._id}`);
  }

  /** Removes the user from the organization if present. Returns true when something was deleted. */
  async removeByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }
    await this.remove(user);
    return true;
  }

  /**
   * Clears the server-side "do not show the help dialog again" flag (confirming the
   * modal's close option PUTs `uiprefs.helpdialog: "disabled"` onto the account). A no-op
   * when the flag is already clear, so it is safe to call both before and after a test.
   */
  async resetHelpDialogPreference(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user?.uiprefs?.helpdialog) {
      return;
    }
    const uiprefs = { ...user.uiprefs };
    delete uiprefs.helpdialog;
    await this.putUiprefs(user, uiprefs);
  }

  /** Every `uiprefs.shortcuts_org_<organization id>` key (a JSON-encoded list of shortcut ids), as is. */
  async getShortcuts(email: string): Promise<Record<string, unknown>> {
    const user = await this.findByEmail(email);
    return Object.fromEntries(
      Object.entries(user?.uiprefs ?? {}).filter(([key]) => key.startsWith(SHORTCUTS_PREF_PREFIX)),
    );
  }

  /** Puts back the shortcuts read by getShortcuts() — order included — and drops any added since. */
  async restoreShortcuts(email: string, shortcuts: Record<string, unknown>): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error(`User ${email} not found`);
    }
    const uiprefs = Object.fromEntries(
      Object.entries(user.uiprefs ?? {}).filter(([key]) => !key.startsWith(SHORTCUTS_PREF_PREFIX)),
    );
    await this.putUiprefs(user, { ...uiprefs, ...shortcuts });
  }

  // The SPA sends this exact body for a uiprefs change; the PUT replaces the whole user document.
  private async putUiprefs(user: CcUser, uiprefs: Record<string, unknown>): Promise<void> {
    const response = await this.request.put(this.url(`${CcApiRoutes.USERS}/${user._id}`), {
      headers: { ...this.headers, 'If-Match': user._etag },
      data: {
        name: user.name,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        send_alert_emails: user.send_alert_emails,
        paid: user.paid,
        cc_user_email: user.cc_user_email,
        uiprefs,
      },
    });
    await assertResponseOk(response, `PUT users/${user._id}`);
  }
}
