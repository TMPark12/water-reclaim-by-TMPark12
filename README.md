# water-reclaim-by-TMPark12

Water Reclaim is a game about protecting clean groundwater, built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

Vite prints a local URL with live reload enabled. Run `npm run build` to create a production build.

## Deploy to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and deploys the app when changes are pushed to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The deployed site is available at `https://TMPark12.github.io/water-reclaim-by-TMPark12/`.

GitHub Pages serves static files only, so the `/api/languages` and `/api/translate` routes are unavailable there. The app remains usable in English; automatic translation requires a separate server-side API host.

## Automatic translations

The language selector loads every language currently supported by Google Cloud Translation. Enable the Cloud Translation API, copy `.env.example` to `.env.local`, and add a server-side API key:

```sh
GOOGLE_CLOUD_TRANSLATE_API_KEY=your_key
```

Do not add a `VITE_` prefix or commit the key. The Vite middleware keeps it on the server and provides `/api/languages` and `/api/translate` for development and Vite preview. A static production host must provide equivalent server-side routes; never call Google with a private key directly from browser code.
