# WB Slide JSON Importer

A local Figma Design plugin for version 1 `.figma.json` slide exports from the Resizer/WB generator. It creates a new frame on the current page, retaining panel positions, backgrounds, editable text, font sizes, spacing, opacity and available variable-font axes.

## Install and use

1. Open **Figma Desktop** and a Design file.
2. Open **Plugins → Development → Import plugin from manifest…** and select this folder's `manifest.json`.
3. Run **Plugins → Development → WB Slide JSON Importer**.
4. Choose `slide-1-1080x1350.figma.json`, then click **Import editable slide**.
5. Review any font warnings. Make the original fonts available in Figma and reimport if matching typography is important.

The plugin is ready to run: `code.js` and `ui.html` are included. No server, API key or network access is needed. Keep all three files (`manifest.json`, `code.js`, `ui.html`) together.

If Figma requires an account-assigned plugin ID, use **Plugins → Development → New plugin** to create a plugin with a UI, copy its generated `id` into this manifest, and import this manifest again. The supplied ID is only a local development identifier, not a published Community plugin ID.

## Import behavior

- The top-level `width`/`height` determine the slide size. Panel `x`/`y` are slide-relative; layer `x`/`y` are panel-relative.
- Text remains editable. By default, consecutive word fragments with matching typography on the same line are joined into one text layer. Disable this option to preserve each original source layer.
- Font family aliases such as `WBSans` and `WB Sans`, or `InterVariable` and `Inter`, are matched. Static font weights use the nearest installed style. Variable axes are retained when supported by the Figma API and selected font.
- Missing families fall back to Inter with a visible warning. Font substitutions, unavailable axes and text reflow can change appearance. The optional reference PNG is a separate comparison image, never a substitute for editable layers.
- Embedded PNG/JPEG/WebP/GIF image layers, inline SVG layers and rectangle layers are supported. External image URLs are not fetched. SVGs retain their aspect ratio. Unknown layer types stop the import with an error.
- A failed import removes the partially created frame. Existing designs are not replaced. Repeated imports create additional frames.
- `settings` and animation timing are not imported. This plugin imports the selected slide as a static editable design, not an animated timeline or a Bento Studio project.

## Development

After editing `core.mjs` or `main.js`, regenerate the bundled plugin:

```sh
node figma-importer/build.mjs
node --test tests/figma-importer.test.mjs
```

Manifest and font-loading behavior follow the official [Figma manifest documentation](https://developers.figma.com/docs/plugins/manifest/) and [text API documentation](https://developers.figma.com/docs/plugins/working-with-text/).
