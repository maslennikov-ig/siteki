# Инструкция по деплою backend на Netlify

## 🚀 Что изменилось

В версии 2.2.0 добавлен **backend через Netlify Functions** для решения проблемы с генерацией Token.

## 📁 Новые файлы

1. **netlify/functions/create-payment.js** - Backend функция для платежей
2. **netlify.toml** - Конфигурация Netlify (ИСПРАВЛЕНА)
3. **DEPLOY_GUIDE.md** - Эта инструкция

## 🔧 Что нужно сделать

### 1. Коммит и пуш ИСПРАВЛЕНИЙ
```bash
git add .
git commit -m "fix: исправлен netlify.toml для корректной работы Functions"
git push origin main
```

### 2. Netlify автоматически деплоит Functions
- Netlify обнаружит исправленный файл `netlify.toml` 
- Автоматически создаст Netlify Functions
- Функция будет доступна по адресу: `https://siteki.netlify.app/.netlify/functions/create-payment`

### 3. Проверка работы backend

#### 🔍 НОВЫЙ ИНТЕРФЕЙС NETLIFY 2024 - Где найти Functions:

**В Netlify Dashboard:**
1. Зайдите на https://app.netlify.com
2. Выберите ваш сайт `siteki`
3. В верхнем меню найдите раздел **"Functions"** (может быть в главном меню или в подменю)
4. Или перейдите в **Site overview** → **Functions** в боковом меню
5. Должна появиться функция `create-payment` в списке

**Альтернативные способы проверки:**

**Способ 1: Прямая проверка URL**
```
Откройте: https://siteki.netlify.app/.netlify/functions/create-payment
Ожидаемый ответ: {"error": "Метод GET не поддерживается"}
```

**Способ 2: Проверка через сайт**
1. Откройте `https://siteki.netlify.app/test-payment.html`
2. Нажмите "Тест простого платежа"
3. В консоли браузера (F12) должно быть: "💻 Создаем платеж через backend"
4. Backend должен вернуть PaymentURL от Т-банка

**Способ 3: Проверка логов Functions**
1. В Netlify Dashboard найдите **"Functions"** → **"create-payment"**
2. Или найдите **"Logs"** → **"Function logs"**
3. После тестового платежа должны появиться логи вызова функции

## 🔍 Диагностика проблем

### ❌ ИСПРАВЛЕНО: "No functions deployed"
**Проблема была:** Некорректная конфигурация редиректов в netlify.toml
**Решение:** Убран проблемный redirect, добавлена конфигурация [functions.create-payment]

### Если функция не найдена (404)
```
❌ Backend error: 404 Not Found
```

**Решение:**
1. Проверьте что функция `create-payment` есть в списке Functions
2. Если нет - проверьте что netlify.toml корректный и перезапустите деплой
3. Попробуйте прямой URL: `https://siteki.netlify.app/.netlify/functions/create-payment`

### Если ошибка модуля crypto
```
❌ Cannot find module 'crypto'
```

**Решение:** В Netlify Functions crypto - встроенный модуль Node.js, должен работать автоматически.

### Если CORS ошибки
```
❌ Access to fetch blocked by CORS
```

**Решение:** Заголовки CORS уже настроены в create-payment.js

## 🧪 Тестирование

### Локальное тестирование (опционально)
```bash
# Установить Netlify CLI
npm install -g netlify-cli

# Локальный сервер с функциями
netlify dev

# Функция будет доступна по:
# http://localhost:8888/.netlify/functions/create-payment
```

### Проверка в продакшене
1. **ВАЖНО**: Убедитесь что Functions активированы (см. способы проверки выше)
2. Откройте Developer Tools (F12)
3. Перейдите на test-payment.html
4. Нажмите кнопку тестирования
5. Проверьте Network tab на наличие запроса к `/.netlify/functions/create-payment`
6. Ответ должен содержать `PaymentURL` от Т-банка

## ✅ Ожидаемый результат

После ИСПРАВЛЕННОГО деплоя:
- ✅ Netlify Functions активированы
- ✅ Backend генерирует Token правильно
- ✅ API Т-банка принимает запросы
- ✅ PaymentURL возвращается на frontend
- ✅ Платежная форма открывается корректно

## 🔧 Если что-то не работает

1. **Проверьте Functions в Dashboard:**
   - Site → Functions → Должна быть `create-payment`
   - Или проверьте прямой URL: `/.netlify/functions/create-payment`

2. **Проверьте Network в браузере:**
   - F12 → Network → Попробуйте создать платеж

3. **Проверьте консоль браузера:**
   - F12 → Console → Ищите ошибки с пометкой "❌"

4. **Проверьте логи Functions:**
   - Dashboard → Functions → create-payment → Logs
   - Или Dashboard → Logs → Function logs

## 📞 Поддержка

Если проблемы остались:
1. Убедитесь что исправленный netlify.toml загружен на GitHub
2. Netlify автоматически деплоит изменения из main ветки
3. Подождите 2-3 минуты после пуша для полного деплоя
4. Проверьте что функция доступна по прямому URL
5. Если функция не найдена - попробуйте ручной редеплой сайта в Netlify Dashboard 