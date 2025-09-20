export interface UserPreferences {
  lastSelectedFacultySlug?: string
  lastSelectedDegreeSlug?: string
  lastVisitedPath?: string
}

export const USER_PREFERENCES_KEY = 'uni-feedback-preferences'

export const userPreferences = {
  get(): UserPreferences {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const stored = localStorage.getItem(USER_PREFERENCES_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('Failed to parse user preferences from localStorage:', error)
      return {}
    }
  },

  set(preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const existing = this.get()
      const updated = { ...existing, ...preferences }
      localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save user preferences to localStorage:', error)
    }
  },

  clear(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(USER_PREFERENCES_KEY)
    } catch (error) {
      console.warn('Failed to clear user preferences from localStorage:', error)
    }
  },

  getLastVisitedPath(): string {
    const prefs = this.get()
    if (prefs.lastVisitedPath) {
      return prefs.lastVisitedPath
    }

    // Fallback: construct path from faculty/degree slugs
    if (prefs.lastSelectedFacultySlug) {
      const facultyPath = `/${prefs.lastSelectedFacultySlug}`
      if (prefs.lastSelectedDegreeSlug) {
        return `${facultyPath}/${prefs.lastSelectedDegreeSlug}`
      }
      return facultyPath
    }

    return '/'
  },

  // Migration helper for existing localStorage format
  migrateFromLegacyFormat(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const legacyFacultyId = localStorage.getItem('selectedFacultyId')
      const legacyDegreeId = localStorage.getItem('selectedDegreeId')

      if (legacyFacultyId || legacyDegreeId) {
        console.log('Found legacy localStorage format, migration may be needed')
        // Note: We can't directly migrate IDs to slugs without faculty/degree data
        // This will be handled by the application when it has access to the data

        // Clean up legacy keys after potential migration
        localStorage.removeItem('selectedFacultyId')
        localStorage.removeItem('selectedDegreeId')
      }
    } catch (error) {
      console.warn('Failed to migrate legacy user preferences:', error)
    }
  },

  // Initialize and migrate on first load
  initialize(): void {
    if (typeof window === 'undefined') {
      return
    }

    // Run migration on first access
    this.migrateFromLegacyFormat()

    // Clear any query cache related keys that might conflict
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('react-query') || key.startsWith('tanstack-query')) {
          // These might contain old cached data that could conflict
          // Let them refresh naturally
        }
      })
    } catch (error) {
      console.warn('Failed to clean query cache keys:', error)
    }
  }
}