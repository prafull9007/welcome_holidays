
# Welcome Holidays

A tiny static frontend app that shows month-specific holidays from an in-memory data structure and renders them into the DOM.

Quick points
- Entry: `index.html` (no build step) — open in a browser or serve the folder.
- App logic: `app.js` contains the `holidaysByMonth` data and `renderForMonth()` renderer.
- Styles: `styles.css` holds the visual system.
- Chart canvas: optional `holChart` canvas is included but not populated by default.

Run / Preview
- Open `index.html` in your browser.
- Or run a simple static server from the project root, for example:

```bash
npx http-server . -o
```

Conventions
- Months are 0-based (January = 0). Keys in `holidaysByMonth` use month indices.
- Holiday shape: `{ name, date, label, icon }` where `date` is `YYYY-MM-DD`.
- `renderForMonth(monthIndex)` sorts holidays by `new Date(a.date)` before rendering.
- DOM IDs relied on by `app.js`: `monthSelect`, `holMonth`, `holidayList`, `holChart`.

Making changes
- To add a holiday to August (index 7):

```js
holidaysByMonth[7].push({ name: 'My Holiday', date: '2026-08-15', label: 'August 15, 2026', icon: '🎉' });
```

Notes for contributors
- Keep changes small and edit `app.js` for behavior changes.
- If you add charting, reuse the existing `holChart` canvas and the Chart.js CDN already in `index.html`.

Files of interest
- `index.html` — markup, DOM targets, Chart.js canvas
- `app.js` — data + rendering
- `styles.css` — visual tokens and layout

License
- (Add a license file or statement here if desired.)

