export default {
  // varion --help
  'resources for sale': 'ресурсы на продажу',
  'pack a resource for sale: the code sealed, the config left open':
    'упаковать ресурс для продажи: код закрыт, настройки остаются открытыми',
  'pack a resource and publish it as a new version':
    'упаковать ресурс и выложить его новой версией',
  'put a bought resource into the resources folder of a server':
    'поставить купленный ресурс в папку ресурсов сервера',

  // varion pack
  '{dir}: no resource.toml here': '{dir}: здесь нет resource.toml',
  'resource.toml has no [market] table: add name = "<name on the platform>" and version = "1.0.0" there':
    'в resource.toml нет таблицы [market]: добавь в неё name = "<имя на платформе>" и version = "1.0.0"',
  '[market] name "{name}": 3 to 40 lower-case letters, digits and dashes, as the resource is named on the platform':
    '[market] name "{name}": от 3 до 40 строчных латинских букв, цифр и дефисов — так, как ресурс назван на платформе',
  'the version is three numbers with dots, like 1.2.0 (got "{version}")':
    'версия — три числа через точку, например 1.2.0 (указано "{version}")',
  'a resource is sold with a JavaScript server side (type = "js")':
    'продаётся ресурс с серверной частью на JavaScript (type = "js")',
  'main = "{main}" is not among the files that are packed for the server':
    'main = "{main}" нет среди файлов, которые упаковываются для сервера',
  'client-main = "{main}" is not among the files that are packed for the clients':
    'client-main = "{main}" нет среди файлов, которые упаковываются для клиентов',
  'resource.toml names no main and no client-main: there is nothing to run':
    'в resource.toml нет ни main, ни client-main: запускать нечего',
  '{path}: a packed path holds only Latin letters, digits, spaces and . _ @ + - /':
    '{path}: в пути упаковываемого файла допустимы только латинские буквы, цифры, пробелы и . _ @ + - /',
  '{path} is larger than 8 MB: a package takes smaller files':
    '{path} больше 8 МБ: в пакет идут файлы меньшего размера',
  '{count} files: a package takes up to 2000': '{count} файлов: в пакет идёт не больше 2000',
  'the files add up to {mb} MB: a package takes up to 32 MB (leave big assets out with [market] exclude)':
    'файлы занимают {mb} МБ: пакет вмещает до 32 МБ (большие файлы исключи через [market] exclude)',
  'the file is not a package made by varion pack':
    'этот файл — не пакет, собранный командой varion pack',
  '{name} {version} packed: {file} ({size})': '{name} {version} упакован: {file} ({size})',
  'server, sealed: {count} files, {size}': 'сервер, закрыто: файлов — {count}, {size}',
  'clients, sealed: {count} files, {size}': 'клиенты, закрыто: файлов — {count}, {size}',
  'left open for the buyer: {list}': 'остаётся открытым у покупателя: {list}',
  '{folder} is not packed: build your dependencies into the server script, or name the folder in [market] open':
    '{folder} не упакована: собери зависимости в серверный скрипт или укажи эту папку в [market] open',

  // varion publish
  '{name} {version} packed ({size})': '{name} {version} упакован ({size})',
  'the version was not published': 'версия не выложена',
  '{name} {version} is published as a beta: servers of buyers let into betas load it at their next start':
    '{name} {version} выложен как бета-версия: её загрузят при следующем запуске серверы покупателей с доступом к бета-версиям',
  "{name} {version} is published: buyers' servers load it at their next start":
    '{name} {version} выложен: серверы покупателей загрузят его при следующем запуске',

  // varion install
  'varion install <name>: the name of the resource as its page shows it':
    'varion install <имя>: имя ресурса — так, как оно указано на его странице',
  'the resource was not installed': 'ресурс не установлен',
  '{name} {version} is in {dir}': '{name} {version} лежит в {dir}',
  'kept as they are here (--force replaces them): {list}':
    'оставлены как есть (--force заменит их): {list}',
  'add "{folder}" to resources in server.toml; the code itself comes to the server from the platform when it starts':
    'добавь "{folder}" в resources в server.toml; сам код сервер получит от платформы при запуске',
};
