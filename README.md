# loop.

A tiny, dependency-free YouTube looper. Paste a YouTube video or playlist link, press **Loop**, and it repeats. Paste several links and they'll play as one looping playlist.

This is a static site: no build step, no server, no Python. The small `app.js` file only reads the pasted link and loads the YouTube embed.

## Run locally

YouTube only allows embeds from pages served over HTTP, so don't open `index.html` directly. Use any static server. Without Python:

```sh
npx serve . -l 4173
```

Then visit <http://localhost:4173>. YouTube playback itself still requires an internet connection.

## Deploy to Vercel

### From the dashboard

1. Push this folder to a Git repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Leave the framework preset as **Other**, with no build command and no output directory.
4. Deploy.

### From the CLI

```sh
npx vercel
```

Follow the prompts. For production:

```sh
npx vercel --prod
```

## Notes

YouTube embeds must be served over HTTP or HTTPS. Opening `index.html` directly from disk won't work.

Some videos can't be embedded because their owner disabled embedding. That's a YouTube restriction, not a bug in the site.
