# __TITLE__

## Локальный запуск

```sh
npm install
npm run dev
```

Заходи на `varion://127.0.0.1:<port>` из лаунчера Varion. Режим перезапускается при сохранении.
<!-- if db -->

При первом запуске поднимается локальная MariaDB в `.varion/db`, настройки пишутся в `.env`.
<!-- end db -->

- `npm run check` – проверка типов
- `npm run ui` – страница в браузере

События описаны в `src/shared/events.ts`, настройки — в `varion.toml`.

## Выкладка

Один раз войди: `npx varion login`, затем `npx varion deploy test` (или `prod`);
`npx varion deploy test --rollback` возвращает предыдущий выпуск. Push на GitHub выкладывает сам:
`main` — на test, теги `v*` — на prod, остальные ветки — на сервер превью. Сценарию нужны секреты:

- `VARION_SDK_TOKEN` – токен GitHub с доступом на чтение к `Varion-Team/varion-sdk`
- `VARION_DEPLOY_TOKEN` – токен разработчика из кабинета
- `VARION_DEPLOY_KEY` – закрытый ключ для подписи выкладки

Для CI заведи отдельный ключ: `VARION_KEYS_DIR=ci-key npx varion keys init`, закрытый ключ
положи в секрет, открытый добавь на сервере: `varion host trust <ключ> --name ci`.
