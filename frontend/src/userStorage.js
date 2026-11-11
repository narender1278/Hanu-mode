export const LEGACY_OWNER_EMAIL = 'kattanarender167@gmail.com';

export function isLegacyOwner(userEmail) {
  return userEmail?.trim().toLowerCase() === LEGACY_OWNER_EMAIL;
}

export function getUserStorageKey(userId, key) {
  return `study_user_${userId}_${key}`;
}

export function readLegacyUserData(legacyKeys = []) {
  for (const key of legacyKeys) {
    const saved = localStorage.getItem(key);
    if (saved === null) continue;

    try {
      return { found: true, value: JSON.parse(saved), sourceKey: key };
    } catch (error) {
      console.error(`Could not migrate saved data from ${key}:`, error);
      throw new Error(`Saved browser data for ${key} is invalid and could not be migrated.`);
    }
  }

  return { found: false, value: undefined };
}
