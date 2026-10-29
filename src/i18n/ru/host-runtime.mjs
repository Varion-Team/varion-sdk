export default {
  // Server process
  'the server did not report ready within {seconds} s':
    'сервер не сообщил о готовности за {seconds} с',
  'the server did not start: {reason}': 'сервер не запустился: {reason}',
  'the server exited with code {code}': 'сервер вышел с кодом {code}',
  'the server is not running': 'сервер не работает',
  'the server did not answer within {seconds} s': 'сервер не ответил за {seconds} с',
  'the server console is closed': 'консоль сервера закрыта',
  'the server console refused "{command}": {reason}':
    'консоль сервера не приняла «{command}»: {reason}',

  // Instances
  '{name}: server started ({reason}): pid {pid}, ports {port}/{httpPort}, release {releaseId}':
    '{name}: сервер запущен ({reason}): pid {pid}, порты {port}/{httpPort}, выпуск {releaseId}',
  '{name}: server stopped ({reason}): pid {pid}': '{name}: сервер остановлен ({reason}): pid {pid}',
  'host start': 'запуск хоста',
  deploy: 'выкладка',
  rollback: 'откат',
  'rollback to {releaseId}': 'откат на {releaseId}',
  'restart after crash #{count}': 'перезапуск после падения №{count}',
  'the server crashed with code {code}': 'сервер упал с кодом {code}',
  '{name}: {error}; restarting in {seconds} s': '{name}: {error}, перезапуск через {seconds} с',
  '{name}: the server did not start ({error}); next attempt in {seconds} s':
    '{name}: сервер не запустился ({error}), следующая попытка через {seconds} с',
  '{name}: a server from the previous host run is still running (pid {pid}); stopping it':
    '{name}: сервер прошлого запуска хоста ещё работает (pid {pid}), останавливаю',
  '{name}: release {releaseId} failed its check at host start ({error}); the server stays stopped until the next deploy':
    '{name}: выпуск {releaseId} не прошёл проверку при запуске хоста ({error}), сервер не запустится до следующей выкладки',
  '{dir}: could not remove it (a file is in use)': '{dir}: не удалось удалить (файл занят)',

  // Activation
  'the active release deployed again': 'повторная выкладка действующего выпуска',
  'the server was not running': 'сервер не работал',
  'no resource files changed': 'файлы ресурсов не изменились',
  '{name}: full restart for release {releaseId} ({reasons})':
    '{name}: полный перезапуск на выпуск {releaseId} ({reasons})',
  'the server did not start: {reason} (the host keeps trying)':
    'сервер не запустился: {reason} (хост будет пробовать снова)',
  '{name}: release {releaseId} did not start ({error}); going back to {previous}':
    '{name}: выпуск {releaseId} не запустился ({error}), возвращаю {previous}',
  'the new release did not start: {error}; the previous release {previous} did not start either: {again}':
    'новый выпуск не запустился: {error}; прежний выпуск {previous} тоже: {again}',
  'the new release did not start: {error}; went back to {previous}':
    'новый выпуск не запустился: {error}; возвращён {previous}',
  'a resource could not be swapped while running: {error}': 'ресурс не подменить на ходу: {error}',
  '{name}: only resources changed ({changed}); restarting on the fly: {restart}':
    '{name}: изменились только ресурсы ({changed}), перезапуск на ходу: {restart}',
  '{name}: only resources changed ({changed}); none of them is loaded':
    '{name}: изменились только ресурсы ({changed}), ни один из них не загружен',
  '{name}: restart {resource}: server part {part}':
    '{name}: перезапуск {resource}: серверная часть — {part}',
  'resource {resource} did not restart (server part failed)':
    'ресурс {resource} не перезапустился (серверная часть: failed)',
  'only resources changed: {resources}': 'изменились только ресурсы: {resources}',
  '{name}: {error}; going back to {previous}': '{name}: {error}, возвращаю {previous}',
  'resource {resource} of the previous release did not restart either':
    'ресурс {resource} прежнего выпуска тоже не перезапустился',
  '{name}: the previous resources cannot be restarted on the fly ({error}); full restart for release {previous}':
    '{name}: прежние ресурсы на ходу не вернуть ({error}), полный перезапуск на выпуск {previous}',
  'the resource restart failed: {error}; going back to {previous} failed too: {again}':
    'перезапуск ресурсов не удался: {error}; возврат на {previous} тоже: {again}',
  'the resource restart failed: {error}; went back to {previous}':
    'перезапуск ресурсов не удался: {error}; возвращён {previous}',

  // What a deploy changes
  'the first release of the instance': 'первый выпуск экземпляра',
  'server.toml changed': 'изменился server.toml',
  'engine {from} → {to}': 'движок {from} → {to}',
  'resources added: {resources}': 'добавлены ресурсы: {resources}',
  'resources removed: {resources}': 'убраны ресурсы: {resources}',
  'resource.toml changed: {resources}': 'изменился resource.toml: {resources}',

  // release.json
  'not a JSON object': 'не объект JSON',
  'format {format} is not supported (this host reads format 1)':
    'формат {format} не поддерживается (этот хост понимает формат 1)',
  'the {key} field is missing': 'нет поля {key}',
  '{key} is "{value}" but the signed request says "{expected}"':
    '{key} — «{value}», а в подписанном запросе — «{expected}»',
  'no engine { version, channel }': 'нет engine { version, channel }',
  'engine.version "{version}" is not an engine version like 1.0.75':
    'engine.version «{version}» — не версия движка вида 1.0.75',
  'engine.channel "{channel}" may have only lowercase Latin letters, digits and -':
    'engine.channel «{channel}»: допустимы только строчные латинские буквы, цифры и -',
  'the files list is missing': 'нет списка files',
  '{count} files, more than {limit}': 'файлов {count}, больше {limit}',
  'an entry of files is not an object': 'запись в files — не объект',
  'a folder, not a file': 'папка, а не файл',
  'files must not list release.json itself': 'files не должен называть сам release.json',
  'a release holds only server.toml and resources/<resource>/...':
    'в выпуске только server.toml и resources/<ресурс>/...',
  'resource name "{name}" may have only Latin letters, digits, . _ -':
    'имя ресурса «{name}»: допустимы только латинские буквы, цифры, . _ -',
  'bad size {size}': 'недопустимый размер {size}',
  'sha256 must be 64 lowercase hex digits':
    'sha256 должен состоять из 64 строчных шестнадцатеричных цифр',
  'listed twice (case-insensitively)': 'повторяется (в том числе без учёта регистра)',
  'the release has no server.toml': 'в выпуске нет server.toml',
  'both a file and a folder': 'и файл, и папка',
  'the release files take {size} bytes, more than {limit}':
    'файлы выпуска занимают {size} байт, больше {limit}',
  'assets is not a list': 'assets — не список',
  '{count} assets, more than {limit}': 'ассетов {count}, больше {limit}',
  'an entry of assets is not an object': 'запись в assets — не объект',
  'name "{name}" is not a resource name (Latin letters, digits, . _ -)':
    'имя «{name}» — не имя ресурса (латинские буквы, цифры, . _ -)',
  'an asset goes under resources/{name}/, not at "{path}"':
    'ассет кладётся в resources/{name}/, а не в «{path}»',
  '"{path}" is already taken by a file of the release': '«{path}» уже занят файлом выпуска',
  'the path goes through a file': 'путь проходит через файл',

  // Release bundles
  'the archive has an encrypted file: {name}': 'в архиве зашифрованный файл: {name}',
  'the archive has a link or a special file: {name}': 'в архиве ссылка или особый файл: {name}',
  'the archive has a path that is not allowed: {reason}': 'в архиве недопустимый путь: {reason}',
  'the archive has a folder with data: {name}': 'в архиве папка с данными: {name}',
  'the archive has a folder without a slash at the end of its name: {name}':
    'в архиве папка без косой черты в конце имени: {name}',
  'the archive has a file twice (case-insensitively): {path}':
    'в архиве файл повторяется (в том числе без учёта регистра): {path}',
  'the archive has no release.json at its root': 'в корне архива нет release.json',
  'not JSON ({reason})': 'не JSON ({reason})',
  'the archive has a file release.json does not list: {path}':
    'в архиве лишний файл (его нет в release.json): {path}',
  'the archive lacks a file release.json lists: {path}':
    'в архиве нет файла из release.json: {path}',
  'the size differs from release.json: {path}': 'размер не сходится с release.json: {path}',
  'the path leaves the release folder: {path}': 'путь выходит за папку выпуска: {path}',
  'a file does not match release.json: {reason}': 'файл не сходится с release.json: {reason}',
  '{dir}: release.json is missing or broken ({reason})':
    '{dir}: release.json нет или он испорчен ({reason})',
  'the release folder has an extra file: {path}': 'в папке выпуска лишний файл: {path}',
  'the release folder lacks a file: {path}': 'в папке выпуска нет файла: {path}',
  'a release file was changed on disk: {path}': 'файл выпуска изменён на диске: {path}',

  // Assets
  'asset {name}': 'ассет {name}',
  'asset {name}: the cached copy ({sha256}) is damaged; downloading it again':
    'ассет {name}: копия в кэше ({sha256}) испорчена, скачиваю заново',
  'asset {name}: the damaged copy {file} cannot be removed (it is in use)':
    'ассет {name}: испорченную копию {file} не удалить (она занята)',
  'asset {name}: downloading {size} from {url}': 'ассет {name}: скачиваю {size} с {url}',
  'asset {name}: the SHA-256 of the download does not match release.json':
    'ассет {name}: SHA-256 скачанного не сходится с release.json',
};
