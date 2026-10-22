# wbbento

A browser editor for the eight WB Taxi campaign layouts. Edit copy and photos, adjust image placement on the canvas, save a project in your browser, and export PNG.

## Run locally

Use Node 22.22.2 or newer.

```sh
npm ci
npm run dev
```

## Create with ChatGPT

Open **Create with ChatGPT** above Properties, or use the **ChatGPT** header button.

1. **Changes:** select the text, language, offer, cities, partner details or format to update. Template suggestions can recommend an existing layout that fits the message.
2. **ChatGPT:** choose whether to keep photos or generate a driver/car photo. Enter driver age and nationality when needed. Copy the brief into ChatGPT. It presents three variants, offers more, waits for your choice, returns JSON, and then asks about photo generation.
3. **Import:** paste the final JSON or upload its JSON file. Results without requested images apply immediately. Otherwise, upload each generated image or choose **Keep existing image**, then apply.

On a public HTTPS deployment, the brief includes all driver/car reference URLs and a selected `reference_url` beside each photo prompt. If ChatGPT cannot open or use a URL as visual input, attach the reference with **Copy reference image**. Localhost requires attachments. The editor does not call an image-generation API; generated photos come from the user's ChatGPT conversation.

The original image assets stay separate from the JSON. Large local uploads are omitted from copied briefs and retained during compatible imports. Photos use source-specific crop settings on layout changes; **Reset photo crop** is available in the photo settings. The official partner caption can be localized with the selected language and edited in its block.

## Deploy on Vercel

- Root directory: `bento-studio`, or `.` if this folder is the repository root.
- Framework preset: **Nuxt**.
- Node version: **22.x**.
- Build command: `npm run build` (also set in `vercel.json`).

No MCP setup, database, generation API key or signing secret is required. Export runs in the user's browser. Saved projects are stored in that browser, not a shared account.

## Checks and development tools

```sh
npm test
npm run build
```

Browser tests in `tests/` use Playwright Chromium. `tests/chatgpt-exchange.integration.mjs` checks the copy/import workflow against a local production build.

The optional local CLI (`npm run bento`) and local HTTP API (`npm run bento:api`) reuse the renderer. Use `npm run generate` before CLI/API rendering and install Playwright Chromium if needed. `examples/rental-request.json` is the API test fixture. `design/` retains Figma/preset reference data; `scripts/` includes the asset rebuilding tools. Generated assets used by the app are in `public/` and `data/`.
