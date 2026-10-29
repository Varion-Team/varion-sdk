export default {
  // ---- help and arguments ----
  'the server side of varion deploy': 'серверная часть varion deploy',
  'trust a developer key (the base64 that `varion keys show` prints)':
    'доверять ключу разработчика (base64, который печатает `varion keys show`)',
  'list the trusted keys': 'список доверенных ключей',
  'stop trusting a key': 'больше не доверять ключу',
  'the cabinet servers this host serves': 'какие серверы кабинета обслуживает этот хост',
  'run branch previews on ports from this range':
    'запускать превью веток на портах из этого диапазона',
  'how long a preview lives after its last deploy': 'сколько живёт превью после последней выкладки',
  'what runs here, on which release and port': 'что здесь работает, на каком выпуске и порту',
  'stop the running host (servers are stopped gracefully)':
    'остановить работающий хост (серверы останавливаются бережно)',
  'the host folder (default: VARION_HOST_ROOT, else {dir})':
    'папка хоста (по умолчанию VARION_HOST_ROOT, иначе {dir})',
  'run the host; on the first run it connects this machine to a server with a code from the cabinet':
    'запустить хост; при первом запуске он подключается к серверу по коду из кабинета',
  'connect this machine to a server again, with a new code':
    'заново подключить хост к серверу по новому коду',
  'start the host when Windows starts (a scheduled task)':
    'запускать хост вместе с Windows (задача планировщика)',
  'remove that scheduled task': 'убрать эту задачу планировщика',
  'the cabinet (default: {url})': 'кабинет (по умолчанию {url})',
  'the host token can also come from --token <token>, --token-file <file> or VARION_HOST_TOKEN':
    'токен хоста можно передать и через --token <token>, --token-file <file> или VARION_HOST_TOKEN',
  'besides the keys trusted here, the host trusts the keys approved in the cabinet for its server':
    'кроме ключей, которым доверяют здесь, хост доверяет ключам, одобренным в кабинете для его сервера',
  'unknown option --{option}': 'неизвестный ключ --{option}',
  '--{option} takes no value': '--{option} не принимает значения',
  '--{option} needs a value': '--{option}: нужно значение',
  '{option}: expected a duration like 7d, 12h, 90m or 45s':
    '{option}: нужна длительность вида 7d, 12h, 90m или 45s',
  '{option}: expected a whole number from {min} to {max}':
    '{option}: нужно целое число от {min} до {max}',
  'unexpected arguments: {args}': 'лишние аргументы: {args}',
  'usage: {usage}': 'использование: {usage}',
  '"{command}" is not a varion host command': '«{command}» — не команда varion host',

  // ---- trust, run, stop ----
  'no trusted keys ({file})': 'доверенных ключей нет ({file})',
  'added {time}': 'добавлен {time}',
  'key added: {name} {key}': 'ключ добавлен: {name} {key}',
  'key already trusted, name updated: {name} {key}': 'ключ уже был, имя обновлено: {name} {key}',
  'a running host picks it up with the next request':
    'работающий хост учтёт его со следующего запроса',
  'no trusted key matches {key}': 'среди доверенных нет такого ключа: {key}',
  'no longer trusted: {name} {key}': 'больше не доверяю: {name} {key}',
  'cannot read the token file {file}: {reason}':
    'не удалось прочитать файл токена {file}: {reason}',
  'a host token is required: --token, --token-file or VARION_HOST_TOKEN':
    'нужен токен хоста: --token, --token-file или VARION_HOST_TOKEN',
  'got {signal}: stopping the servers and exiting':
    'получен {signal}: останавливаю серверы и выхожу',
  'the host is not running': 'хост не запущен',
  'asked the host (pid {pid}) to stop': 'попросил хост (pid {pid}) остановиться',
  'the host stopped': 'хост остановлен',
  'the host is still running after {seconds} s (pid {pid})':
    'хост ещё работает через {seconds} с (pid {pid})',

  // ---- connecting by code, starting with Windows ----
  'connected to the server {name} ({serverId}); the host token is saved in {file}':
    'хост подключён к серверу {name} ({serverId}); токен хоста сохранён в {file}',
  'could not limit who may read {file}: check its permissions':
    'не удалось ограничить доступ к {file} — проверь, кто может его читать',
  'this machine is connected through {old}; connecting it through {cabinet} instead':
    'хост подключён через {old}; подключаю его через {cabinet}',
  'stopped before the machine was connected': 'остановлено до того, как хост подключился',
  'a running host picks up the new token by itself; otherwise start it: {command}':
    'работающий хост сам возьмёт новый токен; если хост не запущен, запусти его: {command}',
  'varion host install sets up a Windows scheduled task; on Linux run varion host as a systemd service':
    'varion host install заводит задачу планировщика Windows; на Linux запускай varion host службой systemd',
  'a scheduled task would show --token to anyone who can read it: connect the machine (varion host pair) or use --token-file':
    'задача планировщика показала бы --token всем, кто может её прочитать: подключи хост (varion host pair) или используй --token-file',
  'a task that starts with Windows can only be installed from an administrator terminal':
    'задачу, которая запускается вместе с Windows, можно завести только из терминала администратора',
  'the token file {file} is empty': 'файл токена {file} пуст',
  'varion host: applies deploys from the Varion cabinet ({root})':
    'varion host: применяет выкладки из кабинета Varion ({root})',
  'installed the scheduled task "{name}": it starts the host as SYSTEM when Windows starts':
    'заведена задача планировщика «{name}»: она запускает хост от имени SYSTEM вместе с Windows',
  'a host already runs in this folder (pid {pid}); the task starts it after the next restart of Windows':
    'в этой папке уже работает хост (pid {pid}); задача запустит его после следующего перезапуска Windows',
  'the task started the host now; its log: {file}':
    'задача уже запустила хост; его журнал — {file}',
  'the task did not start now; it starts the host with the next start of Windows':
    'сейчас задача не запустилась; она запустит хост при следующем запуске Windows',
  'to remove it: {command} (or schtasks /Delete /TN "{name}" /F)':
    'убрать её: {command} (или schtasks /Delete /TN "{name}" /F)',
  'the scheduled task can only be removed from an administrator terminal':
    'задачу планировщика можно убрать только из терминала администратора',
  'there is no scheduled task "{name}": nothing to remove':
    'задачи планировщика «{name}» нет — убирать нечего',
  'removed the scheduled task "{name}": the host no longer starts with Windows':
    'задача планировщика «{name}» убрана: хост больше не запускается вместе с Windows',
  'the host that runs now (pid {pid}) keeps running; to stop it: {command}':
    'хост, который работает сейчас (pid {pid}), продолжает работать; остановить его: {command}',
  'schtasks did not create the task {name} (exit code {code}): {output}':
    'schtasks не завёл задачу {name} (код {code}): {output}',
  'schtasks did not remove the task {name} (exit code {code}): {output}':
    'schtasks не убрал задачу {name} (код {code}): {output}',
  'cannot read the host token {file}: {reason}':
    'не удалось прочитать токен хоста {file}: {reason}',
  '{file} is not a host token file (connect the machine again: varion host pair)':
    '{file} — не файл токена хоста (подключи хост заново: varion host pair)',
  'the cabinet answered without a code for this machine': 'кабинет ответил без кода для хоста',
  'the cabinet connected the machine but sent no valid token or server id':
    'кабинет подключил хост, но не прислал годный токен или номер сервера',
  'connecting the machine': 'подключение хоста',
  'the cabinet {cabinet} does not connect machines by code: start the host with --token from the cabinet':
    'кабинет {cabinet} не подключает хосты по коду — запусти хост с --token из кабинета',
  'the cabinet gave no code for this machine ({error}); retrying':
    'кабинет не выдал код для хоста ({error}) — повторю',
  'to connect this machine, enter the code {code} in the cabinet on the page of your server: {url} (the code is valid for {minutes} min)':
    'введи код {code} в кабинете на странице своего сервера, чтобы подключить хост: {url} (код действует {minutes} мин)',
  'the code {code} is no longer valid; asking for a new one':
    'код {code} больше не действует — запрашиваю новый',

  // ---- status ----
  running: 'работает',
  starting: 'запускается',
  stopping: 'останавливается',
  stopped: 'остановлен',
  'crashed, waiting to restart': 'упал, ждёт перезапуска',
  'not started (error)': 'не запущен (ошибка)',
  'no release': 'без выпуска',
  'process alive (host not running)': 'процесс жив (хост не запущен)',
  'host folder: {dir}': 'папка хоста: {dir}',
  'not yet': 'ещё не было',
  'ok, {seconds} s ago': 'ок, {seconds} с назад',
  'failed: {error}, {seconds} s ago': 'ошибка: {error}, {seconds} с назад',
  'host: running (pid {pid}, id {hostId}), cabinet {cabinet}, last poll: {poll}':
    'хост: работает (pid {pid}, id {hostId}), кабинет {cabinet}, опрос: {poll}',
  'now: {action} {releaseId}': 'сейчас: {action} {releaseId}',
  'unsent statuses: {count}': 'неотправленных статусов: {count}',
  'host: not running (last seen {time})': 'хост: не запущен (последний раз {time})',
  'host: not running': 'хост: не запущен',
  'trusted keys: {count}': 'доверенных ключей: {count}',
  'approved in the cabinet: {count}': 'одобрено в кабинете: {count}',
  'connected to the server {name} ({serverId}) through {cabinet}':
    'подключён к серверу {name} ({serverId}) через {cabinet}',
  'not connected to a server by code (varion host does it on its first run)':
    'к серверу по коду не подключён (varion host сделает это при первом запуске)',
  'engines: {engines}': 'движки: {engines}',
  'engines: none': 'движков нет',
  'cached assets: {count}': 'ассетов в кэше: {count}',
  'no instances': 'экземпляров нет',
  'restarts: {count}': 'перезапусков: {count}',
  'expires {time}': 'истекает {time}',
  preview: 'превью',
  'release {releaseId}': 'выпуск {releaseId}',
  'port {port}/{httpPort}': 'порт {port}/{httpPort}',
  'port {port}': 'порт {port}',

  // ---- the host ----
  '--preview-ports: expected a range like 7962-7999 (each preview takes a game port and the next one for HTTP)':
    '--preview-ports: нужен диапазон вида 7962-7999 (каждому превью — порт игры и следующий за ним для HTTP)',
  'resources restarted: {resources}': 'перезапущены ресурсы: {resources}',
  'full restart': 'полный перезапуск',
  'no restart': 'без перезапуска',
  'host id "{hostId}" is not valid: 1-64 characters A-Z a-z 0-9 . _ : -':
    'идентификатор хоста «{hostId}» недопустим: 1-64 знака A-Z a-z 0-9 . _ : -',
  'servers: {servers}': 'серверы: {servers}',
  'previews on ports {ports}': 'превью на портах {ports}',
  'previews off': 'превью выключены',
  'host {hostId} in {root}: cabinet {cabinet}, trusted keys: {keys}, instances: {instances}':
    'хост {hostId} в {root}: кабинет {cabinet}, доверенных ключей: {keys}, экземпляров: {instances}',
  '(custom)': '(свой)',
  'no trusted keys: every deploy request will be refused (approve a developer key for this server in the cabinet, or add one with varion host trust <key>)':
    'нет доверенных ключей: все запросы выкладки будут отклонены (одобри ключ разработчика для этого сервера в кабинете или добавь ключ: varion host trust <key>)',
  'no --server-id (the server id in the cabinet): test and prod deploys are refused, only previews for server "preview" are taken':
    'не задан --server-id (номер сервера в кабинете): выкладки test и prod не принимаются, только превью для сервера «preview»',
  'the host restarted during the deploy (phase {phase}); {releaseId} is active':
    'хост перезапустился посреди выкладки (фаза {phase}); действует {releaseId}',
  'the host restarted during the deploy (phase {phase})':
    'хост перезапустился посреди выкладки (фаза {phase})',
  'deploy {deployId}: {error}': 'выкладка {deployId}: {error}',
  'a host is already running in this folder (pid {pid}); stop it first: varion host stop':
    'в этой папке уже работает хост (pid {pid}); сначала останови его: varion host stop',
  'asked to stop (varion host stop)': 'получена просьба остановиться (varion host stop)',
  'housekeeping failed: {error}': 'уборка не удалась: {error}',
  'the cabinet answers again': 'кабинет снова отвечает',
  'cabinet poll failed ({error}); retrying': 'опрос кабинета не прошёл ({error}) — повторю',
  'the cabinet refuses the host token ({error}); if this machine was disconnected in the cabinet, connect it again: {command}':
    'кабинет не принимает токен хоста ({error}); если хост отключили в кабинете, подключи его заново: {command}',
  'picked up the new host token from {file}': 'взят новый токен хоста из {file}',
  'the cabinet sent {count} keys that are not Ed25519 public keys; they are not trusted':
    'кабинет прислал ключи, которые не являются открытыми ключами Ed25519 ({count}); им не доверяю',
  'the cabinet hands out no approved keys: only the keys trusted here count':
    'кабинет не выдаёт одобренные ключи — действуют только ключи, которым доверяют здесь',
  'the keys approved in the cabinet are not trusted until the cabinet hands them out again ({error})':
    'ключам, одобренным в кабинете, не доверяю, пока кабинет снова их не выдаст ({error})',
  'could not refresh the keys approved in the cabinet ({error}); the last list stays for a few minutes':
    'не удалось обновить ключи, одобренные в кабинете ({error}); прежний список действует ещё несколько минут',
  'keys approved in the cabinet: {count} ({names})':
    'ключей, одобренных в кабинете: {count} ({names})',
  'no keys are approved in the cabinet for this server':
    'для этого сервера в кабинете не одобрено ни одного ключа',
  'the cabinet says the host token belongs to server {serverId}; the host does not take its word for it: to accept test and prod deploys, run with --server-id {serverId}':
    'кабинет называет токен хоста токеном сервера {serverId}; хост не верит ему на слово — чтобы принимать выкладки test и prod, запусти с --server-id {serverId}',
  'the cabinet says the host token belongs to server {serverId}, but the host runs with --server-id {serverIds}: check the token':
    'кабинет называет токен хоста токеном сервера {serverId}, а у хоста --server-id {serverIds} — проверь токен',
  'stopping the servers': 'останавливаю серверы',
  'the host is stopping': 'хост останавливается',
  'replayed request: its nonce was already used': 'повтор запроса: его nonce уже использован',
  'request {deployId} refused: {error}': 'запрос {deployId} отклонён: {error}',
  'request without a deployId refused: {error}': 'запрос без deployId отклонён: {error}',
  'request {deployId}: {action} {releaseId} for {project}/{env} (key "{key}")':
    'запрос {deployId}: {action} {releaseId} для {project}/{env} (ключ «{key}»)',
  'key "{name}" may not deploy to prod on this server':
    'у ключа «{name}» нет права выкладывать на prod этого сервера',
  'key "{name}" may not deploy to test and previews on this server':
    'у ключа «{name}» нет права выкладывать на test и превью этого сервера',
  'previews are off on this host (no --preview-ports)':
    'превью на этом хосте выключены (не задан --preview-ports)',
  'the request is for server {serverId}, this host serves {serverIds}':
    'запрос для сервера {serverId}, а этот хост обслуживает {serverIds}',
  'the preview is for server {serverId}, this host has no --server-id':
    'превью для сервера {serverId}, а у этого хоста не задан --server-id',
  'this host has no --server-id: {env} deploys are refused (the request is for server {serverId})':
    'у этого хоста не задан --server-id: выкладки {env} не принимаются (запрос для сервера {serverId})',
  'instance {name} belongs to {project} on server {serverId}':
    'экземпляр {name} принадлежит {project} на сервере {serverId}',
  'instance {name} created (ports {port}/{httpPort})':
    'экземпляр {name} создан (порты {port}/{httpPort})',
  'instance {name} created': 'экземпляр {name} создан',
  'the first deploy failed': 'первая выкладка не удалась',
  '{instance}: release {releaseId} is active ({how}); old releases removed: {pruned}':
    '{instance}: выпуск {releaseId} действует ({how}); убраны старые выпуски: {pruned}',
  '{instance}: release {releaseId} is active ({how})':
    '{instance}: выпуск {releaseId} действует ({how})',
  'there is no instance {name} on this host: nothing to roll back':
    'на этом хосте нет экземпляра {name} — откатывать нечего',
  'rollback: {name} has no deploy history': 'откат: у {name} нет истории выкладок',
  'rollback: the request rolls back {releaseId}, but {current} is active on {name}; only the active release can be rolled back':
    'откат: запрос откатывает {releaseId}, а на {name} действует {current} — откатывается только действующий выпуск',
  'rollback: the SHA-256 in the request does not match the active release':
    'откат: SHA-256 в запросе не совпадает с действующим выпуском',
  'rollback: nothing was active on {name} before {current}':
    'откат: до {current} на {name} ничего не было',
  '{instance}: rolled back from {from} to {releaseId} ({how})':
    '{instance}: откат с {from} на {releaseId} ({how})',
  '{instance}: release {releaseId} is already on disk and matches':
    '{instance}: выпуск {releaseId} уже на диске и сходится',
  '{instance}: the copy of release {releaseId} does not match ({error}); downloading it again':
    '{instance}: копия выпуска {releaseId} не сходится ({error}) — качаю заново',
  'the bundle SHA-256 ({found}...) does not match the signed one ({expected}...)':
    'SHA-256 архива ({found}…) не сходится с подписанным ({expected}…)',
  '{instance}: release {releaseId} verified (bundle {size}, files: {files}, assets: {assets}, downloaded: {downloaded}, engine {engine})':
    '{instance}: выпуск {releaseId} проверен (архив {size}, файлов: {files}, ассетов: {assets}, скачано: {downloaded}, движок {engine})',
  '{instance}: release {releaseId} verified (bundle {size}, files: {files}, engine {engine})':
    '{instance}: выпуск {releaseId} проверен (архив {size}, файлов: {files}, движок {engine})',
  'no free preview ports in {from}-{to}': 'нет свободных портов для превью в {from}-{to}',
  'port {port} is already taken by instance {name} of this host':
    'порт {port} уже занят экземпляром {name} этого хоста',
  '{instance}: the preview expired (last deploy {time}); stopping and removing it':
    '{instance}: превью истекло (последняя выкладка {time}) — останавливаю и удаляю',
  'the preview expired': 'превью истекло',
  '{instance}: removed (the whole folder: the host made it)':
    '{instance}: удалён (папка целиком — её создал хост)',
  '{instance}: removed (only what the host made)':
    '{instance}: удалён (только то, что сделал хост)',
  '{instance}: could not remove it ({error})': '{instance}: не удалось удалить ({error})',
  'status {deployId}: {phase}': 'статус {deployId}: {phase}',
  'the cabinet refused the status of {deployId} ({error})':
    'кабинет не принял статус {deployId} ({error})',
  'the status of {deployId} did not reach the cabinet ({error}); will send it later':
    'статус {deployId} не дошёл до кабинета ({error}) — отправлю позже',
  'instance name "{name}" is not valid': 'имя экземпляра «{name}» недопустимо',
  'instance name "{name}" is not valid: {reason}': 'имя экземпляра «{name}» недопустимо: {reason}',

  // ---- cabinet, keys, requests ----
  'cabinet poll': 'опрос кабинета',
  'approved keys': 'одобренные ключи',
  'deploy status': 'статус выкладки',
  'not a developer key: expected the base64 of 32 bytes that `varion keys show` prints':
    'это не ключ разработчика: нужен base64 из 32 байт, который печатает `varion keys show`',
  'not an Ed25519 public key': 'это не открытый ключ Ed25519',
  'key name "{name}" is not valid: up to 64 letters, digits, spaces and . _ @ + -':
    'имя ключа «{name}» недопустимо: до 64 букв, цифр, пробелов и . _ @ + -',
  '{file}: not a trusted keys file (expected {"format": 1, "keys": [...]})':
    '{file}: это не файл доверенных ключей (нужен {"format": 1, "keys": [...]})',
  '{file}: key {number}: {reason}': '{file}: ключ №{number}: {reason}',
  'the deploy request has no "request" object': 'в запросе выкладки нет объекта «request»',
  'the deploy request has no "{field}" field': 'в запросе выкладки нет поля «{field}»',
  'action "{action}" is not valid: expected activate or rollback':
    'действие «{action}» недопустимо: нужно activate или rollback',
  'environment "{env}" is not valid: expected test, prod or preview-<branch>':
    'окружение «{env}» недопустимо: нужно test, prod или preview-<branch>',
  'project "{project}" is not valid: up to 64 Latin letters, digits and . _ -':
    'проект «{project}» недопустим: до 64 латинских букв, цифр и . _ -',
  'release id "{releaseId}" is not valid: expected YYYYMMDD-hhmmss-<8 hex digits>':
    'номер выпуска «{releaseId}» недопустим: нужно ГГГГММДД-ччммсс-<8 hex-цифр>',
  'server id "{serverId}" is not valid': 'номер сервера «{serverId}» недопустим',
  'the bundle SHA-256 is not valid: expected 64 lowercase hex digits':
    'SHA-256 архива недопустим: нужно 64 строчные шестнадцатеричные цифры',
  'issuedAt "{issuedAt}" is not an ISO 8601 time': 'issuedAt «{issuedAt}» — не время ISO 8601',
  'the nonce is not valid: expected the base64url of 16 bytes':
    'nonce недопустим: нужен base64url из 16 байт',
  'server id "preview" is only for preview-<branch> environments':
    'номер сервера «preview» — только для окружений preview-<branch>',
  'the deploy request is empty': 'запрос выкладки пуст',
  'the request key is not valid: expected the base64 of 32 bytes':
    'ключ запроса недопустим: нужен base64 из 32 байт',
  'key {key} is not trusted on this host (varion host trust <key>)':
    'ключ {key} не входит в доверенные ключи этого хоста (varion host trust <key>)',
  'the request signature is not valid: expected the base64 of 64 bytes':
    'подпись запроса недопустима: нужен base64 из 64 байт',
  'the request signature does not match (key "{name}")':
    'подпись запроса не сходится (ключ «{name}»)',
  'the request is too old: signed {minutes} min ago, accepted up to {limit} min':
    'запрос устарел: подписан {minutes} мин назад, принимаются не старше {limit} мин',
  'the request is from the future: signed {seconds} s ahead of the host clock (up to {limit} min is accepted); check the clocks':
    'запрос из будущего: подписан на {seconds} с позже часов хоста (допускается до {limit} мин) — проверь время',
  '{file}: the list of used nonces is damaged; the host will not run without it':
    '{file}: список использованных nonce испорчен — без него хост не продолжит',
};
