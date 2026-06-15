/**
 * Design System Constants
 * Centralized spacing, sizing, and styling values
 * Use these instead of magic numbers for consistency
 */

// ========== SPACING SCALE (8px base) ==========
export const SPACING = {
  xs: 4,      // minimal gaps, badge padding
  sm: 8,      // tight spacing, list gaps
  md: 12,     // standard item spacing, section padding
  lg: 16,     // comfortable spacing, screen padding
  xl: 20,     // large section spacing
  xxl: 24,    // major section divider
};

// ========== BORDER RADIUS SCALE ==========
export const BORDER_RADIUS = {
  tight: 4,       // badges, small elements
  small: 8,       // button groups, small containers
  medium: 12,     // inputs, small cards, icon boxes
  large: 14,      // standard cards, buttons
  xlarge: 16,     // containers, modules
  rounded: 20,    // pill buttons, full roundness
  header: 24,     // header bottom corners
};

// ========== TYPOGRAPHY SCALE ==========
export const FONT_SIZES = {
  xs: 10,         // badge text, tiny labels
  sm: 11,         // small secondary text
  base: 12,       // body text, standard
  md: 13,         // normal text
  lg: 14,         // larger body text
  xl: 15,         // input text, larger body
  '2xl': 16,      // section headers, input labels
  '3xl': 18,      // larger titles
  '4xl': 24,      // major titles
  '5xl': 28,      // screen titles
};

export const FONT_WEIGHTS = {
  regular: '400',    // normal text
  medium: '500',     // filter labels, secondary headers
  semibold: '600',   // labels, meta text, badge text
  bold: '700',       // headers, important values
};

// ========== SHADOWS & ELEVATION ==========
export const SHADOWS = {
  none: { shadowOpacity: 0 },
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};

// ========== COLOR OPACITY HELPERS ==========
export const OPACITY = {
  light: 0.1,     // light tint backgrounds (10%)
  medium: 0.15,   // medium tint backgrounds (15%)
  heavy: 0.2,     // strong tint backgrounds (20%)
};

// ========== ICON SIZES ==========
export const ICON_SIZES = {
  xs: 10,       // badge icons
  sm: 14,       // secondary icons
  md: 18,       // normal/medium icons
  lg: 20,       // primary action icons
  xl: 24,       // featured/header icons
  '2xl': 28,    // large featured icons
  '3xl': 32,    // modal/hero icons
};

// ========== BUTTON SIZES ==========
export const BUTTON_SIZES = {
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderRadius: BORDER_RADIUS.medium,
  },
  md: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderRadius: BORDER_RADIUS.large,
  },
  lg: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderRadius: BORDER_RADIUS.large,
  },
  xl: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    borderRadius: BORDER_RADIUS.large,
  },
};

// ========== COMMON LAYOUT PATTERNS ==========
export const LAYOUTS = {
  screenPadding: SPACING.lg,        // 16px - standard screen horizontal padding
  cardPadding: SPACING.lg,          // 16px - card internal padding
  itemGap: SPACING.sm,              // 8px - gap between list items
  sectionGap: SPACING.lg,           // 16px - gap between major sections
  sectionGapLarge: SPACING.xxl,     // 24px - gap between large sections
  inputHeight: 48,                  // standard input field height
  iconBoxSize: 40,                  // standard icon box size (40x40)
};

// ========== PROGRESS BAR SIZES ==========
export const PROGRESS_BAR = {
  large: { height: 8, borderRadius: 4 },      // prominent progress bars
  medium: { height: 6, borderRadius: 3 },     // standard progress bars
  small: { height: 4, borderRadius: 2 },      // subtle progress indicators
};

// ========== BADGE SIZES ==========
export const BADGE_SIZES = {
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: FONT_SIZES.xs,
    icon: ICON_SIZES.xs,
    gap: 3,
  },
  md: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: FONT_SIZES.sm,
    icon: ICON_SIZES.sm,
    gap: 4,
  },
  lg: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: FONT_SIZES.base,
    icon: ICON_SIZES.md,
    gap: 6,
  },
};

// ========== TEXT TRUNCATION ==========
export const TEXT_LIMIT = {
  singleLine: 1,      // single line ellipsis
  twoLines: 2,        // two line max
  threeLines: 3,      // three line max
};

// ========== ANIMATION TIMING ==========
export const ANIMATION = {
  fast: 300,          // quick animations
  normal: 500,        // standard animations
  slow: 800,          // slow animations
  staggerDelay: 100,  // list item stagger delay
};
