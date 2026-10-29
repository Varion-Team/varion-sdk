export default {
  warning: 'внимание',
  error: 'ошибка',
  'unknown error': 'неизвестная ошибка',

  // Sizes
  '{value} GB': '{value} ГБ',
  '{value} MB': '{value} МБ',
  '{value} KB': '{value} КБ',
  '{value} B': '{value} Б',

  // Files
  '{path}: not a file or a folder (a link?)': '{path}: не файл и не папка (ссылка?)',
  '{file}: broken JSON ({reason})': '{file}: испорченный JSON ({reason})',

  // HTTP
  request: 'запрос',
  download: 'загрузка',
  '{what}: "{url}" is not a URL': '{what}: «{url}» — не адрес',
  '{what}: a password in the URL is not accepted': '{what}: пароль в адресе не принимается',
  '{what}: https:// is required (http:// only for 127.0.0.1 and localhost): {origin}':
    '{what}: нужен https:// (http:// — только для 127.0.0.1 и localhost): {origin}',
  '{host}: no answer for {seconds} s': '{host}: нет ответа {seconds} с',
  'the answer is larger than {bytes} bytes': 'ответ больше {bytes} байт',
  '{what}: too many redirects': '{what}: слишком много перенаправлений',
  '{what}: redirect from https to http': '{what}: перенаправление с https на http',
  '{what}: HTTP {status} {path}': '{what}: HTTP {status} {path}',
  '{what}: the answer is not JSON': '{what}: ответ не JSON',
  '{what}: {size} bytes, expected {expected}': '{what}: {size} байт, ожидается {expected}',
  '{what}: {size} bytes, over the limit of {limit}': '{what}: {size} байт, больше предела {limit}',
  '{what}: over the limit of {limit} bytes': '{what}: больше предела {limit} байт',
  '{what}: more than the expected {expected} bytes': '{what}: больше ожидаемых {expected} байт',
  '{what}: received {size} bytes, expected {expected}':
    '{what}: пришло {size} байт, ожидается {expected}',

  // ZIP
  'empty file name': 'пустое имя файла',
  'empty file name "{path}"': 'пустое имя файла «{path}»',
  'path "{path}" is too long': 'путь «{path}» слишком длинный',
  'path "{path}" has a character Windows does not allow (\\ : < > " | ? * or a control character)':
    'в пути «{path}» символ, который Windows не допускает (\\ : < > " | ? * или управляющий)',
  'path "{path}" is absolute': 'путь «{path}» абсолютный',
  'path "{path}" is too deep': 'путь «{path}» слишком глубокий',
  'path "{path}" has an empty part': 'в пути «{path}» пустая часть',
  'path "{path}" leaves its folder': 'путь «{path}» выходит за свою папку',
  'path "{path}" has a name ending in a dot or a space (Windows drops them)':
    'в пути «{path}» имя кончается точкой или пробелом (Windows их отбрасывает)',
  'path "{path}" has a Windows device name': 'в пути «{path}» имя устройства Windows',
  'path "{path}" has a Windows short (8.3) name': 'в пути «{path}» короткое имя Windows (8.3)',
  'path "{path}" has a name over 255 bytes': 'в пути «{path}» имя длиннее 255 байт',
  'a ZIP64 value is too large': 'слишком большое значение ZIP64',
  'the archive is truncated': 'архив обрезан',
  'a file name in the archive is not UTF-8': 'имя файла в архиве не в UTF-8',
  'a file name in the archive is broken UTF-8': 'имя файла в архиве — испорченный UTF-8',
  'not a ZIP archive': 'это не ZIP-архив',
  'not a ZIP archive (no end of central directory)':
    'это не ZIP-архив (нет конца центрального каталога)',
  'the central directory is broken': 'центральный каталог испорчен',
  'an extra field of an entry is broken': 'дополнительное поле записи испорчено',
  'a ZIP64 field is broken': 'поле ZIP64 испорчено',
  'multi-volume archives are not supported': 'многотомные архивы не поддерживаются',
  'no ZIP64 locator': 'нет локатора ZIP64',
  'the ZIP64 record lies outside the archive': 'запись ZIP64 за пределами архива',
  'no ZIP64 record': 'нет записи ZIP64',
  'the archive has {count} entries, more than {max}': 'в архиве {count} записей, больше {max}',
  'the central directory is too large': 'центральный каталог слишком большой',
  'the central directory lies outside the archive': 'центральный каталог за пределами архива',
  'extra bytes in the central directory': 'лишние байты в центральном каталоге',
  '{name}: encrypted': '{name}: зашифрован',
  '{name}: a link or a special file, not a regular file':
    '{name}: ссылка или особый файл, а не обычный файл',
  '{name}: compression method {method} is not supported (only stored and deflate)':
    '{name}: сжатие {method} не поддерживается (только stored и deflate)',
  '{name}: the sizes of a stored entry differ': '{name}: размеры несжатой записи не сходятся',
  '{name}: the local header lies outside the data':
    '{name}: локальный заголовок за пределами данных',
  '{name}: broken local header': '{name}: испорчен локальный заголовок',
  '{name}: the local and central headers differ (compression method)':
    '{name}: локальный и центральный заголовки расходятся (сжатие)',
  '{name}: the local and central headers differ (name)':
    '{name}: локальный и центральный заголовки расходятся (имя)',
  '{name}: the data runs into the central directory':
    '{name}: данные заходят на центральный каталог',
  'entries of the archive overlap: {first} and {second}':
    'записи архива накладываются друг на друга: {first} и {second}',
  '{name}: unpacks to more than its declared size':
    '{name}: распаковывается больше заявленного размера',
  '{name}: the size differs from the declared one': '{name}: размер не сходится с заявленным',
  '{name}: CRC differs': '{name}: CRC не сходится',
  '{name}: larger than {bytes} bytes': '{name}: больше {bytes} байт',
  '{name}: {size} bytes in the archive, expected {expected}':
    '{name}: в архиве {size} байт, ожидается {expected}',
  '{name}: SHA-256 differs': '{name}: SHA-256 не сходится',
  '{name}: the archive has this file twice': '{name}: файл в архиве дважды',
  'the archive is over 4 GB: ZIP64 is not written': 'архив больше 4 ГБ: ZIP64 не записывается',

  // Engine packages
  'the engine manifest is not JSON': 'манифест движка — не JSON',
  'wrong engine package: {product} {found}, expected varion-server {version}':
    'не тот пакет движка: {product} {found}, нужен varion-server {version}',
  'the engine manifest is for the {found} channel, expected {channel}':
    'манифест движка для канала {found}, а нужен {channel}',
  'the engine manifest lists no files': 'в манифесте движка нет файлов',
  'engine manifest: {reason}': 'манифест движка: {reason}',
  'engine manifest: "{path}" is not allowed': 'манифест движка: файл «{path}» недопустим',
  'engine manifest: "{path}" has no valid size or SHA-256':
    'манифест движка: у «{path}» нет верного размера или SHA-256',
  'engine manifest: "{path}" is listed twice': 'манифест движка: «{path}» указан дважды',
  'the engine package {version} has no {exe} (a package for another system?)':
    'в пакете движка {version} нет {exe} (пакет для другой системы?)',
  '{dir} has no signed engine manifest': 'в {dir} нет подписанного манифеста движка',
  'the engine manifest signature does not match the Varion release key':
    'подпись манифеста движка не сходится с ключом выпусков Varion',
  'the engine package has an extra file: {path}': 'в пакете движка лишний файл: {path}',
  'the engine package has no {path}': 'в пакете движка нет файла {path}',
  'an engine file does not match the manifest: {path}':
    'файл движка не сходится с манифестом: {path}',
  'an engine file does not match the manifest: {path} ({reason})':
    'файл движка не сходится с манифестом: {path} ({reason})',
  'engine version "{version}" is not valid': 'недопустимая версия движка «{version}»',
  'engine channel "{channel}" is not valid': 'недопустимый канал движка «{channel}»',
  'engine {version} in {dir} failed its check ({reason}) and is in use: stop the servers running it':
    'движок {version} в {dir} не прошёл проверку ({reason}) и занят: останови серверы на нём',
  'engine {version} failed its check ({reason}); moved to {aside}, downloading it again':
    'движок {version} не прошёл проверку ({reason}); копия отложена в {aside}, скачиваю заново',
  'engine {version} ({channel}): downloading from {url}':
    'движок {version} ({channel}): скачиваю с {url}',
  'engine manifest': 'манифест движка',
  'engine manifest signature': 'подпись манифеста движка',
  'the signature of the engine {version} manifest does not match the Varion release key: the package is not installed':
    'подпись манифеста движка {version} не сходится с ключом выпусков Varion: пакет не установлен',
  'engine package': 'пакет движка',
  'engine {version}: {received} of {total}': 'движок {version}: {received} из {total}',
  'engine {version}: the release signature and {count} files are verified':
    'движок {version}: подпись выпуска и {count} файлов проверены',
  'engine package: entry {name} is not allowed': 'пакет движка: недопустимая запись {name}',
  'engine package: {reason}': 'пакет движка: {reason}',
  'engine package: {name} is outside Varion-Server/': 'пакет движка: {name} вне Varion-Server/',
  'engine package: {path} is there twice': 'пакет движка: {path} в нём дважды',
};
