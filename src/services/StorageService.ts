const ACCESS_TOKEN_KEY = "gymbro_access_token";
const PENDING_USER_ID_KEY = "gymbro_pending_user_id";

function isBrowser() {
  return typeof window !== "undefined";
}

export const StorageService = {
  getAccessToken() {
    if (!isBrowser()) return null;

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string) {
    if (!isBrowser()) return;

    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken() {
    if (!isBrowser()) return;

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getPendingUserId() {
    if (!isBrowser()) return null;

    const userId = window.localStorage.getItem(PENDING_USER_ID_KEY);

    return userId ? Number(userId) : null;
  },

  setPendingUserId(userId: number) {
    if (!isBrowser()) return;

    window.localStorage.setItem(PENDING_USER_ID_KEY, String(userId));
  },

  removePendingUserId() {
    if (!isBrowser()) return;

    window.localStorage.removeItem(PENDING_USER_ID_KEY);
  },
};
