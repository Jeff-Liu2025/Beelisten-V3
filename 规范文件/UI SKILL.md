---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient. Integrations: shadcn/ui MCP for component search and examples."
license: MIT
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## When to Apply This Skill

This Skill should be used when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use

This Skill must be invoked in the following situations:

- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving perceived quality, clarity, or usability of interfaces

### Recommended

This Skill is recommended in the following situations:

- UI looks "not professional enough" but the reason is unclear
- Receiving feedback on usability or experience
- Pre-launch UI quality optimization
- Aligning cross-platform design (Web / iOS / Android)
- Building design systems or reusable component libraries

### Skip

This Skill is not needed in the following situations:

- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work
- Non-visual scripts or automation tasks

**Decision criteria**: If the task will change how a feature **looks, feels, moves, or is interacted with**, this Skill should be used.

## Rule Categories by Priority

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | `ux` | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text (large text 3:1)
- `focus-states` - Visible focus rings on interactive elements (2–4px)
- `alt-text` - Descriptive alt text for meaningful images
- `aria-labels` - aria-label for icon-only buttons
- `keyboard-nav` - Tab order matches visual order; full keyboard support
- `form-labels` - Use label with for attribute
- `skip-links` - Skip to main content for keyboard users
- `heading-hierarchy` - Sequential h1→h6, no level skip
- `color-not-only` - Don't convey info by color alone (add icon/text)
- `dynamic-type` - Support system text scaling; avoid truncation as text grows
- `reduced-motion` - Respect prefers-reduced-motion; reduce/disable animations when requested
- `voiceover-sr` - Meaningful accessibilityLabel/accessibilityHint; logical reading order
- `escape-routes` - Provide cancel/back in modals and multi-step flows
- `keyboard-shortcuts` - Preserve system and a11y shortcuts

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Min 44×44pt (Apple) / 48×48dp (Material)
- `touch-spacing` - Minimum 8px/8dp gap between touch targets
- `hover-vs-tap` - Use click/tap for primary interactions; don't rely on hover alone
- `loading-buttons` - Disable button during async operations; show spinner or progress
- `error-feedback` - Clear error messages near problem
- `cursor-pointer` - Add cursor-pointer to clickable elements (Web)
- `gesture-conflicts` - Avoid horizontal swipe on main content; prefer vertical scroll
- `tap-delay` - Use touch-action: manipulation to reduce 300ms delay (Web)
- `standard-gestures` - Use platform standard gestures consistently
- `system-gestures` - Don't block system gestures
- `press-feedback` - Visual feedback on press (ripple/highlight)
- `haptic-feedback` - Use haptic for confirmations and important actions; avoid overuse
- `gesture-alternative` - Always provide visible controls for critical actions
- `safe-area-awareness` - Keep primary touch targets away from notch, Dynamic Island, gesture bar
- `no-precision-required` - Avoid requiring pixel-perfect taps on small icons
- `swipe-clarity` - Swipe actions must show clear affordance or hint
- `drag-threshold` - Use a movement threshold before starting drag

### 3. Performance (HIGH)

- `image-optimization` - Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- `image-dimension` - Declare width/height or use aspect-ratio to prevent layout shift (CLS)
- `font-loading` - Use font-display: swap/optional to avoid invisible text (FOIT)
- `font-preload` - Preload only critical fonts
- `critical-css` - Prioritize above-the-fold CSS
- `lazy-loading` - Lazy load non-hero components via dynamic import / route-level splitting
- `bundle-splitting` - Split code by route/feature (React Suspense / Next.js dynamic)
- `third-party-scripts` - Load third-party scripts async/defer
- `reduce-reflows` - Avoid frequent layout reads/writes; batch DOM reads then writes
- `content-jumping` - Reserve space for async content to avoid layout jumps
- `lazy-load-below-fold` - Use loading="lazy" for below-the-fold images
- `virtualize-lists` - Virtualize lists with 50+ items
- `main-thread-budget` - Keep per-frame work under ~16ms for 60fps
- `progressive-loading` - Use skeleton screens / shimmer instead of long blocking spinners
- `input-latency` - Keep input latency under ~100ms for taps/scrolls
- `tap-feedback-speed` - Provide visual feedback within 100ms of tap
- `debounce-throttle` - Use debounce/throttle for high-frequency events
- `offline-support` - Provide offline state messaging and basic fallback
- `network-fallback` - Offer degraded modes for slow networks

### 4. Style Selection (HIGH)

- `style-match` - Match style to product type
- `consistency` - Use same style across all pages
- `no-emoji-icons` - Use SVG icons (Heroicons, Lucide), not emojis
- `color-palette-from-product` - Choose palette from product/industry
- `effects-match-style` - Shadows, blur, radius aligned with chosen style
- `platform-adaptive` - Respect platform idioms (iOS HIG vs Material)
- `state-clarity` - Make hover/pressed/disabled states visually distinct
- `elevation-consistent` - Use a consistent elevation/shadow scale
- `dark-mode-pairing` - Design light/dark variants together
- `icon-style-consistent` - Use one icon set/visual language across the product
- `system-controls` - Prefer native/system controls over fully custom ones
- `blur-purpose` - Use blur to indicate background dismissal, not as decoration
- `primary-action` - Each screen should have only one primary CTA

### 5. Layout & Responsive (HIGH)

- `viewport-meta` - width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` - Design mobile-first, then scale up to tablet and desktop
- `breakpoint-consistency` - Use systematic breakpoints (e.g. 375 / 768 / 1024 / 1440)
- `readable-font-size` - Minimum 16px body text on mobile
- `line-length-control` - Mobile 35–60 chars per line; desktop 60–75 chars
- `horizontal-scroll` - No horizontal scroll on mobile
- `spacing-scale` - Use 4pt/8dp incremental spacing system
- `touch-density` - Keep component spacing comfortable for touch
- `container-width` - Consistent max-width on desktop (max-w-6xl / 7xl)
- `z-index-management` - Define layered z-index scale
- `fixed-element-offset` - Fixed navbar/bottom bar must reserve safe padding
- `scroll-behavior` - Avoid nested scroll regions
- `viewport-units` - Prefer min-h-dvh over 100vh on mobile
- `orientation-support` - Keep layout readable and operable in landscape mode
- `content-priority` - Show core content first on mobile
- `visual-hierarchy` - Establish hierarchy via size, spacing, contrast

### 6. Typography & Color (MEDIUM)

- `line-height` - Use 1.5-1.75 for body text
- `line-length` - Limit to 65-75 characters per line
- `font-pairing` - Match heading/body font personalities
- `font-scale` - Consistent type scale (e.g. 12 14 16 18 24 32)
- `contrast-readability` - Darker text on light backgrounds
- `text-styles-system` - Use platform type system
- `weight-hierarchy` - Use font-weight to reinforce hierarchy
- `color-semantic` - Define semantic color tokens, not raw hex in components
- `color-dark-mode` - Dark mode uses desaturated / lighter tonal variants, not inverted colors
- `color-accessible-pairs` - Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA)
- `color-not-decorative-only` - Functional color must include icon/text
- `truncation-strategy` - Prefer wrapping over truncation
- `letter-spacing` - Respect default letter-spacing per platform
- `number-tabular` - Use tabular/monospaced figures for data columns
- `whitespace-balance` - Use whitespace intentionally to group related items

### 7. Animation (MEDIUM)

- `duration-timing` - Use 150–300ms for micro-interactions; complex transitions ≤400ms
- `transform-performance` - Use transform/opacity only; avoid animating width/height/top/left
- `loading-states` - Show skeleton or progress indicator when loading exceeds 300ms
- `excessive-motion` - Animate 1-2 key elements per view max
- `easing` - Use ease-out for entering, ease-in for exiting
- `motion-meaning` - Every animation must express a cause-effect relationship
- `state-transition` - State changes should animate smoothly, not snap
- `continuity` - Page/screen transitions should maintain spatial continuity
- `parallax-subtle` - Use parallax sparingly; must respect reduced-motion
- `spring-physics` - Prefer spring/physics-based curves for natural feel
- `exit-faster-than-enter` - Exit animations shorter than enter (~60–70% of enter duration)
- `stagger-sequence` - Stagger list/grid item entrance by 30–50ms per item
- `shared-element-transition` - Use shared element / hero transitions for visual continuity
- `interruptible` - Animations must be interruptible
- `no-blocking-animation` - Never block user input during an animation
- `fade-crossfade` - Use crossfade for content replacement within the same container
- `scale-feedback` - Subtle scale (0.95–1.05) on press for tappable cards/buttons
- `gesture-feedback` - Drag, swipe, and pinch must provide real-time visual response
- `hierarchy-motion` - Use translate/scale direction to express hierarchy
- `motion-consistency` - Unify duration/easing tokens globally
- `opacity-threshold` - Fading elements should not linger below opacity 0.2
- `modal-motion` - Modals/sheets should animate from their trigger source
- `navigation-direction` - Forward navigation animates left/up; backward animates right/down
- `layout-shift-avoid` - Animations must not cause layout reflow or CLS

### 8. Forms & Feedback (MEDIUM)

- `input-labels` - Visible label per input (not placeholder-only)
- `error-placement` - Show error below the related field
- `submit-feedback` - Loading then success/error state on submit
- `required-indicators` - Mark required fields (e.g. asterisk)
- `empty-states` - Helpful message and action when no content
- `toast-dismiss` - Auto-dismiss toasts in 3-5s
- `confirmation-dialogs` - Confirm before destructive actions
- `input-helper-text` - Provide persistent helper text below complex inputs
- `disabled-states` - Disabled elements use reduced opacity (0.38–0.5)
- `progressive-disclosure` - Reveal complex options progressively
- `inline-validation` - Validate on blur (not keystroke)
- `input-type-keyboard` - Use semantic input types (email, tel, number)
- `password-toggle` - Provide show/hide toggle for password fields
- `autofill-support` - Use autocomplete attributes for system autofill
- `undo-support` - Allow undo for destructive or bulk actions
- `success-feedback` - Confirm completed actions with brief visual feedback
- `error-recovery` - Error messages must include a clear recovery path
- `multi-step-progress` - Multi-step flows show step indicator or progress bar
- `form-autosave` - Long forms should auto-save drafts
- `sheet-dismiss-confirm` - Confirm before dismissing a sheet/modal with unsaved changes
- `error-clarity` - Error messages must state cause + how to fix
- `field-grouping` - Group related fields logically
- `focus-management` - After submit error, auto-focus the first invalid field
- `touch-friendly-input` - Mobile input height ≥44px
- `destructive-emphasis` - Destructive actions use semantic danger color (red)
- `toast-accessibility` - Toasts must not steal focus; use aria-live="polite"
- `contrast-feedback` - Error and success state colors must meet 4.5:1 contrast ratio

### 9. Navigation Patterns (HIGH)

- `bottom-nav-limit` - Bottom navigation max 5 items; use labels with icons
- `drawer-usage` - Use drawer/sidebar for secondary navigation, not primary actions
- `back-behavior` - Back navigation must be predictable and consistent
- `deep-linking` - All key screens must be reachable via deep link / URL
- `tab-bar-ios` - iOS: use bottom Tab Bar for top-level navigation
- `top-app-bar-android` - Android: use Top App Bar for primary structure
- `nav-label-icon` - Navigation items must have both icon and text label
- `nav-state-active` - Current location must be visually highlighted
- `nav-hierarchy` - Primary nav vs secondary nav must be clearly separated
- `modal-escape` - Modals and sheets must offer a clear close/dismiss affordance
- `search-accessible` - Search must be easily reachable
- `breadcrumb-web` - Web: use breadcrumbs for 3+ level deep hierarchies
- `state-preservation` - Navigating back must restore previous scroll position
- `gesture-nav-support` - Support system gesture navigation without conflict
- `tab-badge` - Use badges on nav items sparingly
- `overflow-menu` - When actions exceed space, use overflow/more menu
- `bottom-nav-top-level` - Bottom nav is for top-level screens only
- `adaptive-navigation` - Large screens (≥1024px) prefer sidebar
- `back-stack-integrity` - Never silently reset the navigation stack
- `navigation-consistency` - Navigation placement must stay the same across all pages
- `avoid-mixed-patterns` - Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- `modal-vs-navigation` - Modals must not be used for primary navigation flows
- `focus-on-route-change` - After page transition, move focus to main content region
- `persistent-nav` - Core navigation must remain reachable from deep pages
- `destructive-nav-separation` - Dangerous actions must be visually and spatially separated from normal nav
- `empty-nav-state` - When a nav destination is unavailable, explain why

### 10. Charts & Data (LOW)

- `chart-type` - Match chart type to data type
- `color-guidance` - Use accessible color palettes; avoid red/green only pairs
- `data-table` - Provide table alternative for accessibility
- `pattern-texture` - Supplement color with patterns, textures, or shapes
- `legend-visible` - Always show legend near the chart
- `tooltip-on-interact` - Provide tooltips/data labels on hover or tap
- `axis-labels` - Label axes with units and readable scale
- `responsive-chart` - Charts must reflow or simplify on small screens
- `empty-data-state` - Show meaningful empty state when no data exists
- `loading-chart` - Use skeleton or shimmer while chart data loads
- `animation-optional` - Chart entrance animations must respect prefers-reduced-motion
- `large-dataset` - For 1000+ data points, aggregate or sample
- `number-formatting` - Use locale-aware formatting for numbers, dates, currencies
- `touch-target-chart` - Interactive chart elements must have ≥44pt tap area
- `no-pie-overuse` - Avoid pie/donut for >5 categories; switch to bar chart
- `contrast-data` - Data lines/bars vs background ≥3:1
- `legend-interactive` - Legends should be clickable to toggle series visibility
- `direct-labeling` - For small datasets, label values directly on the chart
- `tooltip-keyboard` - Tooltip content must be keyboard-reachable
- `sortable-table` - Data tables must support sorting with aria-sort
- `axis-readability` - Axis ticks must not be cramped
- `data-density` - Limit information density per chart to avoid cognitive overload
- `trend-emphasis` - Emphasize data trends over decoration
- `gridline-subtle` - Grid lines should be low-contrast (e.g. gray-200)
- `focusable-elements` - Interactive chart elements must be keyboard-navigable
- `screen-reader-summary` - Provide a text summary or aria-label describing the chart's key insight
- `error-state-chart` - Data load failure must show error message with retry action
- `export-option` - For data-heavy products, offer CSV/image export
- `drill-down-consistency` - Drill-down interactions must maintain a clear back-path
- `time-scale-clarity` - Time series charts must clearly label time granularity

## How to Use

### Step 1: Analyze User Requirements

Extract key information from user request:
- **Product type**: Entertainment, Tool, Productivity, or hybrid
- **Target audience**: Consider age group, usage context
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, HTML/CSS

### Step 2: Apply Design Principles

Based on the product type and style keywords, select the appropriate design system:

1. Choose a **style** that matches the product type and audience
2. Select a **color palette** that aligns with the brand and industry
3. Pick **font pairings** that reinforce the tone and hierarchy
4. Define **spacing and layout** using the 4/8pt grid system
5. Plan **animation and motion** with platform-native timing

### Step 3: Follow Priority Rules

Apply rules in priority order (1=CRITICAL → 10=LOW):

1. **Accessibility** — Always first; no exceptions
2. **Touch & Interaction** — Meet minimum sizes and feedback requirements
3. **Performance** — Optimize images, fonts, and loading
4. **Style** — Consistent, platform-appropriate visual language
5. **Layout** — Mobile-first, responsive, safe-area aware
6. **Typography & Color** — Semantic tokens, contrast compliance
7. **Animation** — Purposeful, interruptible, performance-safe
8. **Forms** — Labeled, validated, feedback-rich
9. **Navigation** — Predictable, deep-linkable, state-preserving
10. **Charts** — Accessible, responsive, appropriately typed

### Step 4: Pre-Delivery Checklist

Before delivering any UI code, verify:

**Visual Quality**
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons come from a consistent icon family and style
- [ ] Semantic theme tokens are used consistently (no ad-hoc hardcoded colors)
- [ ] Pressed-state visuals do not shift layout bounds

**Interaction**
- [ ] All tappable elements provide clear pressed feedback
- [ ] Touch targets meet minimum size (≥44×44pt iOS, ≥48×48dp Android)
- [ ] Micro-interaction timing stays in the 150-300ms range
- [ ] Disabled states are visually clear and non-interactive
- [ ] Screen reader focus order matches visual order

**Light/Dark Mode**
- [ ] Primary text contrast ≥4.5:1 in both light and dark mode
- [ ] Secondary text contrast ≥3:1 in both modes
- [ ] Both themes are tested before delivery

**Layout**
- [ ] Safe areas are respected for headers, tab bars, and bottom CTA bars
- [ ] Scroll content is not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, and tablet (portrait + landscape)
- [ ] 4/8dp spacing rhythm is maintained throughout

**Accessibility**
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion and dynamic text size are supported

## Common Rules for Professional UI

### Icons & Visual Elements

| Rule | Standard | Avoid | Why |
|------|----------|-------|-----|
| **No Emoji as Structural Icons** | Use vector-based icons (Lucide, Heroicons) | Using emojis for navigation or controls | Emojis are font-dependent and inconsistent |
| **Vector-Only Assets** | Use SVG or platform vector icons | Raster PNG icons that blur | Ensures scalability and dark mode support |
| **Consistent Icon Sizing** | Define icon sizes as design tokens | Mixing arbitrary values randomly | Maintains rhythm and visual hierarchy |
| **Stroke Consistency** | Use a consistent stroke width (e.g., 1.5px or 2px) | Mixing thick and thin stroke styles | Inconsistency reduces perceived polish |
| **Filled vs Outline Discipline** | Use one icon style per hierarchy level | Mixing filled and outline at same level | Maintains semantic clarity |
| **Touch Target Minimum** | Minimum 44×44pt interactive area | Small icons without expanded tap area | Meets accessibility standards |
| **Icon Contrast** | Follow WCAG 4.5:1 for small elements | Low-contrast icons that blend in | Ensures accessibility in both modes |

### Interaction

| Rule | Do | Don't |
|------|----|-------|
| **Tap feedback** | Provide pressed feedback (ripple/opacity) within 80-150ms | No visual response on tap |
| **Animation timing** | Keep micro-interactions around 150-300ms | Instant transitions or slow animations (>500ms) |
| **Accessibility focus** | Ensure screen reader focus order matches visual order | Unlabeled controls or confusing focus traversal |
| **Disabled state clarity** | Use disabled semantics, reduced emphasis, no tap action | Controls that look tappable but do nothing |
| **Touch target minimum** | Keep tap areas ≥44×44pt (iOS) or ≥48×48dp (Android) | Tiny tap targets without padding |
| **Gesture conflict prevention** | Keep one primary gesture per region | Overlapping gestures causing accidental actions |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|-------|
| **Text contrast (light)** | Maintain body text contrast ≥4.5:1 | Low-contrast gray body text |
| **Text contrast (dark)** | Maintain primary text ≥4.5:1, secondary ≥3:1 | Dark mode text that blends into background |
| **Token-driven theming** | Use semantic color tokens mapped per theme | Hardcoded per-screen hex values |
| **Scrim and modal legibility** | Use modal scrim at 40-60% black | Weak scrim that competes with foreground |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|-------|
| **Safe-area compliance** | Respect top/bottom safe areas | Placing fixed UI under notch or gesture area |
| **8dp spacing rhythm** | Use a consistent 4/8dp spacing system | Random spacing increments with no rhythm |
| **Readable text measure** | Keep long-form text readable on large devices | Full-width long text on tablets |
| **Section spacing hierarchy** | Define clear vertical rhythm tiers (16/24/32/48) | Similar UI levels with inconsistent spacing |
| **Adaptive gutters by breakpoint** | Increase horizontal insets on larger widths | Same narrow gutter on all device sizes |
| **Scroll and fixed element coexistence** | Add content insets so lists are not hidden | Scroll content obscured by sticky headers/footers |
