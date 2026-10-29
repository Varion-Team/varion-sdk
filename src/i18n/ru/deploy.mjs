export default {
  // developer key
  '{source} is not a PEM private key': '{source} — не закрытый ключ PEM',
  '{source}: the key type is {type}, but deploy requests are signed with Ed25519':
    '{source}: ключ типа {type}, а запросы выкладки подписываются Ed25519',
  'no developer key yet ({file}): create one with varion keys init, or set VARION_DEPLOY_KEY':
    'ключа разработчика ещё нет ({file}): создай его командой varion keys init или задай VARION_DEPLOY_KEY',
  'cannot read the developer key {file}: {reason}':
    'ключ разработчика {file} не читается: {reason}',
  'VARION_DEPLOY_KEY is set and wins over a new key: unset it first':
    'задан VARION_DEPLOY_KEY, и он важнее нового ключа: сначала убери его',
  'cannot write the developer key {file}: {reason}':
    'ключ разработчика {file} не записан: {reason}',

  // deploy request
  'deploy request: action must be activate or rollback':
    'запрос выкладки: action — activate или rollback',
  'deploy request: env "{env}" must be test, prod or preview-<branch>':
    'запрос выкладки: env «{env}» — test, prod или preview-<branch>',
  'deploy request: project "{project}" may only have Latin letters, digits and . _ -':
    'запрос выкладки: в project «{project}» допустимы только латинские буквы, цифры и . _ -',
  'deploy request: releaseId "{releaseId}" must look like YYYYMMDD-HHMMSS-<8 hex digits>':
    'запрос выкладки: releaseId «{releaseId}» должен иметь вид YYYYMMDD-HHMMSS-<8 hex>',
  'deploy request: serverId "{serverId}" must be a cabinet server number or preview':
    'запрос выкладки: serverId «{serverId}» — номер сервера в кабинете или preview',
  'deploy request: sha256 must be the SHA-256 of the release bundle (64 hex digits)':
    'запрос выкладки: sha256 — SHA-256 архива выпуска (64 hex)',
  'deploy request: serverId preview is only for preview-<branch> environments':
    'запрос выкладки: serverId preview — только для окружений preview-<branch>',
  'deploy request: issuedAt must be an ISO time': 'запрос выкладки: issuedAt — время в формате ISO',
  'deploy request: nonce must be 16 bytes in base64url':
    'запрос выкладки: nonce — 16 байт в base64url',
  'the signing key is not an Ed25519 key': 'ключ подписи — не Ed25519',
  'branch "{branch}" does not give a preview name': 'из ветки «{branch}» не выходит имя превью',

  // cabinet
  'cabinet address "{url}" is not a URL': 'адрес кабинета «{url}» — не URL',
  'cabinet address "{url}" needs https://': 'адресу кабинета «{url}» нужен https://',
  'a cabinet address may not carry a user name or a password':
    'в адресе кабинета не пишут имя пользователя и пароль',
  'http:// is only for a cabinet on this computer: {host} needs https://, or the token would travel in clear text':
    'http:// — только для кабинета на этом компьютере: для {host} нужен https://, иначе токен уйдёт открытым текстом',
  'server "{serverId}" must be a cabinet server number (or preview)':
    'сервер «{serverId}» — номер сервера в кабинете (или preview)',
  "the developer token (VARION_DEPLOY_TOKEN) must look like varion_dev_...: the server's cabinet issues it":
    'токен разработчика (VARION_DEPLOY_TOKEN) должен выглядеть как varion_dev_...: его выдаёт кабинет сервера',
  'the cabinet {host} broke off its answer: {reason}': 'кабинет {host} оборвал ответ: {reason}',
  'the cabinet {host} is out of reach: {reason}': 'кабинет {host} недоступен: {reason}',
  'the cabinet answered HTTP {status}': 'кабинет ответил HTTP {status}',
  'cannot list the releases': 'список выпусков не получен',
  'no release bundle at {file}': 'нет архива выпуска {file}',
  '{file} is not a release bundle': '{file} — не архив выпуска',
  'the release is {size}, over the cabinet limit of {limit}: put big packs in assets, the host downloads them by hash':
    'выпуск весит {size}, больше лимита кабинета {limit}: большие паки клади в assets, хост скачивает их по хешу',
  'the release was not uploaded': 'выпуск не загружен',
  'the cabinet confirmed SHA-256 {confirmed}, but the bundle has {sha256}':
    'кабинет подтвердил SHA-256 {confirmed}, а у архива {sha256}',
  'the deploy request was refused': 'запрос выкладки не принят',
  'the cabinet accepted the request but named no deployId':
    'кабинет принял запрос, но не назвал deployId',
  'no deployId': 'нет deployId',
  'cannot read the deploy status': 'состояние выкладки не получено',
  "the server's host is offline: the request waits for it up to 10 minutes":
    'хост сервера сейчас не на связи: запрос ждёт его до 10 минут',
  "deploy {deployId} did not finish in {minutes} min (now: {status}); follow it in the server's cabinet":
    'выкладка {deployId} не закончилась за {minutes} мин (сейчас: {status}); следи за ней в кабинете сервера',
  'the sign-in token must look like varion_cli_...: sign in again with varion login':
    'токен входа должен выглядеть как varion_cli_...: войди заново командой varion login',
  'the cabinet confirmed the sign-in but sent no varion_cli_... token':
    'кабинет подтвердил вход, но не прислал токен varion_cli_...',
  'the cabinet did not start the sign-in': 'кабинет не начал вход',
  'the cabinet started the sign-in but gave no code to confirm':
    'кабинет начал вход, но не дал кода для подтверждения',
  'the sign-in failed': 'вход не удался',
  'the sign-in was declined in the cabinet': 'вход отклонён в кабинете',
  'the cabinet answered the sign-in with "{status}"': 'кабинет ответил на вход: «{status}»',
  'the code was not confirmed in time: run varion login again':
    'код не подтвердили вовремя — выполни varion login ещё раз',
  'the developer key was not registered': 'ключ разработчика не добавлен',
  'cannot read the account': 'не удалось прочитать учётную запись',
  'deploy {deployId}: no status from the cabinet in {minutes} min':
    'выкладка {deployId}: кабинет не сообщил состояние за {minutes} мин',
};
