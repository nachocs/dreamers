# dreamers

Dreamers.es New Site

## Known issues

- **Material Design Lite CDN is dead.** The homepage used to load MDL straight from
  `storage.googleapis.com/code.getmdl.io/1.2.1/...`. Google permanently shut that bucket down
  (~June 2026, returns `403 AccessDenied`), which silently broke MDL's grid/layout CSS and made
  the homepage look broken (unstyled/pushed-down content) for about a month before anyone
  traced it back to this. Fixed by bundling `material-design-lite` from `node_modules` via the
  webpack build (`entry.app` in `webpack/webpack.prod.config.js` and `webpack.dev.config.js`)
  instead of pointing at the dead CDN.
- MDL itself has been in Google's "limited support" mode for years — development moved to
  [Material Components for the Web](https://github.com/material-components/material-components-web).
  We're only pinned to MDL 1.2.1 because that's what the site has always used; we should plan to
  upgrade off MDL (or at least bump past 1.2.1) before this bites us again.

## 1.0.10
A?adido enlace directo a tienda y a web clasica. Mejora de enlace a blogs, cambiado feed a tienda + todo incluido blogs

## 1.0.9
Mejora de cajas cuando el contenido viene de entrada rapida. Pinchando en caja expande.

## Version 1.0.0
Todo funciona, aunque hay errores pero no puedo retrasar esto mas, que lo tenia hecho hace 7 años... :)
