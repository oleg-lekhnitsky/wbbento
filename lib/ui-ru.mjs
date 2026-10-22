const names = {
 "day":"День",
 "sunset":"Закат",
 "Photo background · full-width box":"Фото · широкий текстовый блок",
 "Photo background · text box":"Фото · текст в блоке",
 "Photo background · bottom":"Фото · текст снизу",
 "Photo background · top text box":"Фото · текст в блоке сверху",
 "Photo background · left":"Фото · текст слева",
  "Driver introduction": "Знакомство с водителем",
  "Vehicle rental": "Аренда автомобиля",
  "Rental & driver": "Аренда и водитель",
  "Start today": "Начните сегодня",
  "Driver recruitment": "Набор водителей",
  "Photo & payments": "Фото и выплаты",
  "Your own car": "Свой автомобиль",
  "Rental offer": "Предложение аренды",
  "Square post": "Квадратный пост",
  "Portrait post": "Вертикальный пост",
  "Instagram Story": "Сторис Instagram",
  "Landscape": "Горизонтальный",
  "relaxed": "Водитель за рулём",
  "portrait": "Крупный портрет",
  "low-angle": "Ракурс снизу",
  "wheel-flash": "Из-за руля · вспышка",
  "phone": "Водитель с телефоном",
  "front-left": "Спереди слева",
  "front-right": "Спереди справа",
  "rear-left": "Сзади слева",
  "rear-right": "Сзади справа",
  "side-left": "Левый бок",
  "side-right": "Правый бок",
  "boulevard": "Современный бульвар",
  "residential": "Тихая жилая улица",
  "business": "Деловой район"
}
export function uiName(value) { return names[value] || value }

const errors = {
 'Paste one result JSON block at a time.':'Вставьте один блок JSON за раз.',
 'Paste the JSON result from ChatGPT, or upload its JSON file.':'Вставьте JSON из ChatGPT или загрузите файл JSON.',
 'Images must be an array with at most four image slots.':'Список изображений должен содержать не более четырёх элементов.',
 'Each image must use a unique photo, vehicle, artwork or logo slot.':'Для каждого изображения укажите отдельный слот: photo, vehicle, artwork или logo.',
 'Use a PNG, JPEG or WebP filename without folders for each image.':'Укажите для каждого изображения имя файла PNG, JPEG или WebP без папок.',
 'Reference URLs must be public HTTPS links or null.':'Ссылка на образец должна быть публичной ссылкой HTTPS или null.',
 'An image prompt is too long or invalid.':'Промпт для изображения слишком длинный или некорректный.',
 'Upload PNG, JPEG or WebP images.':'Загрузите изображения PNG, JPEG или WebP.',
 'Official WB logo is protected':'Официальный логотип WB защищён от изменений.',
 'Block colors must be default, purple or pink':'Допустимые цвета блока: default, purple или pink.',
 'Invalid transform scope':'Некорректная область трансформации.',
 'photoFit must be cover or contain':'Режим photoFit должен быть cover или contain.',
 'Use a brand accent color':'Выберите фирменный акцентный цвет.',
 'Unsupported project version':'Эта версия проекта не поддерживается.'
}
export function uiError(error) {
 const message = error instanceof Error ? error.message : String(error)
 if (errors[message]) return errors[message]
 const patterns = [
  [/^Upload (.+) or choose Keep existing image\.$/, 'Загрузите $1 или выберите «Сохранить текущее изображение».'],
  [/^(.+) must be an object$/, 'Поле $1 должно быть объектом.'],
  [/^Unknown (.+) field: (.+)$/, 'Неизвестное поле $2 в $1.'],
  [/^(.+) must be a number from (.+) to (.+)$/, 'Поле $1 должно быть числом от $2 до $3.'],
  [/^Unknown (.+): (.+)$/, 'Неизвестное значение $1: $2.'],
  [/^(.+) must be a local asset path or PNG\/JPEG\/WebP data URL$/, 'В поле $1 укажите локальный путь или изображение PNG, JPEG или WebP в формате data URL.'],
  [/^Invalid (.+) asset path$/, 'Некорректный путь к изображению в поле $1.'],
  [/^(.+) must be text \(up to 5000 characters\)$/, 'Поле $1 должно содержать текст до 5000 символов.'],
  [/^Invalid (.+)$/, 'Некорректное значение $1.']
 ]
 for (const [pattern, replacement] of patterns) if (pattern.test(message)) return message.replace(pattern, replacement)
 return /[А-Яа-яЁё]/.test(message) ? message : 'Не удалось выполнить действие. Проверьте данные и попробуйте ещё раз.'
}
