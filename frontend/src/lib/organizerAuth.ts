const UNLOCK_KEY = "tradeverse_organizer_unlock";
const PASSKEY_KEY = "tradeverse_organizer_passkey";
const EXPECTED_PASSKEY = "finclub123";

export function isOrganizerUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function getStoredOrganizerPasskey(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(PASSKEY_KEY) ?? "";
}

export function unlockOrganizer(passkey: string): boolean {
  if (passkey !== EXPECTED_PASSKEY) return false;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
    window.sessionStorage.setItem(PASSKEY_KEY, passkey);
  }
  return true;
}

export function lockOrganizer(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(UNLOCK_KEY);
    window.sessionStorage.removeItem(PASSKEY_KEY);
  }
}

/** One-time URL unlock: /market-screen?organizer=finclub123 (not persisted in URL). */
export function tryUnlockFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const key = new URLSearchParams(window.location.search).get("organizer");
  if (key && key === EXPECTED_PASSKEY) {
    return unlockOrganizer(key);
  }
  return false;
}
