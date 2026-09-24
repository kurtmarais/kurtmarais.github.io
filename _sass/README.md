# _sass/

`main.scss` — all site styling in one file: colour tokens, layout,
components, dark mode, responsive breakpoints. Compiled via
`assets/css/main.scss` (`@import "main"`).

Only needed for visual design changes, not routine content updates.

Things that catch people out:

- **Icons are SVGs by the time CSS applies.** Font Awesome's JS replaces
  every `<i class="fas …">` with an inline `<svg>`. Any rule that sizes or
  colours an icon must target both:
  ```scss
  .foo i,
  .foo svg { … }
  ```
  Targeting only `i` compiles and silently does nothing.
- **`html { font-size: 85%; }`** — `1rem` ≈ 13.6px, not 16px.
- **Palette** (light / dark):
  - background `#f7f6f1` / `#202421`
  - links/accent `#365b52` / `#9ab8aa`
  - hero card background `#1f352f` / `#f5f1e7`
  - badges (keywords, featured, type pill) `rgba(54,91,82,0.15)` /
    `rgba(154,184,170,0.15)`
- Dark mode is `body.dark-mode` (toggled by `dark-mode.js`, remembered in
  `localStorage`); style both modes
  when adding a component.
- Mobile breakpoint is `max-width: 767px`.
