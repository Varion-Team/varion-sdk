export default {
  // engine
  '[engine] path = {dir}: there is no {exe} (point it at a built server folder)':
    '[engine] path = {dir}: нет {exe} (укажи папку собранного сервера)',
  'engine from {dir} ({version}, protocol {protocol})':
    'движок из {dir} ({version}, протокол {protocol})',
  'engine from {dir}': 'движок из {dir}',
  'engine {version}: every file matches the signed manifest':
    'движок {version}: все файлы сходятся с подписанным манифестом',

  // varion new
  'usage: varion new <name>, for example varion new my-mode':
    'использование: varion new <имя>, например varion new my-mode',
  'created {name} in {dir} ({count} files)': 'проект {name} создан в {dir} (файлов: {count})',
  'installing dependencies ({pm} install)': 'ставлю зависимости ({pm} install)',
  '{pm} install failed (exit code {code}); run it again in {dir}':
    '{pm} install не прошёл (код {code}); повтори в {dir}',
  'git is not installed: the project is not a repository yet':
    'git не установлен: проект пока не репозиторий',
  'the project is inside a git repository already: no new one':
    'проект уже внутри репозитория git: новый не создаю',
  'git init failed: run it yourself in {dir}': 'git init не прошёл: выполни его сам в {dir}',
  'git has no user.name or user.email: make the first commit yourself':
    'в git не заданы user.name или user.email: первый коммит сделай сам',
  'the first commit failed: make it yourself in {dir}':
    'первый коммит не прошёл: сделай его сам в {dir}',
  'Next:': 'Дальше:',
  'server on 127.0.0.1:{port}, restarts on save':
    'сервер на 127.0.0.1:{port}, перезапуск при сохранении',
  'Events live in src/shared/events.ts, settings in varion.toml, details in README.md':
    'События — в src/shared/events.ts, настройки — в varion.toml, подробнее — в README.md',
  'name "{name}": lowercase letters, digits, _ and -, starting with a letter, up to 64 characters':
    'имя «{name}»: строчные латинские буквы, цифры, _ и -, с буквы, до 64 символов',
  '{dir} already exists and is not empty': 'папка {dir} уже есть и не пуста',

  // varion.toml and .env.example
  '{title}: a Varion game mode. The only settings file of the project.':
    '{title}: режим для Varion. Единственный файл настроек проекта.',
  'Everything varion makes goes to .varion (not in git, safe to delete).':
    'Всё, что делает varion, лежит в .varion (не в git, можно удалить).',
  'Secrets go to .env, not here (.env.example lists them).':
    'Пароли и ключи — в .env, не здесь (список — в .env.example).',
  'Resource name and event prefix: lowercase letters, digits, _ and -.':
    'Имя ресурса и приставка событий: строчные латинские буквы, цифры, _ и -.',
  'A server folder of your own build instead of the CDN package.':
    'Папка своей сборки сервера вместо пакета с CDN.',
  'varion dev downloads this version from the CDN and checks its signature.':
    'varion dev скачивает эту версию с CDN и проверяет подпись.',
  '"127.0.0.1": this computer only; "0.0.0.0": let players in (open UDP {port} and TCP {httpPort}).':
    '"127.0.0.1" — только этот компьютер; "0.0.0.0" — пустить игроков (открой UDP {port} и TCP {httpPort}).',
  'true: list the server in the launcher.': 'true — показывать сервер в списке лаунчера.',
  'Where a player waits to join (x, y, z); the mode spawns them with player.spawn.':
    'Где игрок ждёт входа (x, y, z); дальше его ставит режим через player.spawn.',
  'Read by the server with varion.getResourceConfig().':
    'Сервер читает это через varion.getResourceConfig().',
  'Without .env, varion dev sets up MariaDB in .varion/db (127.0.0.1 only) and loads the seed.':
    'Без .env varion dev заводит MariaDB в .varion/db (только 127.0.0.1) и загружает seed.',
  'true: start the game and join the server once it is up.':
    'true — запустить игру и зайти на сервер, когда он поднимется.',
  'Deployment environments, applied over [server] and [config].':
    'Окружения выкладки поверх [server] и [config].',
  'Branch previews (preview-<branch>): the host picks the port, the launcher does not list them.':
    'Превью веток (preview-<ветка>): порт выбирает хост, в списке лаунчера их нет.',
  'Server id from the cabinet; sign in with varion login (CI: VARION_DEPLOY_TOKEN).':
    'Номер сервера в кабинете; вход — varion login (в CI — VARION_DEPLOY_TOKEN).',
  'Secrets of the mode. Copy to .env; .env stays out of git.':
    'Пароли и ключи режима. Скопируй в .env; .env в git не попадает.',
  'varion dev fills these in when it sets up the project database.':
    'varion dev заполнит их, когда заведёт базу проекта.',
  'Developer token from the Varion cabinet, for varion deploy:':
    'Токен разработчика из кабинета Varion для varion deploy:',
  '--port {port}: use a port from 1 to 65534 (the next one is for HTTP)':
    '--port {port}: нужен порт от 1 до 65534 (следующий занимает HTTP)',
};
