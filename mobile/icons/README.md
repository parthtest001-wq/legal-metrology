# /mobile/icons

Per Master Spec §2, `/mobile` holds only field-specific docs/assets for
Module 7 — in this case, the source PWA icon artwork referenced by
`/frontend/public/manifest.json`.

Place the following source files here:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512, safe-zone padded for maskable display)

**Build step:** copy (or symlink) this folder's contents into
`/frontend/public/icons/` before `npm run build` / `npm run dev`, e.g.:

```bash
mkdir -p ../frontend/public/icons
cp ./*.png ../frontend/public/icons/
```

This keeps the design-owned source assets out of `/frontend/public` (which
already holds the generated `manifest.json`) while satisfying the manifest's
`icons[].src` paths at runtime. No shared file is modified by this step.
