# Настройка деплоя через GitHub → Netlify

## 🎯 **Цель**: Правильный workflow локальный проект → GitHub → автоматический деплой Netlify

## 📋 **Шаги настройки:**

### 1. Создайте репозиторий на GitHub
1. Зайдите на https://github.com
2. Нажмите "New repository"
3. Название: `siteki`
4. Описание: `Академия Финансов - лендинг с интеграцией платежной системы Т-банка`
5. Public repository
6. **НЕ добавляйте** README, .gitignore или license (у нас уже есть файлы)
7. Нажмите "Create repository"

### 2. Подключите локальный проект к GitHub
```bash
# В терминале в папке C:\Code\siteki:

# Если еще не выполнено:
git init
git add .
git commit -m "feat: initial commit - Академия Финансов с backend ESM для Netlify Functions"

# Замените YOUR_USERNAME на ваш GitHub username:
git remote add origin https://github.com/YOUR_USERNAME/siteki.git

# Отправляем код на GitHub:
git branch -M main
git push -u origin main
```

### 3. Подключите GitHub к Netlify
1. Зайдите на https://app.netlify.com
2. Нажмите "Add new site" → "Import an existing project"
3. Выберите "Deploy with GitHub" 
4. Авторизуйте GitHub если нужно
5. Выберите репозиторий `siteki`
6. **Build settings:**
   - **Branch to deploy:** `main`
   - **Build command:** (оставить пустым)
   - **Publish directory:** `/` (корень проекта)
7. Нажмите "Deploy site"

### 4. Настройте домен (опционально)
1. В Netlify Dashboard → Site settings → Domain management
2. Добавьте custom domain или используйте автоматически сгенерированный
3. Для продакшена замените `siteki.netlify.app` в коде на ваш домен

## ✅ **После настройки:**

### Проверьте что работает:
1. **GitHub репозиторий:** Код должен быть виден на GitHub
2. **Netlify Dashboard → Functions:** Должна появиться `create-payment`
3. **Прямой URL:** `https://YOUR-SITE.netlify.app/.netlify/functions/create-payment` должен вернуть `{"error": "Метод GET не поддерживается"}`
4. **Test page:** `https://YOUR-SITE.netlify.app/test-payment.html` должна работать без 404 ошибок

### Workflow для изменений:
```bash
# Локальные изменения
git add .
git commit -m "feat: описание изменений"
git push origin main

# Netlify автоматически деплоит изменения через ~2 минуты
```

## 🔧 **Если что-то не работает:**

### Functions не деплоятся:
1. Проверьте что `netlify.toml` есть в корне проекта
2. Проверьте что `netlify/functions/create-payment.js` использует ESM (import/export)
3. В Netlify Dashboard → Site settings → Build & deploy → Functions → убедитесь что Functions directory: `netlify/functions`

### Build ошибки:
1. Netlify Dashboard → Deploys → последний деплой → View logs
2. Проверьте логи на ошибки
3. Возможно нужно добавить `package.json` с `"type": "module"`

### Git проблемы:
```bash
# Если нужно изменить remote:
git remote set-url origin https://github.com/ВАШИ_USERNAME/siteki.git

# Если нужно форсированно пушить:
git push --force origin main
```

## 🎉 **Результат:**
- ✅ Код хранится на GitHub
- ✅ Автоматический деплой при каждом push
- ✅ Backend Functions работают корректно
- ✅ Версионность и бэкапы через Git
- ✅ Возможность совместной работы через GitHub 