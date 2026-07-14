/**
 * Manages "Colors Used" history in localStorage.
 *
 * Each entry: { hex, name, lastSeenLogins }
 * "lastSeenLogins" = the login-session count when the color was last found on an active spool.
 * Colors not found on any active spool for 3 login sessions are pruned.
 *
 * loginCount is stored in localStorage and incremented once per session (sessionStorage gate).
 */

const STORAGE_KEY = "spoolmeterx_color_history";
const LOGIN_COUNT_KEY = "spoolmeterx_login_count";
const SESSION_KEY = "spoolmeterx_session_counted";
const PRUNE_AFTER_LOGINS = 3;

function getLoginCount() {
  return parseInt(localStorage.getItem(LOGIN_COUNT_KEY) || "0");
}

function incrementLoginCountIfNeeded() {
  if (!sessionStorage.getItem(SESSION_KEY)) {
    const next = getLoginCount() + 1;
    localStorage.setItem(LOGIN_COUNT_KEY, String(next));
    sessionStorage.setItem(SESSION_KEY, "1");
  }
  return getLoginCount();
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Syncs color history against the current list of active (non-empty) spools.
 * - Adds new colors from spools.
 * - Updates lastSeenLogins for colors that still exist.
 * - Prunes colors unseen for >= PRUNE_AFTER_LOGINS sessions.
 * Returns the updated history array.
 */
export function syncColorHistory(spools) {
  const loginCount = incrementLoginCountIfNeeded();
  let history = loadHistory();

  const activeColors = new Map(); // hex -> name (from non-empty spools)
  for (const spool of spools) {
    if (spool.is_empty) continue;
    const hex = spool.color_hex;
    const name = spool.color_name;
    if (hex && !activeColors.has(hex)) activeColors.set(hex, name);
  }

  // Update lastSeenLogins for active colors & add new ones
  for (const [hex, name] of activeColors.entries()) {
    const existing = history.find(e => e.hex === hex);
    if (existing) {
      existing.lastSeenLogins = loginCount;
      if (name) existing.name = name; // keep name fresh
    } else {
      history.push({ hex, name, lastSeenLogins: loginCount });
    }
  }

  // Prune colors not seen for PRUNE_AFTER_LOGINS sessions
  history = history.filter(e => loginCount - e.lastSeenLogins < PRUNE_AFTER_LOGINS);

  saveHistory(history);
  return history;
}

/**
 * Returns the current color history array without modifying anything.
 */
export function getColorHistory() {
  return loadHistory();
}