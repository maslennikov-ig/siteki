#!/bin/bash

# 🔐 Скрипт автоматической настройки GitHub Secrets для Yandex Cloud
# Использование: ./setup-secrets.sh GITHUB_REPO_OWNER GITHUB_REPO_NAME

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Настройка GitHub Secrets для Yandex Cloud${NC}"
echo

# Проверяем аргументы
if [ $# -ne 2 ]; then
    echo -e "${RED}❌ Ошибка: Необходимо указать владельца и имя репозитория${NC}"
    echo "Использование: $0 OWNER REPO"
    echo "Пример: $0 username siteki"
    exit 1
fi

GITHUB_OWNER=$1
GITHUB_REPO=$2

echo -e "${YELLOW}📋 Репозиторий: $GITHUB_OWNER/$GITHUB_REPO${NC}"
echo

# Проверяем наличие GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI не установлен${NC}"
    echo "Установите: https://cli.github.com/"
    exit 1
fi

# Проверяем наличие Yandex Cloud CLI
if ! command -v yc &> /dev/null; then
    echo -e "${RED}❌ Yandex Cloud CLI не установлен${NC}"
    echo "Установите: https://cloud.yandex.ru/docs/cli/quickstart"
    exit 1
fi

# Проверяем авторизацию в GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔑 Авторизация в GitHub...${NC}"
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI авторизован${NC}"

# Получаем данные из Yandex Cloud
echo -e "${BLUE}📋 Получение данных из Yandex Cloud...${NC}"

YC_CLOUD_ID=$(yc config get cloud-id)
YC_FOLDER_ID=$(yc config get folder-id)

if [ -z "$YC_CLOUD_ID" ] || [ -z "$YC_FOLDER_ID" ]; then
    echo -e "${RED}❌ Yandex Cloud CLI не настроен${NC}"
    echo "Выполните: yc init"
    exit 1
fi

echo -e "${GREEN}✅ Cloud ID: $YC_CLOUD_ID${NC}"
echo -e "${GREEN}✅ Folder ID: $YC_FOLDER_ID${NC}"

# Создаем сервисный аккаунт для GitHub Actions
echo -e "${BLUE}👤 Создание сервисного аккаунта...${NC}"

SA_NAME="github-actions-sa"

# Проверяем существует ли уже сервисный аккаунт
if yc iam service-account get $SA_NAME &> /dev/null; then
    echo -e "${YELLOW}⚠️ Сервисный аккаунт $SA_NAME уже существует${NC}"
else
    yc iam service-account create --name $SA_NAME --description "Service Account for GitHub Actions"
    echo -e "${GREEN}✅ Сервисный аккаунт создан${NC}"
fi

# Получаем ID сервисного аккаунта
SA_ID=$(yc iam service-account get $SA_NAME --format json | jq -r .id)

# Назначаем роли
echo -e "${BLUE}🔐 Назначение ролей...${NC}"
yc resource-manager folder add-access-binding $YC_FOLDER_ID \
    --role admin \
    --subject serviceAccount:$SA_ID

echo -e "${GREEN}✅ Роли назначены${NC}"

# Создаем ключ для сервисного аккаунта
echo -e "${BLUE}🔑 Создание ключа сервисного аккаунта...${NC}"
SA_KEY_FILE="sa-key.json"
yc iam key create --service-account-name $SA_NAME --output $SA_KEY_FILE

echo -e "${GREEN}✅ Ключ создан: $SA_KEY_FILE${NC}"

# Создаем статический ключ доступа для Object Storage
echo -e "${BLUE}🗝️ Создание статического ключа доступа...${NC}"
ACCESS_KEY_OUTPUT=$(yc iam access-key create --service-account-name $SA_NAME --format json)
YC_STORAGE_ACCESS_KEY=$(echo $ACCESS_KEY_OUTPUT | jq -r .access_key.key_id)
YC_STORAGE_SECRET_KEY=$(echo $ACCESS_KEY_OUTPUT | jq -r .secret)

echo -e "${GREEN}✅ Статический ключ создан${NC}"

# Запрашиваем имя bucket
echo
echo -e "${YELLOW}📝 Введите имя для bucket (например, yourdomain.ru):${NC}"
read -p "Bucket name: " YC_BUCKET_NAME

if [ -z "$YC_BUCKET_NAME" ]; then
    echo -e "${RED}❌ Имя bucket не может быть пустым${NC}"
    exit 1
fi

# Настройка GitHub Secrets
echo
echo -e "${BLUE}🔐 Настройка GitHub Secrets...${NC}"

# Читаем содержимое ключа сервисного аккаунта
SA_KEY_CONTENT=$(cat $SA_KEY_FILE)

# Устанавливаем secrets
echo -e "${YELLOW}⏳ Устанавливаем YC_SERVICE_ACCOUNT_KEY...${NC}"
echo "$SA_KEY_CONTENT" | gh secret set YC_SERVICE_ACCOUNT_KEY --repo $GITHUB_OWNER/$GITHUB_REPO

echo -e "${YELLOW}⏳ Устанавливаем YC_CLOUD_ID...${NC}"
echo "$YC_CLOUD_ID" | gh secret set YC_CLOUD_ID --repo $GITHUB_OWNER/$GITHUB_REPO

echo -e "${YELLOW}⏳ Устанавливаем YC_FOLDER_ID...${NC}"
echo "$YC_FOLDER_ID" | gh secret set YC_FOLDER_ID --repo $GITHUB_OWNER/$GITHUB_REPO

echo -e "${YELLOW}⏳ Устанавливаем YC_STORAGE_ACCESS_KEY...${NC}"
echo "$YC_STORAGE_ACCESS_KEY" | gh secret set YC_STORAGE_ACCESS_KEY --repo $GITHUB_OWNER/$GITHUB_REPO

echo -e "${YELLOW}⏳ Устанавливаем YC_STORAGE_SECRET_KEY...${NC}"
echo "$YC_STORAGE_SECRET_KEY" | gh secret set YC_STORAGE_SECRET_KEY --repo $GITHUB_OWNER/$GITHUB_REPO

echo -e "${YELLOW}⏳ Устанавливаем YC_BUCKET_NAME...${NC}"
echo "$YC_BUCKET_NAME" | gh secret set YC_BUCKET_NAME --repo $GITHUB_OWNER/$GITHUB_REPO

echo -e "${GREEN}✅ Все GitHub Secrets настроены!${NC}"

# Создаем bucket
echo
echo -e "${BLUE}🪣 Создание Object Storage bucket...${NC}"

# Настраиваем AWS CLI для работы с Yandex Object Storage
aws configure set aws_access_key_id $YC_STORAGE_ACCESS_KEY --profile yandex
aws configure set aws_secret_access_key $YC_STORAGE_SECRET_KEY --profile yandex
aws configure set region ru-central1 --profile yandex

# Создаем bucket
if aws s3 mb s3://$YC_BUCKET_NAME --profile yandex --endpoint-url=https://storage.yandexcloud.net; then
    echo -e "${GREEN}✅ Bucket $YC_BUCKET_NAME создан${NC}"
    
    # Настраиваем публичный доступ для чтения
    echo -e "${BLUE}🌐 Настройка публичного доступа...${NC}"
    aws s3api put-bucket-acl --bucket $YC_BUCKET_NAME --acl public-read --profile yandex --endpoint-url=https://storage.yandexcloud.net
    echo -e "${GREEN}✅ Публичный доступ настроен${NC}"
else
    echo -e "${YELLOW}⚠️ Bucket возможно уже существует или произошла ошибка${NC}"
fi

# Очистка
echo
echo -e "${BLUE}🧹 Очистка временных файлов...${NC}"
rm -f $SA_KEY_FILE
echo -e "${GREEN}✅ Временные файлы удалены${NC}"

# Итоговое сообщение
echo
echo -e "${GREEN}🎉 НАСТРОЙКА ЗАВЕРШЕНА!${NC}"
echo
echo -e "${BLUE}📋 Сводка:${NC}"
echo -e "  • Сервисный аккаунт: ${GREEN}$SA_NAME${NC}"
echo -e "  • Cloud ID: ${GREEN}$YC_CLOUD_ID${NC}"
echo -e "  • Folder ID: ${GREEN}$YC_FOLDER_ID${NC}"
echo -e "  • Bucket: ${GREEN}$YC_BUCKET_NAME${NC}"
echo -e "  • GitHub Repo: ${GREEN}$GITHUB_OWNER/$GITHUB_REPO${NC}"
echo
echo -e "${YELLOW}🚀 Следующие шаги:${NC}"
echo -e "  1. Запушьте код в main ветку"
echo -e "  2. Перейдите в GitHub Actions и наблюдайте за деплоем"
echo -e "  3. Ваш сайт будет доступен по адресу: https://$YC_BUCKET_NAME"
echo
echo -e "${BLUE}📚 Документация: github-actions-setup.md${NC}" 