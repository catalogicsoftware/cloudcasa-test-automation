/**
 * CloudCasa probes the S3 bucket synchronously while answering the create call,
 * so both outcomes of a storage save wait on it: the 2xx and the error toast.
 */
export const BACKEND_PROBE_TIMEOUT = 150_000;

/** The storage list reloads itself once the wizard closes, regularly past the 5s default. */
export const STORAGE_LIST_RELOAD_TIMEOUT = 30_000;

/** testmail's livequery holds the request open until the email arrives, so the wait needs its own bound. */
export const EMAIL_DELIVERY_TIMEOUT = 90_000;

/** Delivery plus the UI around it, so an undelivered email is reported as such instead of as a test timeout. */
export const EMAIL_TEST_TIMEOUT = EMAIL_DELIVERY_TIMEOUT + 90_000;

/** The sign-in redirect chain runs through the IdP and back, so it outlasts a plain navigation. */
export const LOGIN_REDIRECT_TIMEOUT = 45_000;

/** A Formly field can swap its widget when a neighbouring value changes — long enough for the re-render, short enough to fall through. */
export const WIDGET_SWAP_TIMEOUT = 3_000;

/** A confirmation dialog closes only once its backend call answers, which outlasts the 5s expect default. */
export const DIALOG_CLOSE_TIMEOUT = 30_000;

/** Test budget for a flow that saves a storage: the probe plus the UI around it. */
export const STORAGE_TEST_TIMEOUT = BACKEND_PROBE_TIMEOUT + 90_000;
