# __TITLE__

## Running locally

```sh
npm install
npm run dev
```

Join `varion://127.0.0.1:__PORT__` from the Varion launcher. The mode restarts on save.
<!-- if db -->

On Windows the first run sets up a local MariaDB in `.varion/db` and writes its settings to
`.env`; on other systems put your own database into `.env`.
<!-- end db -->

- `npm run check` – type check
- `npm run ui` – the page in a browser

Events are declared in `src/shared/events.ts`, settings live in `varion.toml`.

## Deploying

Sign in once with `npx varion login`, then `npx varion deploy test` (or `prod`);
`npx varion deploy test --rollback` goes back to the previous release. Pushes to GitHub deploy
automatically: `main` to test, `v*` tags to prod, other branches to a preview on the test host.
The deploy job selects a GitHub environment before it reads its secrets. Create `test` and
`prod` environments and give each its own:

- `VARION_DEPLOY_TOKEN` – developer token issued for the matching server ID in `varion.toml`
- `VARION_DEPLOY_KEY` – private key for signing deploys

Previews use the test secrets. If you set a preview server ID explicitly, use the server
bound to the test token. Reserve prod secrets for the prod environment.

Create a separate key pair for each environment. For example, on Linux use
`VARION_KEYS_DIR="$HOME/.config/varion/ci-test" npx varion keys init`. Put the contents of
`deploy-ed25519.pem` in the environment secret and trust the corresponding public key
on the host with `varion host trust <key> --name ci-test`. See the
[deployment instructions](https://varionmp.net/docs/deploy) for compatible SDK and host versions.
