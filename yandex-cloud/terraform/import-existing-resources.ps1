Write-Host "🔄 Импорт существующих ресурсов в Terraform state..." -ForegroundColor Cyan

# Путь к yc CLI (нужно обновить под вашу установку)
$YC_PATH = "C:\Users\$env:USERNAME\yandex-cloud\bin\yc.exe"

# Проверяем наличие yc CLI
if (-not (Test-Path $YC_PATH)) {
    Write-Host "⚠️  yc CLI не найден по пути: $YC_PATH" -ForegroundColor Yellow
    Write-Host "📋 Поиск yc CLI в системе..." -ForegroundColor Yellow
    $YC_PATH = (Get-Command yc -ErrorAction SilentlyContinue).Source
    if (-not $YC_PATH) {
        Write-Host "❌ yc CLI не найден. Установите и настройте Yandex Cloud CLI" -ForegroundColor Red
        Write-Host "📖 Инструкция: https://cloud.yandex.ru/docs/cli/quickstart" -ForegroundColor Blue
        exit 1
    }
}

Write-Host "✅ Используем yc CLI: $YC_PATH" -ForegroundColor Green

# Получаем ID существующих ресурсов
Write-Host "📋 Получение ID ресурсов..." -ForegroundColor Yellow

try {
    # Функции
    $createPaymentResult = & $YC_PATH serverless function get create-payment --format json 2>$null
    $FUNCTION_CREATE_PAYMENT_ID = if ($createPaymentResult) { ($createPaymentResult | ConvertFrom-Json).id } else { $null }
    
    $sendToN8nResult = & $YC_PATH serverless function get send-to-n8n --format json 2>$null
    $FUNCTION_SEND_TO_N8N_ID = if ($sendToN8nResult) { ($sendToN8nResult | ConvertFrom-Json).id } else { $null }
    
    # Storage bucket 
    $BUCKET_NAME = "academycredit.ru"
    
    # API Gateway
    $apiGatewayResult = & $YC_PATH serverless api-gateway get siteki-api --format json 2>$null
    $API_GATEWAY_ID = if ($apiGatewayResult) { ($apiGatewayResult | ConvertFrom-Json).id } else { $null }
    
    Write-Host "🔍 Найденные ресурсы:" -ForegroundColor Cyan
    Write-Host "  - Function create-payment: $(if ($FUNCTION_CREATE_PAYMENT_ID) { $FUNCTION_CREATE_PAYMENT_ID } else { 'НЕ НАЙДЕНА' })" -ForegroundColor White
    Write-Host "  - Function send-to-n8n: $(if ($FUNCTION_SEND_TO_N8N_ID) { $FUNCTION_SEND_TO_N8N_ID } else { 'НЕ НАЙДЕНА' })" -ForegroundColor White
    Write-Host "  - Storage bucket: $BUCKET_NAME" -ForegroundColor White
    Write-Host "  - API Gateway: $(if ($API_GATEWAY_ID) { $API_GATEWAY_ID } else { 'НЕ НАЙДЕН' })" -ForegroundColor White
    
    # Импорт функций
    if ($FUNCTION_CREATE_PAYMENT_ID) {
        Write-Host "📦 Импорт функции create-payment..." -ForegroundColor Yellow
        terraform import yandex_function.create_payment $FUNCTION_CREATE_PAYMENT_ID
    } else {
        Write-Host "⚠️  Функция create-payment не найдена, она будет создана" -ForegroundColor Yellow
    }
    
    if ($FUNCTION_SEND_TO_N8N_ID) {
        Write-Host "📦 Импорт функции send-to-n8n..." -ForegroundColor Yellow
        terraform import yandex_function.send_to_n8n $FUNCTION_SEND_TO_N8N_ID
    } else {
        Write-Host "⚠️  Функция send-to-n8n не найдена, она будет создана" -ForegroundColor Yellow
    }
    
    # Импорт bucket
    Write-Host "📦 Импорт Storage bucket..." -ForegroundColor Yellow
    try {
        terraform import yandex_storage_bucket.siteki_bucket $BUCKET_NAME
    } catch {
        Write-Host "⚠️  Bucket не найден, он будет создан" -ForegroundColor Yellow
    }
    
    # Импорт API Gateway
    if ($API_GATEWAY_ID) {
        Write-Host "📦 Импорт API Gateway..." -ForegroundColor Yellow
        terraform import yandex_api_gateway.siteki_gateway $API_GATEWAY_ID
    } else {
        Write-Host "⚠️  API Gateway не найден, он будет создан" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Импорт завершён!" -ForegroundColor Green
    Write-Host "🚀 Теперь можно запускать terraform plan/apply для обновления ресурсов" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Ошибка при получении информации о ресурсах: $_" -ForegroundColor Red
    Write-Host "🔧 Проверьте настройку yc CLI: yc config list" -ForegroundColor Yellow
} 