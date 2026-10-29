export default {
  // varion build, varion check
  'the build failed (errors above)': 'сборка не прошла (ошибки выше)',
  'done: {resource} ({seconds} s)': 'готово: {resource} ({seconds} с)',
  'varion check is for the standard build ([build] server/client/ui); this project has its own [build.steps]':
    'varion check — для стандартной сборки ([build] server/client/ui), а у проекта свои шаги [build.steps]',
  'nothing to check: no part of the mode has a tsconfig.json':
    'нечего проверять: ни у одной части режима нет tsconfig.json',
  'cannot check types: {reason} (run npm install)':
    'проверить типы нельзя: {reason} (выполни npm install)',
  '{part}: no errors ({seconds} s)': '{part}: без ошибок ({seconds} с)',
  'type check of {part}': 'проверка типов {part}',
  "[build] server: {file} does not exist (the entry point of the mode's server)":
    '[build] server: нет файла {file} (точка входа сервера режима)',
  '[build] {part}: {file} does not exist, so this part is not built':
    '[build] {part}: нет {file}, эта часть не собирается',
  '[config] {keys}: engine 1.0.75 and older garble non-Latin text in varion.getResourceConfig() on Windows with a Cyrillic code page; keep such text in code or in .env, or use a newer engine':
    '[config] {keys}: движок 1.0.75 и раньше искажает нелатинский текст в varion.getResourceConfig() на Windows с кириллической кодовой страницей; держи такой текст в коде или в .env либо возьми движок новее',
  '[build] copy: {item} does not exist': '[build] copy: нет {item}',
  'type check skipped: {reason}': 'проверка типов пропущена: {reason}',
  'built {part} in {seconds} s': 'собрано: {part} за {seconds} с',
  'build of {part}': 'сборка {part}',
  '{title}: 1 error': '{title}: 1 ошибка',
  '{title}: {count} errors': '{title}: ошибок {count}',
  '... and {count} more': '… и ещё {count}',
  'typescript is not installed in the project': 'в проекте не установлен typescript',
  'tsc exited with code {code}': 'tsc завершился с кодом {code}',

  // varion deploy, varion keys
  'cannot write the release bundle: {reason}': 'архив выпуска не записан: {reason}',
  'name the environment: varion deploy test|prod|preview-<branch>':
    'укажи окружение: varion deploy test|prod|preview-<branch>',
  'deploy environment "{env}" is not test, prod or preview-<branch> (lowercase Latin letters, digits, . _ -)':
    'окружение выкладки «{env}» — не test, не prod и не preview-<branch> (строчные латинские буквы, цифры, . _ -)',
  'environment {env}: [env.{overrides}] over [server]':
    'окружение {env}: [env.{overrides}] поверх [server]',
  'a release needs the engine version: [engine] version, or version.json in the [engine] path folder':
    'выпуску нужна версия движка: [engine] version или version.json в папке [engine] path',
  'the release build failed (errors above)': 'сборка выпуска не прошла (ошибки выше)',
  'the server refused the release resources (--pack-resources, exit code {code})':
    'сервер не принял ресурсы выпуска (--pack-resources, код {code})',
  'the server itself checked the release resources (--pack-resources)':
    'ресурсы выпуска проверены самим сервером (--pack-resources)',
  '{name}: no url in {lock}, so the server cannot download it (upload the pack, then run varion assets lock with [assets] url)':
    '{name}: в {lock} нет url, и сервер не сможет его скачать (залей пак и выполни varion assets lock с [assets] url)',
  'release {releaseId} ({env}): {files} files, {size}, in {zip}; packs by hash: {assets}':
    'выпуск {releaseId} ({env}): файлов {files}, {size}, в {zip}; паков по хешу: {assets}',
  'release {releaseId} ({env}): {files} files, {size}, in {zip}':
    'выпуск {releaseId} ({env}): файлов {files}, {size}, в {zip}',
  '[deploy.{env}] server is missing: the number of the cabinet server to deploy to':
    'нет [deploy.{env}] server: номера сервера в кабинете, куда выкладывать',
  'no developer token: sign in with {command}, or set VARION_DEPLOY_TOKEN (for CI; in .env or in the environment)':
    'нет токена разработчика: войди командой {command} или задай VARION_DEPLOY_TOKEN (для CI; в .env или в переменной окружения)',
  '{env} has no server: previews of a signed-in computer go to [deploy.test] server, which is not set (or set [deploy.{env}] server)':
    'у {env} нет сервера: превью с компьютера, где выполнен вход, уходят на [deploy.test] server, а он не задан (или задай [deploy.{env}] server)',
  'the sign-in of this computer is no longer valid: {command}':
    'вход с этого компьютера больше не действует: {command}',
  '--rollback sends no release, so it does not go with --pack-only':
    '--rollback не отправляет выпуск, поэтому с --pack-only не сочетается',
  'the cabinet knows no active release in {env} on server {serverId}: nothing to roll back':
    'кабинет не знает действующего выпуска {env} на сервере {serverId} — откатывать нечего',
  '{env} on server {serverId} runs the project {other}, not {project} of this folder':
    'в {env} на сервере {serverId} работает проект {other}, а не {project} из этой папки',
  'rolling back {releaseId}, the active release of {env} on server {serverId}':
    'откатываю {releaseId} — действующий выпуск {env} на сервере {serverId}',
  '{releaseId} is rolled back on {serverId}: the release before it runs again':
    '{releaseId} откачен на {serverId}: снова работает выпуск, что был до него',
  'uploading {releaseId} to {cabinet} (server {serverId})':
    'загружаю {releaseId} в {cabinet} (сервер {serverId})',
  'uploaded {releaseId}': 'загружен {releaseId}',
  'deploy request signed and sent ({deployId})':
    'запрос выкладки подписан и отправлен ({deployId})',
  '{releaseId} is running on {serverId}: {link}': '{releaseId} работает на {serverId}: {link}',
  '{releaseId} is running on {serverId}': '{releaseId} работает на {serverId}',
  'deploy ended: {phase} ({error})': 'выкладка закончилась: {phase} ({error})',
  'deploy ended: {phase}': 'выкладка закончилась: {phase}',
  'unknown command "varion keys {action}": use init or show':
    'нет команды «varion keys {action}»: есть init и show',
  'public key: {key}': 'открытый ключ: {key}',
  'the key comes from VARION_DEPLOY_KEY, not from the keys folder':
    'ключ взят из VARION_DEPLOY_KEY, а не из папки ключей',

  // varion login, logout, whoami
  'confirm the code {code} in the browser: {url} (valid for {minutes} min)':
    'подтверди код {code} в браузере: {url} (код действует {minutes} мин)',
  'signed in to {cabinet} as {name}': 'вход в {cabinet} выполнен: {name}',
  'created the developer key {fingerprint} ({file})':
    'создан ключ разработчика {fingerprint} ({file})',
  'the developer key was not added to your account ({error}); run varion login again':
    'ключ разработчика не добавлен в твою учётную запись ({error}) — выполни varion login ещё раз',
  'the developer key was not added to your account: {error}':
    'ключ разработчика не добавлен в твою учётную запись: {error}',
  'the developer key {fingerprint} is added to your account; the owner of a server approves it in the cabinet before your deploys go there (your own servers trust it already)':
    'ключ разработчика {fingerprint} добавлен в твою учётную запись; выкладки на чужой сервер пойдут после того, как его владелец одобрит ключ в кабинете (твои собственные серверы ему уже доверяют)',
  'this computer forgot the sign-in to {cabinet}; to revoke the token itself, remove this device in the cabinet':
    'этот компьютер забыл вход в {cabinet}; чтобы отозвать сам токен, удали это устройство в кабинете',
  'this computer is not signed in to {cabinet}': 'с этого компьютера не выполнен вход в {cabinet}',
  'this computer is not signed in to {cabinet}: {command}':
    'с этого компьютера не выполнен вход в {cabinet}: {command}',
  'the cabinet no longer accepts the sign-in of this computer: {command}':
    'кабинет больше не принимает вход с этого компьютера: {command}',
  '{name} (account {id}) at {cabinet}': '{name} (учётная запись {id}) в {cabinet}',
  'no servers yet: create one in the cabinet or accept an invite':
    'серверов пока нет: создай сервер в кабинете или прими приглашение',
  'deploys to test, previews and prod': 'выкладки на test, превью и prod',
  'deploys to test and previews': 'выкладки на test и превью',
  'deploys to prod': 'выкладки на prod',
  'no deploys': 'без права выкладки',
};
