# Terraform для проекта Siteki

## 🚀 Быстрый старт

```bash
cd yandex-cloud/terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## 🔧 Исправление конфликтов ресурсов

Если получаете ошибки типа:
- `BucketAlreadyOwnedByYou`
- `Function with name create-payment already exists`
- `API Gateway already exists`

### Автоматическое исправление

```bash
# Для Linux/macOS
./fix-state.sh

# Для Windows
bash fix-state.sh
```

### Ручное исправление

1. **Удаление из state**:
```bash
terraform state rm yandex_storage_bucket.siteki_bucket
terraform state rm yandex_function.create_payment
terraform state rm yandex_function.send_to_n8n
terraform state rm yandex_api_gateway.siteki_gateway
```

2. **Получение ID ресурсов**:
```bash
# Bucket всегда имеет ID = доменное имя
BUCKET_ID="academycredit.ru"

# Функции
CREATE_PAYMENT_ID=$(yc serverless function get create-payment --format=json | jq -r '.id')
SEND_TO_N8N_ID=$(yc serverless function get send-to-n8n --format=json | jq -r '.id')

# API Gateway
API_GATEWAY_ID=$(yc serverless api-gateway get siteki-api --format=json | jq -r '.id')
```

3. **Импорт ресурсов**:
```bash
terraform import -var-file=terraform.tfvars yandex_storage_bucket.siteki_bucket "$BUCKET_ID"
terraform import -var-file=terraform.tfvars yandex_function.create_payment "$CREATE_PAYMENT_ID"
terraform import -var-file=terraform.tfvars yandex_function.send_to_n8n "$SEND_TO_N8N_ID"
terraform import -var-file=terraform.tfvars yandex_api_gateway.siteki_gateway "$API_GATEWAY_ID"
```

## 📁 Структура файлов

```
terraform/
├── main.tf                    # Основная конфигурация
├── terraform.tfvars.example  # Пример переменных
├── terraform.tfvars          # Локальные переменные (создается автоматически)
├── api-gateway.yaml          # Спецификация API Gateway
├── fix-state.sh              # Скрипт исправления state
├── functions/                # Архивы функций (создаются автоматически)
│   ├── create-payment.zip
│   └── send-to-n8n.zip
└── README.md                 # Эта документация
```

## 🔐 Переменные окружения

### Обязательные для Terraform:
```bash
export YC_SERVICE_ACCOUNT_KEY_FILE="/path/to/sa-key.json"
export YC_CLOUD_ID="your-cloud-id"
export YC_FOLDER_ID="your-folder-id"
```

### В terraform.tfvars:
```hcl
folder_id = "b1g656kle6s1tudv6i3m"
domain_name = "academycredit.ru"
```

## 🚫 Частые проблемы

### 1. "Function already exists"
**Причина**: Функция существует в Yandex Cloud, но не в Terraform state
**Решение**: Запустить `./fix-state.sh` или импортировать вручную

### 2. "BucketAlreadyOwnedByYou"
**Причина**: Bucket уже создан, но не отслеживается Terraform
**Решение**: Import блок в main.tf автоматически решает эту проблему

### 3. "Redundant ignore_changes element"
**Причина**: created_at определяется провайдером автоматически
**Решение**: Уже исправлено в main.tf (убран created_at из ignore_changes)

### 4. "terraform.tfvars file not found"
**Причина**: Файл переменных не создан
**Решение**: 
```bash
cp terraform.tfvars.example terraform.tfvars
# Отредактировать значения
```

## 🔄 GitHub Actions

В CI/CD автоматически:
1. Создается terraform.tfvars из secrets
2. Импортируются существующие ресурсы
3. Выполняется plan и apply

Все конфликты разрешаются автоматически благодаря улучшенной логике импорта.

## 📝 Логирование

Для отладки включите подробные логи:
```bash
export TF_LOG=DEBUG
terraform plan -var-file=terraform.tfvars
```

## 🆘 Поддержка

Если проблемы остаются:
1. Проверьте настройки YC CLI: `yc config list`
2. Убедитесь в правах сервисного аккаунта
3. Запустите `fix-state.sh` повторно
4. Обратитесь к разработчику с полными логами 