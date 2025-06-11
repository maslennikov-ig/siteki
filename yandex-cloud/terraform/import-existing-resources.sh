#!/bin/bash

echo "🔄 Импорт существующих ресурсов в Terraform state..."

# Получаем ID существующих ресурсов
echo "📋 Получение ID ресурсов..."

# Функции
FUNCTION_CREATE_PAYMENT_ID=$(yc serverless function get create-payment --format json | jq -r '.id' 2>/dev/null)
FUNCTION_SEND_TO_N8N_ID=$(yc serverless function get send-to-n8n --format json | jq -r '.id' 2>/dev/null)

# Storage bucket 
BUCKET_NAME="academycredit.ru"

# API Gateway
API_GATEWAY_ID=$(yc serverless api-gateway get siteki-api --format json | jq -r '.id' 2>/dev/null)

echo "🔍 Найденные ресурсы:"
echo "  - Function create-payment: ${FUNCTION_CREATE_PAYMENT_ID:-'НЕ НАЙДЕНА'}"
echo "  - Function send-to-n8n: ${FUNCTION_SEND_TO_N8N_ID:-'НЕ НАЙДЕНА'}"
echo "  - Storage bucket: ${BUCKET_NAME}"
echo "  - API Gateway: ${API_GATEWAY_ID:-'НЕ НАЙДЕН'}"

# Импорт функций
if [[ "$FUNCTION_CREATE_PAYMENT_ID" != "null" && -n "$FUNCTION_CREATE_PAYMENT_ID" ]]; then
    echo "📦 Импорт функции create-payment..."
    terraform import yandex_function.create_payment "$FUNCTION_CREATE_PAYMENT_ID"
else
    echo "⚠️  Функция create-payment не найдена, она будет создана"
fi

if [[ "$FUNCTION_SEND_TO_N8N_ID" != "null" && -n "$FUNCTION_SEND_TO_N8N_ID" ]]; then
    echo "📦 Импорт функции send-to-n8n..."
    terraform import yandex_function.send_to_n8n "$FUNCTION_SEND_TO_N8N_ID"
else
    echo "⚠️  Функция send-to-n8n не найдена, она будет создана"
fi

# Импорт bucket
echo "📦 Импорт Storage bucket..."
terraform import yandex_storage_bucket.siteki_bucket "$BUCKET_NAME" || echo "⚠️  Bucket не найден, он будет создан"

# Импорт API Gateway
if [[ "$API_GATEWAY_ID" != "null" && -n "$API_GATEWAY_ID" ]]; then
    echo "📦 Импорт API Gateway..."
    terraform import yandex_api_gateway.siteki_gateway "$API_GATEWAY_ID"
else
    echo "⚠️  API Gateway не найден, он будет создан"
fi

echo "✅ Импорт завершён!"
echo "🚀 Теперь можно запускать terraform plan/apply для обновления ресурсов" 