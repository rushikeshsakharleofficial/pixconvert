# Component: ToolMarquee
**Path:** `src/components/ui/tool-marquee.jsx`

## Description
A dynamic, infinite scrolling slider that showcases available tools from `toolsData.js`. It uses two rows moving in opposite directions to create a lively, "alive" feel for the home page.

## Implementation Details
- **Logic:** Flattens categories from `toolsData` and splits them into two rows.
- **Animation:** CSS-based `marqueeScroll` using `translateX` for high performance.
- **Styling:** Transparent container with faded edges (`bg-gradient-to-r from-background`) to blend with the main theme.
- **Icons:** Uses original emojis wrapped in a theme-aware background with 20% opacity.
- **Theme Awareness:** Fully compatible with Light/Dark modes via Tailwind variables.

## Dependencies
- `react-router-dom` (Link)
- `toolsData.js`
- `Card` UI component
