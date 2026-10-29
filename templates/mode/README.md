# __TITLE__

## Running locally

```sh
npm install
npm run dev
```

Join `varion://127.0.0.1:<port>` from the Varion launcher. The mode restarts on save.
<!-- if db -->

The first run sets up a local MariaDB in `.varion/db` and writes its settings to `.env`.
<!-- end db -->

- `npm run check` – type check
- `npm run ui` – the page in a browser

Events are declared in `src/shared/events.ts`, settings live in `varion.toml`.

## Deploying

Sign in once with `npx varion login`, then `npx varion deploy test` (or `prod`);
`npx varion deploy test --rollback` goes back to the previous release. Pushes to GitHub deploy
automatically: `main` to test, `v*` tags to prod, other branches to a preview server. The workflow
needs these secrets:

- `VARION_SDK_TOKEN` – GitHub token with read access to `Varion-Team/varion-sdk`
- `VARION_DEPLOY_TOKEN` – developer token from the cabinet
- `VARION_DEPLOY_KEY` – private key for signing deploys

For CI, create a separate key: `VARION_KEYS_DIR=ci-key npx varion keys init`, put the private key
into the secret and trust the public one on the server with `varion host trust <key> --name ci`.
