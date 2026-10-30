# water-reclaim-by-TMPark12

Water Reclaim is a game about protecting clean groundwater, built with React, TypeScript, and Vite.

## Run locally

```sh
npm install
npm run dev
```

Vite prints a local URL with live reload enabled. Run `npm run build` to create a production build.

## Automatic translations

The language selector loads every language currently supported by Google Cloud Translation. Enable the Cloud Translation API, copy `.env.example` to `.env.local`, and add a server-side API key:

```sh
GOOGLE_CLOUD_TRANSLATE_API_KEY=your_key
```

Do not add a `VITE_` prefix or commit the key. The Vite middleware keeps it on the server and provides `/api/languages` and `/api/translate` for development and Vite preview. A static production host must provide equivalent server-side routes; never call Google with a private key directly from browser code.
