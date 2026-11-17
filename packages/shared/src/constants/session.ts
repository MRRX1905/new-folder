/** Session cookie and lifetime policy (TD-06). */
export const SESSION_COOKIE_NAME = "rf_sess";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const SESSION_SLIDING_MS = 30 * DAY;
export const SESSION_ABSOLUTE_MS = 90 * DAY;
export const SESSION_ROTATION_INTERVAL_MS = HOUR;
export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_SLIDING_MS / SECOND;

export const LOGIN_WINDOW_MS = 15 * MINUTE;
export const LOGIN_MAX_FAILURES_PER_IP = 5;
export const LOGIN_ACCOUNT_LOCK_MS = 15 * MINUTE;
export const LOGIN_ACCOUNT_LOCK_THRESHOLD = 10;

export const REAUTH_TOKEN_TTL_MS = 5 * MINUTE;
