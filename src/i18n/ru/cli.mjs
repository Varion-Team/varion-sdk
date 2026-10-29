export default {
  // varion
  'needs Node.js {required} or newer (this is {current})':
    'нужен Node.js {required} или новее (сейчас {current})',
  'game modes on Varion: one folder, one varion.toml, one command':
    'режимы на Varion: одна папка, один varion.toml, одна команда',
  'create a project from the template: TypeScript server, client and page':
    'создать проект из шаблона: сервер, клиент и страница на TypeScript',
  'run engine, database and server; rebuild and restart on every edit':
    'запустить движок, базу и сервер; пересборка и перезапуск при каждой правке',
  'type check and build the game mode resource': 'проверить типы и собрать ресурс режима',
  'type check only (server, client, page)': 'только проверить типы (сервер, клиент, страница)',
  'pack a release, upload it and send a signed deploy request':
    'упаковать выпуск, загрузить его и отправить подписанный запрос выкладки',
  'go back to the release that was active before the current one':
    'вернуть выпуск, который действовал до текущего',
  'sign this computer in to the cabinet and add its developer key':
    'войти с этого компьютера в кабинет и добавить его ключ разработчика',
  'forget the sign-in of this computer': 'забыть вход с этого компьютера',
  'the signed-in account and its servers':
    'учётная запись, под которой выполнен вход, и её серверы',
  'create or show the developer key that signs deploy requests':
    'создать или показать ключ разработчика для подписи запросов выкладки',
  'on a server: apply deploys from the cabinet (see varion host --help)':
    'на сервере: принимать выкладки из кабинета (подробно — varion host --help)',
  'download and check the engine of varion.toml': 'скачать и проверить движок из varion.toml',
  'manage the project database (MariaDB in .varion/db)':
    'управлять базой проекта (MariaDB в .varion/db)',
  'check, fetch and lock the big files of the project (DLC packs)':
    'проверить, скачать и записать в замок большие файлы проекта (паки DLC)',
  'refresh types/ with the SDK typings of this varion':
    'обновить types/ типами SDK из этой версии varion',
  'common options': 'общие ключи',
  'events as JSON lines, for tools and CI': 'события строками JSON — для инструментов и CI',
  'the project folder': 'папка проекта',
  '"{command}" is not a varion command (see varion --help)':
    '«{command}» — не команда varion (список — varion --help)',
  'internal error in varion': 'внутренняя ошибка varion',
  '{name}: {received} of {total}': '{name}: {received} из {total}',

  // arguments
  '{command}: unknown option {option}': '{command}: неизвестный ключ {option}',
  '{command}: unknown option {option} (known: {list})':
    '{command}: неизвестный ключ {option} (есть: {list})',
  '{command}: {option} takes no value': '{command}: {option} не принимает значения',
  '{command}: {option} needs a value': '{command}: после {option} нужно значение',
  '{command}: {option} needs a number, not "{value}"':
    '{command}: {option} ждёт число, а не «{value}»',
  '{command}: unexpected arguments: {args}': '{command}: лишние аргументы: {args}',
  '{command}: unknown subcommand "{name}" (there are {list})':
    '{command}: нет подкоманды «{name}» (есть {list})',

  // varion.toml
  'no varion.toml in {dir} or any folder above it (a new project: varion new <name>)':
    'нет varion.toml ни в {dir}, ни выше (новый проект — varion new <имя>)',
  'cannot read {file}: {reason}': 'не читается {file}: {reason}',
  '{key} must be a table [...]': '{key} должен быть таблицей [...]',
  'unknown key {key}, ignored': 'неизвестный ключ {key} — пропускаю',
  '{key} must be a quoted string, not {value}':
    '{key} должен быть строкой в кавычках, а не {value}',
  '{key} cannot be empty': '{key} не может быть пустым',
  '{key} must be true or false, not {value}': '{key} должен быть true или false, а не {value}',
  '{key} must be an integer from {min} to {max}, not {value}':
    '{key} должен быть целым числом от {min} до {max}, а не {value}',
  '{key} must be an integer of at least {min}, not {value}':
    '{key} должен быть целым числом не меньше {min}, а не {value}',
  '{key} must be an integer, not {value}': '{key} должен быть целым числом, а не {value}',
  '{key} must be a list of strings ["a", "b"], not {value}':
    '{key} должен быть списком строк ["a", "b"], а не {value}',
  'a list': 'список',
  'a table': 'таблица',
  'the string "{text}"': 'строка «{text}»',
  'unknown table [{table}], ignored': 'неизвестный раздел [{table}] — пропускаю',
  '[project] needs name: the resource name of the game mode (lowercase a-z, digits, _ and -)':
    '[project]: нужен name — имя ресурса режима (строчные латинские буквы, цифры, _ и -)',
  '[engine] needs version (an engine from the CDN) or path (a folder with your own server build)':
    '[engine]: нужен version (движок с CDN) или path (папка своей сборки сервера)',
  '[engine] version "{version}" is not a version like 1.0.75':
    '[engine] version: «{version}» — не версия вида 1.0.75',
  '[engine] channel "{channel}" is not a channel name (rc, beta, ...)':
    '[engine] channel: «{channel}» — не имя канала (rc, beta, ...)',
  '{table} port and httpPort are the same ({port})': '{table}: port и httpPort совпадают ({port})',
  '{table} needs run: the build command': '{table}: нужен run — команда сборки',
  '[resources] extra "{name}" is not a resource name':
    '[resources] extra: «{name}» — не имя ресурса',
  '[database] {key} "{value}": only Latin letters, digits and _':
    '[database] {key}: «{value}» — только латинские буквы, цифры и _',
  '[dev] ui must be "build" or "live" (the page from its dev server), not "{value}"':
    '[dev] ui: "build" или "live" (страница с её dev-сервера), а не «{value}»',
  '{key}: an environment cannot hold nested tables, ignored':
    '{key}: вложенные таблицы в окружении не поддерживаются — пропускаю',
  '[deploy.{name}]: a deploy environment is test, prod or preview-<branch>':
    '[deploy.{name}]: окружение выкладки — test, prod или preview-<ветка>',
  '{key} must be [x, y, z]: three numbers': '{key} должен быть [x, y, z] — три числа',
  '{key} must be a list of build numbers [3889]': '{key} должен быть списком номеров сборок [3889]',
  '{key} is set by varion itself (from [resources] extra and [project] name)':
    '{key} задаёт сама команда varion (из [resources] extra и [project] name)',
  '{key} is a table; server.toml does not take tables':
    '{key} — таблица, а server.toml таблиц не понимает',
  'varion.toml has no [env.{name}]': 'в varion.toml нет [env.{name}]',

  // TOML
  'control character in a comment': 'управляющий символ в комментарии',
  'unexpected text at the end of the line: "{text}"': 'лишнее в конце строки: «{text}»',
  'expected a key': 'ожидался ключ',
  'the key __proto__ is not allowed': 'ключ __proto__ не допускается',
  '"{key}": {part} is already a value, not a table':
    '«{key}»: {part} уже задан значением, а не таблицей',
  '"{part}" is an inline table { ... } and cannot be extended':
    '«{part}» — встроенная таблица { ... }, дополнять её нельзя',
  'expected "]"': 'ожидалась «]»',
  'table [{key}] is already defined above': 'таблица [{key}] уже задана выше',
  'expected "]]"': 'ожидалась «]]»',
  '[[{key}]]: {part} is already defined and is not an array of tables':
    '[[{key}]]: {part} уже задан, и это не массив таблиц',
  'expected "=" after the key "{key}"': 'после ключа «{key}» ожидалось «=»',
  '"{key}": {part} is already defined above': '«{key}»: {part} уже задан выше',
  'key "{key}" is defined twice': 'ключ «{key}» задан дважды',
  'expected a value': 'ожидалось значение',
  'invalid \\u escape in a string': 'неверная запись \\u в строке',
  '{escape}: no such Unicode character': '{escape}: такого символа Unicode нет',
  'unknown escape {escape} in a string (write a backslash as \\\\ or use single quotes)':
    'неизвестная последовательность {escape} в строке (обратную косую пиши как \\\\ или бери строку в одинарные кавычки)',
  'control character in a string': 'управляющий символ в строке',
  'the string has no closing quote {quote}': 'строка не закрыта кавычкой {quote}',
  'the {quote} string is not closed': 'строка {quote} не закрыта',
  'expected "," or "]" in an array': 'в массиве ожидалась «,» или «]»',
  'an inline table { ... } must be on one line': 'встроенная таблица { ... } пишется в одну строку',
  'expected "," or "}" in an inline table': 'во встроенной таблице ожидалась «,» или «}»',
  'unknown value "{text}" (put strings in quotes)':
    'непонятное значение «{text}» (строки бери в кавычки)',

  // build tools
  'the project has no {name}: install its dependencies with npm install':
    'в проекте нет {name} — установи зависимости: npm install',
  '--pm must be npm, pnpm or yarn, not "{value}"': '--pm: npm, pnpm или yarn, а не «{value}»',

  // database
  'varion sets up MariaDB only on Windows for now: put your own database in .env':
    'varion пока заводит MariaDB только на Windows — пропиши свою базу в .env',
  'database: downloading MariaDB {version} ({url})': 'база: скачиваю MariaDB {version} ({url})',
  'the MariaDB {version} archive does not match its pinned SHA-256 ({sha256})':
    'архив MariaDB {version} не сходится с закреплённым SHA-256 ({sha256})',
  'the MariaDB archive has no bin\\mariadbd.exe': 'в архиве MariaDB нет bin\\mariadbd.exe',
  'database: MariaDB {version} checked (SHA-256) and installed in {dir}':
    'база: MariaDB {version} проверена (SHA-256) и лежит в {dir}',
  'mariadbd did not start: {reason}': 'mariadbd не запустился: {reason}',
  'the project database did not answer on 127.0.0.1:{port} (MariaDB log: {log})':
    'база проекта не ответила на 127.0.0.1:{port} (журнал MariaDB — {log})',
  'project database started on 127.0.0.1:{port} (mariadbd, PID {pid})':
    'база проекта запущена на 127.0.0.1:{port} (mariadbd, PID {pid})',
  'database: cannot list the tables ({reason})': 'база: не читается список таблиц ({reason})',
  '[database] seed: no file {file} to fill the new database from':
    '[database] seed: нет файла {file} — нечем заполнить новую базу',
  'database: {file} did not load into {database} ({reason})':
    'база: {file} не залился в {database} ({reason})',
  'database: {database} filled from {file}': 'база: {database} заполнена из {file}',
  'port {port} is taken: give the project database another one in [database] port':
    'порт {port} занят — задай базе проекта другой в [database] port',
  'database: creating a new one in {dir} (127.0.0.1:{port})':
    'база: завожу новую в {dir} (127.0.0.1:{port})',
  'database: {file} (the root password) is missing; delete .varion/db to start over':
    'база: нет {file} (пароль root) — удали .varion/db, чтобы завести базу заново',
  'database: setup failed ({reason})': 'база: не создалась ({reason})',
  'Written by varion: the project database is in .varion/db (MariaDB, this computer only).':
    'Записано командой varion: база проекта — в .varion/db (MariaDB, только этот компьютер).',
  'The passwords work on this computer only; this file stays out of git.':
    'Пароли годятся только для этого компьютера; файл не попадает в git.',
  'database ready, {file} written': 'база готова, {file} записан',
  'database {host}:{port} is up': 'база {host}:{port} отвечает',
  'database {host}:{port} does not answer': 'база {host}:{port} не отвечает',
  'the project database is not running; starting it ({dir})':
    'база проекта не запущена — запускаю ({dir})',
  'database {host}:{port} does not answer; running {script}':
    'база {host}:{port} не отвечает — запускаю {script}',
  'database {host}:{port} still does not answer after {script}':
    'база {host}:{port} так и не ответила после {script}',
  'the start script {script} is not on this computer':
    'скрипта запуска {script} на этом компьютере нет',
  'it is not the project database in .varion/db (delete .env to let varion set one up)':
    'это не база проекта из .varion/db (удали .env, чтобы varion завёл её сам)',
  'varion.toml has no [database] start': 'в varion.toml нет [database] start',
  'database {host}:{port} does not answer: {hint}': 'база {host}:{port} не отвечает: {hint}',
  'the project has no database of its own in .varion/db': 'у проекта нет своей базы в .varion/db',
  'the project database (127.0.0.1:{port}) is already stopped':
    'база проекта (127.0.0.1:{port}) уже остановлена',
  'project database stopped (127.0.0.1:{port})': 'база проекта остановлена (127.0.0.1:{port})',
  'varion.toml has no [database]': 'в varion.toml нет [database]',
  'the project database is not set up yet (varion dev sets it up when there is no .env)':
    'база проекта ещё не заведена (её заведёт varion dev, если нет .env)',
  'your own database': 'своя база',

  // assets
  '{file}: expected { "schemaVersion": 1, "assets": [...] }':
    '{file}: нужен { "schemaVersion": 1, "assets": [...] }',
  '(no name)': '(без имени)',
  'the name must be lowercase a-z, digits, _ . -': 'имя — строчные латинские буквы, цифры, _ . -',
  'the name is used twice': 'имя повторяется',
  'kind must be "dlc" or "resource"': 'kind — "dlc" или "resource"',
  'sha256 must be 64 hex digits': 'sha256 — 64 шестнадцатеричные цифры',
  'size must be the size in bytes': 'size — размер в байтах',
  'url must be an https:// address': 'url — адрес https://',
  'mount must be lowercase a-z, digits and _': 'mount — строчные латинские буквы, цифры и _',
  '{name}: {file} does not match {lock}, using it as it is (update the lock: varion assets lock)':
    '{name}: файл {file} не сходится с {lock} — беру его как есть (обновить замок: varion assets lock)',
  '{name}: not in the cache {dir}': '{name}: нет в кэше {dir}',
  '{name}: not in the cache or in [assets] source, and the lock has no url for it':
    '{name}: нет ни в кэше, ни в [assets] source, а адреса (url) в замке нет',
  '{name}: downloading {size} from {url}': '{name}: скачиваю {size} с {url}',
  '{name}: the SHA-256 of the download ({sha256}) does not match the lock, file refused':
    '{name}: SHA-256 скачанного ({sha256}) не сходится с замком — файл не беру',
  '{name}: downloaded and checked (SHA-256)': '{name}: скачан и проверен (SHA-256)',
  'Pack {name} ({sha256}) from assets.lock.json, placed by varion.':
    'Пак {name} ({sha256}) из assets.lock.json, положен командой varion.',
  '{name}: the archive has no resource.toml (kind "resource" is a ZIP of a ready resource folder)':
    '{name}: в архиве нет resource.toml (kind "resource" — ZIP готовой папки ресурса)',
  'from [assets] source': 'из [assets] source',
  'from the cache': 'из кэша',
  'hard link': 'жёсткая ссылка',
  '{name}: placed in resources/ ({how})': '{name}: положен в resources/ ({how})',
  'nothing to lock: [assets] source (the folder with your packs) is not set':
    'нечего хешировать: не задан [assets] source (папка с твоими паками)',
  '[assets] source: no folder {dir}': '[assets] source: нет папки {dir}',
  '{file}: {count} assets, {changed} changed': '{file}: ассетов — {count}, изменено — {changed}',
  'the project has no [assets] in varion.toml and no {file}':
    'у проекта нет [assets] в varion.toml и нет {file}',
  '{name} ({kind}, {size}): in the cache': '{name} ({kind}, {size}): в кэше',
  '{name} ({kind}, {size}): not in the cache': '{name} ({kind}, {size}): нет в кэше',
  '{file}: {count} assets; cache: {dir}': '{file}: ассетов — {count}; кэш — {dir}',
  'all {count} assets are in place and checked': 'все ассеты на месте и проверены ({count})',

  // engine and types
  'your own build': 'своя сборка',
  'updated {count} type files from {source}': 'обновлено файлов типов: {count} (из {source})',
  'project database: {dir} (MariaDB {version}), database {database}':
    'база проекта: {dir} (MariaDB {version}), база {database}',
};
