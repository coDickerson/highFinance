# Design System Strategy: The Fiscal Architect

## 1. Overview & Creative North Star
**Creative North Star: "The Curated Ledger"**

This design system rejects the cluttered, spreadsheet-heavy anxiety of traditional financial tools. Instead, it adopts the persona of a "High-End Editorial Ledger." The goal is to transform dense treasury data into a narrative of clarity and confidence. We achieve this through **Intentional Asymmetry**—where large, bold display typography offsets dense data grids—and **Tonal Depth**, replacing rigid lines with sophisticated layering. This is not just a tool; it is an authoritative environment that inspires trust through meticulous organization and "breathable" luxury.

---

## 2. Colors: Tonal Architecture
The palette is anchored in deep, authoritative blues (`primary`) and balanced by organic, functional accents for budget categorization.

### The "No-Line" Rule
**Traditional 1px borders are strictly prohibited.** To define sections, use background color shifts. A dashboard should feel like a series of inset and outset planes. For example:
- Use `surface_container_low` for the main canvas.
- Place `surface_container_lowest` (white) elements on top to create a "lifted" interactive card.
- Use `surface_container_high` for sidebar or utility panels to create an "inset" feel.

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of fine paper.
- **Base Layer:** `background` (#faf9fd)
- **Content Zones:** `surface_container`
- **Interactive Cards:** `surface_container_lowest`
- **Hover/Active States:** `surface_container_highest`

### The "Glass & Gradient" Rule
To elevate the "Treasurer" experience from a basic app to a premium platform:
- **Hero CTAs:** Apply a subtle linear gradient from `primary` (#002046) to `primary_container` (#1b365d) at a 135-degree angle.
- **Floating Modals:** Use `surface` with 80% opacity and a `20px backdrop-blur` to create a "frosted glass" effect, ensuring the data below remains a textured memory rather than a distraction.

---

## 3. Typography: The Data Narrative
We utilize a dual-font strategy to balance character with precision.

- **Display & Headlines (Manrope):** Chosen for its modern, geometric structure. Use `display-lg` for total balance figures and `headline-sm` for section headers. This typeface commands authority.
- **Body & Labels (Public Sans):** A neutral, highly legible sans-serif optimized for tabular data. All financial figures, transaction lists, and labels must use Public Sans to ensure maximum readability at small sizes.
- **The "High-Contrast" Scale:** Create editorial impact by pairing a `display-md` (Manrope) value next to a `label-sm` (Public Sans) timestamp. The drastic shift in scale communicates what is "Vital" versus what is "Contextual."

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to simulate height; we use light and opacity.

- **The Layering Principle:** Depth is achieved by "stacking." A `surface_container_lowest` card sitting on a `surface_container_low` background provides enough contrast to be perceived as a separate object without the visual noise of a shadow.
- **Ambient Shadows:** Only for elevated "Floating" elements (e.g., dropdowns, modals). Use a `24px` blur with 6% opacity, using the `on_surface` color (#1a1b1e) to ensure the shadow feels like a natural lighting byproduct.
- **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline_variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Functional Elegance

### Budget Summary Cards
Forbid standard borders. Use a `0.5rem (lg)` corner radius. Each card should feature a "Signature Accent" stripe (4px wide) on the left edge using the budget's category color (`secondary` for surplus, `tertiary` for committed, `error` for overages).

### Transaction Lists
**No Dividers.** Separate transactions using `1rem` of vertical whitespace. Use `body-md` for the merchant name and `title-sm` (Public Sans) for the currency amount. On hover, the entire row should transition to `surface_container_low`.

### Status Indicators (Approval Workflows)
Status indicators are not just text; they are "Signals."
- **Pending:** `tertiary_container` background with `on_tertiary_container` text.
- **Approved:** `secondary_container` background with `on_secondary_container` text.
- **Rejected:** `error_container` background with `on_error_container` text.
- Shape: Use `full` (pill) roundedness with `label-md` uppercase typography.

### Input Fields
Inputs should be "Minimalist Containers." Use `surface_container_high` as the fill. The label should sit in `label-sm` above the field. The active state is signaled by a 2px bottom-border of `primary`, rather than a full box stroke.

---

## 6. Do's and Don'ts

### Do
- **Do** use `secondary` (greens) for income/positive cash flow and `tertiary` (oranges) for warning/neutral budget allocations.
- **Do** maximize whitespace. A treasurer's data is complex; the UI should be the "quiet" in the room.
- **Do** use `on_surface_variant` for metadata (dates, IDs) to keep the primary `on_surface` text reserved for critical financial figures.

### Don't
- **Don't** use pure black (#000000). Always use `on_background` (#1a1b1e) for text to maintain a premium, ink-on-paper feel.
- **Don't** use standard 1px grey dividers. They create "visual cages" around data.
- **Don't** use sharp corners. Financial data is "hard"; the UI should be "soft" to compensate, using the `DEFAULT (0.25rem)` to `xl (0.75rem)` scale.