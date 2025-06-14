# Деплой на Render.com

## 🚀 Быстрый старт

Проект полностью готов к деплою на Render.com. Следуйте этим шагам:

### 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены и запушены в GitHub:

```bash
git add .
git commit -m "Миграция на Render.com v10.0.0"
git push origin main
```

### 2. Создание Web Service на Render

1. Зайдите на [render.com](https://render.com) и войдите в аккаунт
2. Нажмите **"New"** → **"Web Service"**
3. Подключите ваш GitHub репозиторий
4. Настройте параметры:

#### Основные настройки:
- **Name**: `academycredit` (или любое другое имя)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (для начала)

#### Environment Variables:
- `NODE_ENV`: `production`

### 3. Настройка пользовательского домена

После создания сервиса настройте домен `academycredit.ru`:

1. В Render Dashboard перейдите в **Settings** → **Custom Domains**
2. Добавьте домен `academycredit.ru`
3. Настройте DNS записи у вашего провайдера:
   - **CNAME**: `academycredit.ru` → `academycredit.onrender.com`
   - **A Record**: Используйте IP адреса, предоставленные Render

### 4. Автоматический деплой

После создания сервиса Render автоматически:
- Склонирует репозиторий
- Установит зависимости (`npm install`)
- Соберет CSS (`npm run build`)
- Запустит сервер (`npm start`)

## 🔧 Технические детали

### Структура проекта для Render

```
academycredit/
├── server.js               # Express сервер (точка входа)
├── api/                    # Serverless функции
│   ├── create-payment.js   # API создания платежей
│   └── send-to-n8n.js      # API интеграции с n8n
├── package.json            # Зависимости и скрипты
├── render.yaml             # Конфигурация Render (опционально)
└── dist/styles.css         # Собранный CSS
```

### API Endpoints

После деплоя будут доступны:
- `POST /api/create-payment` - создание платежей T-Bank
- `POST /api/send-to-n8n` - отправка данных в n8n

### Переменные окружения

Render автоматически предоставляет:
- `PORT` - порт для сервера (используется в server.js)
- `NODE_ENV` - окружение (production)

## 🌐 Настройки домена

### URL уже настроены правильно

В коде уже прописан правильный домен `academycredit.ru`:

**T-Bank настройки** в `api/create-payment.js`:
```javascript
SuccessURL: body.SuccessURL || 'https://academycredit.ru/thankyou.html',
FailURL: body.FailURL || 'https://academycredit.ru/fail.html',
```

**Email компании**:
```javascript
EmailCompany: 'info@academycredit.ru',
```

### Мониторинг

Render предоставляет:
- Логи в реальном времени
- Метрики производительности
- Автоматические перезапуски при сбоях
- Health checks
- SSL сертификаты (автоматически для пользовательских доменов)

## 🔄 Обновления

Для обновления сайта:
1. Внесите изменения в код
2. Закоммитьте и запушьте в GitHub
3. Render автоматически пересоберет и задеплоит

## 🆘 Troubleshooting

### Проблемы с деплоем

1. **Build fails**: Проверьте логи сборки в Render Dashboard
2. **Start fails**: Убедитесь, что `npm start` работает локально
3. **API не работает**: Проверьте, что функции в `/api/` корректно экспортируются
4. **Домен не работает**: Проверьте DNS настройки и SSL сертификат

### Локальное тестирование

```bash
# Установка зависимостей
npm install

# Сборка CSS
npm run build

# Запуск сервера
npm start

# Проверка
curl http://localhost:3000
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все зависимости установлены
3. Проверьте корректность API endpoints
4. Убедитесь, что DNS настройки корректны

---

**Версия**: 10.0.0 - Полная миграция на Render.com  
**Домен**: academycredit.ru  
**Дата**: Январь 2025 