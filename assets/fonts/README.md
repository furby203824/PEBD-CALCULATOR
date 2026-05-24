# Self-hosted fonts for PEBD Calculator

The Portal-rebuilt index.html references three font files in this directory via @font-face. CSP `font-src 'self'` permits loading only from the same origin, so the files must live here in the repo.

## Required files

Drop the following three files into this directory before deployment:

1. **InterVariable.woff2**
   - Source: https://github.com/rsms/inter (releases) or `@fontsource-variable/inter` (download from unpkg)
   - License: SIL Open Font License 1.1

2. **BebasNeue-Regular.woff2**
   - Source: https://fonts.google.com/specimen/Bebas+Neue or `@fontsource/bebas-neue`
   - License: SIL Open Font License 1.1

3. **JetBrainsMono-Variable.woff2**
   - Source: https://github.com/JetBrains/JetBrainsMono (releases) or `@fontsource-variable/jetbrains-mono`
   - License: SIL Open Font License 1.1

## Quick download commands

If npm is available on the build environment, install once and copy the woff2 files into this directory:

```bash
npm i @fontsource-variable/inter @fontsource-variable/jetbrains-mono @fontsource/bebas-neue
cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 assets/fonts/InterVariable.woff2
cp node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2 assets/fonts/BebasNeue-Regular.woff2
cp node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2 assets/fonts/JetBrainsMono-Variable.woff2
```

## Why this matters

- The Semper Admin Portal Style Guide v1.2 requires Bebas Neue for hero headings and stat tile numerics, Inter Variable for body text, JetBrains Mono Variable for monospace citations.
- Self-hosting eliminates a Google Fonts CDN round-trip and complies with DoD policy against unbounded external requests.
- CSP `font-src 'self'` will reject any attempt to load these from a third-party CDN at runtime.

## Verification

After dropping the files, load the app in a fresh browser profile. Open DevTools Network tab. Confirm:

- Three font requests resolve from `assets/fonts/` and return 200 OK
- No CSP violation reports in the console
- Page headings render in Bebas Neue (visually distinct geometric sans)
- Body renders in Inter (no fallback to system-ui Segoe UI or Helvetica)
