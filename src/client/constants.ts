/** Package id — also the theme override layer source and the loader entry id. */
export const PACKAGE_ID = 'dsh-bloomglass'

/** Body attribute that scopes every injected style. */
export const BODY_ATTR = 'data-dsh-bloomglass'

/**
 * Body attribute that exists only while a wallpaper is actually painted.
 *
 * Kept separate from {@link BODY_ATTR} on purpose: retracting the frost must
 * not retract the palette theme. Its value is the resolved colour scheme.
 */
export const FROST_ATTR = 'data-bloomglass-frost'

/**
 * Body attribute carrying the active palette key.
 *
 * Bloom's stylesheets select on this attribute, so the name is load-bearing:
 * renaming it means rewriting every selector in `css/bloom-*.ts`.
 */
export const VARIANT_ATTR = 'data-bloomglass-variant'

/** Settings locale namespace. */
export const LOCALE_NS = 'settings.bloomglass'

/** localStorage key for knobs (never the image bytes). */
export const KNOBS_KEY = 'dsh-bloomglass:knobs'

/** IndexedDB database that holds the uploaded wallpaper blob. */
export const IMAGE_DB = 'dsh-bloomglass'
export const IMAGE_STORE = 'files'
export const IMAGE_KEY = 'wallpaper'

/** Allowed image MIME types at the upload boundary. */
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

/* ── Migration from the two plugins this one merges ─────────────────────────
 * Both originals shipped to real users, so a one-time read keeps their
 * wallpaper and palette choice instead of silently resetting them.
 */

/** dsh-bloom-theme's palette key. */
export const LEGACY_VARIANT_KEY = 'dsh-bloom-variant'

/** dsh-frosted-window's knob record. */
export const LEGACY_KNOBS_KEY = 'dsh-frosted-window:knobs'

/** dsh-frosted-window's wallpaper database. */
export const LEGACY_IMAGE_DB = 'dsh-frosted-window'
