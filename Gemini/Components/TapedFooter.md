# Component: Footer
**Path:** `src/components/Footer.jsx`

## Description
A modern "taped design" footer with a slight -1 degree tilt and a rounded container.

## Implementation Details
- **Aesthetic:** Uses SVG "tape" elements at the corners.
- **Tilt:** Applied `-rotate-1` to the entire footer.
- **Content:** Groups PixConvert tools into PDF Tools, Image Tools, and Company sections.
- **Branding:** Reverted to the original orange-red PixConvert SVG logo.
- **Theme Awareness:** Uses `bg-white` / `dark:bg-slate-900` and responds to `data-theme` attribute.

## Refinements
- Tailwind config updated to `darkMode: ['selector', '[data-theme="dark"]']` to fix theme switching issues.
