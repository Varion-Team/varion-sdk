export default {
  // ---- [dev-ui] and VARION_DEV_UI ----
  '[dev-ui] url: {url} is not on this computer': '[dev-ui] url: {url} — не на этом компьютере',
  '[dev-ui] url: no query, fragment or user name allowed: {url}':
    '[dev-ui] url: без запроса, якоря и имени пользователя: {url}',
  '[dev-ui] url: {folder} is not a plain folder': '[dev-ui] url: {folder} — не простая папка',
  '[dev-ui] root: a folder of the resource, not {root}':
    '[dev-ui] root: нужна папка ресурса, а не {root}',

  // ---- the plugin and the proxy ----
  '{what}: needs http://127.0.0.1:<port> (or localhost, [::1]), not {url}':
    '{what}: нужен http://127.0.0.1:<порт> (или localhost, [::1]), а не {url}',
  'the page will not get the shim {file}: {reason}':
    'страница не получит прослойку {file}: {reason}',
  'host: the proxy listens only on 127.0.0.1, localhost or ::1, not {host}':
    'host: прокси слушает только 127.0.0.1, localhost или ::1, а не {host}',
  'port: {port} is not a port number': 'port: {port} — не номер порта',
  '{url} is not answering ({reason})': '{url} не отвечает ({reason})',
  'UI dev server WebSocket: {reason}': 'WebSocket dev-сервера страницы: {reason}',
  'pages for the game: {url} -> {upstream}': 'страницы для игры: {url} -> {upstream}',
  'pages for the game: {url} -> {upstream} (shims first: {shims})':
    'страницы для игры: {url} -> {upstream} (первыми — {shims})',

  // ---- varion-dev-ui ----
  'puts the page shims first into every page of a UI dev server that cannot take the Vite plugin':
    'ставит прослойки первыми в каждую страницу dev-сервера страницы, которому не подключить плагин Vite',
  'the UI dev server, http://127.0.0.1:<port>': 'dev-сервер страницы, http://127.0.0.1:<порт>',
  'the port on 127.0.0.1 the game loads the pages from; a free one when left out':
    'порт на 127.0.0.1, с которого игра берёт страницы; без него — любой свободный',
  'a script to put first into every page; repeat for more':
    'скрипт, который встаёт первым в каждую страницу; можно указать несколько раз',
  'where the files the UI dev server does not have come from':
    'откуда брать файлы, которых нет у dev-сервера страницы',
  'show this help': 'показать эту справку',
  'the UI dev server address is required: --upstream http://127.0.0.1:<port>':
    'нужен адрес dev-сервера страницы: --upstream http://127.0.0.1:<порт>',
  'port {port} on 127.0.0.1 is in use: stop what listens there or pick another --port':
    'порт {port} на 127.0.0.1 занят: останови то, что его слушает, или выбери другой --port',
};
