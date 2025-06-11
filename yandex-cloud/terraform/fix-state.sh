#!/bin/bash

# Скрипт для исправления состояния Terraform при конфликтах с существующими ресурсами
# Используется для решения проблемы "BucketAlreadyOwnedByYou" и "Function already exists"

set -e

echo "🔧 Исправление состояния Terraform для проекта Siteki"

# Проверяем что мы в правильной директории
if [[ ! -f "main.tf" ]]; then
    echo "❌ Ошибка: main.tf не найден. Запустите скрипт из директории yandex-cloud/terraform/"
    exit 1
fi

# Проверяем наличие YC CLI
if ! command -v yc &> /dev/null; then
    echo "❌ Ошибка: Yandex Cloud CLI не установлен"
    exit 1
fi

# Функция для безопасного удаления ресурса из state
safe_remove_from_state() {
    local resource=$1
    echo "🗑️ Удаление $resource из Terraform state..."
    
    if terraform state list | grep -q "$resource"; then
        terraform state rm "$resource" || echo "⚠️ Не удалось удалить $resource из state"
        echo "✅ $resource удален из state"
    else
        echo "ℹ️ $resource не найден в state"
    fi
}

# Функция для импорта ресурса
import_resource() {
    local resource=$1
    local id=$2
    echo "📥 Импорт $resource с ID: $id"
    
    if terraform import -var-file=terraform.tfvars "$resource" "$id"; then
        echo "✅ $resource успешно импортирован"
    else
        echo "❌ Не удалось импортировать $resource"
        return 1
    fi
}

echo "🔍 Получение ID существующих ресурсов из Yandex Cloud..."

# Получаем ID существующих ресурсов
BUCKET_NAME="academycredit.ru"
CREATE_PAYMENT_ID=$(yc serverless function get create-payment --format=json 2>/dev/null | jq -r '.id' 2>/dev/null || echo "")
SEND_TO_N8N_ID=$(yc serverless function get send-to-n8n --format=json 2>/dev/null | jq -r '.id' 2>/dev/null || echo "")
API_GATEWAY_ID=$(yc serverless api-gateway get siteki-api --format=json 2>/dev/null | jq -r '.id' 2>/dev/null || echo "")

echo "📋 Найденные ресурсы:"
echo "  Bucket: $BUCKET_NAME"
echo "  Create Payment Function: ${CREATE_PAYMENT_ID:-'не найдена'}"
echo "  Send to N8N Function: ${SEND_TO_N8N_ID:-'не найдена'}"
echo "  API Gateway: ${API_GATEWAY_ID:-'не найден'}"

# Удаляем проблемные ресурсы из state
echo ""
echo "🗑️ Очистка конфликтующих ресурсов из Terraform state..."
safe_remove_from_state "yandex_storage_bucket.siteki_bucket"
safe_remove_from_state "yandex_function.create_payment"
safe_remove_from_state "yandex_function.send_to_n8n"
safe_remove_from_state "yandex_api_gateway.siteki_gateway"

# Пересоздаем terraform.tfvars если не существует
if [[ ! -f "terraform.tfvars" ]]; then
    echo ""
    echo "📝 Создание terraform.tfvars..."
    cat > terraform.tfvars << EOF
folder_id = "$(yc config get folder-id)"
domain_name = "academycredit.ru"
EOF
    echo "✅ terraform.tfvars создан"
fi

# Импортируем существующие ресурсы
echo ""
echo "📥 Импорт существующих ресурсов..."

# Импорт bucket
import_resource "yandex_storage_bucket.siteki_bucket" "$BUCKET_NAME"

# Импорт функций если они существуют
if [[ -n "$CREATE_PAYMENT_ID" && "$CREATE_PAYMENT_ID" != "null" && "$CREATE_PAYMENT_ID" != "" ]]; then
    import_resource "yandex_function.create_payment" "$CREATE_PAYMENT_ID"
else
    echo "ℹ️ Функция create-payment не найдена, будет создана"
fi

if [[ -n "$SEND_TO_N8N_ID" && "$SEND_TO_N8N_ID" != "null" && "$SEND_TO_N8N_ID" != "" ]]; then
    import_resource "yandex_function.send_to_n8n" "$SEND_TO_N8N_ID"
else
    echo "ℹ️ Функция send-to-n8n не найдена, будет создана"
fi

if [[ -n "$API_GATEWAY_ID" && "$API_GATEWAY_ID" != "null" && "$API_GATEWAY_ID" != "" ]]; then
    import_resource "yandex_api_gateway.siteki_gateway" "$API_GATEWAY_ID"
else
    echo "ℹ️ API Gateway не найден, будет создан"
fi

echo ""
echo "🔍 Проверка плана Terraform..."
terraform plan -var-file=terraform.tfvars

echo ""
echo "✅ Исправление состояния завершено!"
echo "💡 Теперь можно выполнить: terraform apply -var-file=terraform.tfvars" 