#!/bin/bash

# Скрипт сборки статического сайта для Yandex Cloud Object Storage
echo "🚀 Начинаем сборку проекта для Yandex Cloud..."

# Создаем директорию для сборки
mkdir -p dist

# Копируем все статические файлы
echo "📄 Копируем HTML файлы..."
cp *.html dist/

echo "🖼️ Копируем изображения..."
cp *.jpg *.png *.svg dist/

echo "📄 Копируем JS файлы..."
cp *.js dist/

echo "📄 Копируем другие файлы..."
cp openapi.json dist/ 2>/dev/null || true

# Собираем CSS с Tailwind
echo "🎨 Собираем CSS с Tailwind..."
npx tailwindcss -i ./src/styles.css -o ./dist/styles.css --minify

echo "✅ Сборка завершена! Файлы находятся в папке dist/"
echo "📦 Структура сборки:"
ls -la dist/ 