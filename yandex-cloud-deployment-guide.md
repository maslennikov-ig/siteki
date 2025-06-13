# 🚀 Руководство по деплою проектов на Yandex Cloud через GitHub Actions

## 📋 Оглавление
1. [Подготовка Yandex Cloud](#подготовка-yandex-cloud)
2. [Настройка GitHub репозитория](#настройка-github-репозитория)
3. [Структура проекта](#структура-проекта)
4. [Terraform конфигурация](#terraform-конфигурация)
5. [GitHub Actions workflow](#github-actions-workflow)
6. [Решение типичных проблем](#решение-типичных-проблем)
7. [Проверочный чек-лист](#проверочный-чек-лист)

---

## 1. Подготовка Yandex Cloud

### 1.1 Установка YC CLI
```bash
# Windows PowerShell
iex (New-Object System.Net.WebClient).DownloadString('https://storage.yandexcloud.net/yandexcloud-yc/install.ps1')

# Linux/macOS
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### 1.2 Инициализация YC CLI
```bash
yc init
# Выбрать облако и папку
# Записать cloud-id и folder-id
```

### 1.3 Создание сервисного аккаунта
```bash
# Создание сервисного аккаунта
yc iam service-account create --name github-actions-sa --description "GitHub Actions service account"

# Получение ID сервисного аккаунта
SA_ID=$(yc iam service-account get github-actions-sa --format=json | jq -r '.id')

# Назначение ролей
yc resource-manager folder add-access-binding <FOLDER_ID> \
  --role admin \
  --subject serviceAccount:$SA_ID

# Создание ключа
yc iam key create --service-account-name github-actions-sa --output key.json
```

### 1.4 Получение важных ID
```bash
# Cloud ID
yc config get cloud-id

# Folder ID  
yc config get folder-id

# Service Account ID
yc iam service-account get github-actions-sa --format=json | jq -r '.id'
```

---

## 2. Настройка GitHub репозитория

### 2.1 GitHub Secrets
Добавить в Settings → Secrets and variables → Actions:

```
YC_CLOUD_ID=<cloud-id>
YC_FOLDER_ID=<folder-id>  
YC_SERVICE_ACCOUNT_ID=<service-account-id>
YC_SERVICE_ACCOUNT_KEY=<содержимое key.json>
YC_TOKEN=<IAM токен или OAuth токен>
```

### 2.2 Переменные окружения (опционально)
```
DOMAIN_NAME=example.com
PROJECT_NAME=my-project
```

---

## 3. Структура проекта

### 3.1 Рекомендуемая структура
```
project/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── yandex-cloud/
│   ├── functions/
│   │   ├── function1/
│   │   └── function2/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── api-gateway.yaml
│   │   ├── terraform.tfvars.example
│   │   └── fix-state.sh
│   └── static-site/
├── src/
├── index.html
├── README.md
└── changelog.md
```

### 3.2 Обязательные файлы
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `yandex-cloud/terraform/main.tf` - Terraform конфигурация
- `yandex-cloud/terraform/api-gateway.yaml` - спецификация API Gateway
- `package.json` - если используется Node.js

---

## 4. Terraform конфигурация

### 4.1 Базовый main.tf
```hcl
terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  folder_id = var.folder_id
  zone      = "ru-central1-a"
}

variable "folder_id" {
  description = "Folder ID в Yandex Cloud"
  type        = string
}

variable "domain_name" {
  description = "Доменное имя для сайта"
  type        = string
  default     = "example.com"
}

# Существующий сервисный аккаунт
data "yandex_iam_service_account" "existing_sa" {
  name = "github-actions-sa"
}

# S3 bucket для статического хостинга
resource "yandex_storage_bucket" "site_bucket" {
  bucket     = var.domain_name
  access_key = yandex_iam_service_account_static_access_key.sa_static_key.access_key
  secret_key = yandex_iam_service_account_static_access_key.sa_static_key.secret_key

  website {
    index_document = "index.html"
    error_document = "404.html"
  }

  anonymous_access_flags {
    read = true
    list = false
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Импорт существующего bucket (если есть)
import {
  to = yandex_storage_bucket.site_bucket
  id = "example.com"
}

# Статический ключ для Object Storage
resource "yandex_iam_service_account_static_access_key" "sa_static_key" {
  service_account_id = data.yandex_iam_service_account.existing_sa.id
  description        = "Статический ключ для Object Storage"
}

# Роль для работы с Object Storage
resource "yandex_resourcemanager_folder_iam_member" "sa_storage_editor" {
  folder_id = var.folder_id
  role      = "storage.editor"
  member    = "serviceAccount:${data.yandex_iam_service_account.existing_sa.id}"
}

# Cloud Function (пример)
resource "yandex_function" "example_function" {
  name               = "example-function"
  description        = "Пример функции"
  user_hash          = "example-v1"
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = 128
  execution_timeout  = "10"
  service_account_id = data.yandex_iam_service_account.existing_sa.id

  environment = {
    NODE_ENV = "production"
  }

  content {
    zip_filename = "functions/example-function.zip"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# API Gateway
resource "yandex_api_gateway" "site_gateway" {
  name        = "site-api"
  description = "API Gateway для проекта"

  spec = templatefile("${path.module}/api-gateway.yaml", {
    bucket_name     = yandex_storage_bucket.site_bucket.bucket
    function_id     = yandex_function.example_function.id
    folder_id       = var.folder_id
  })

  depends_on = [
    yandex_function.example_function
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "bucket_website_endpoint" {
  value = yandex_storage_bucket.site_bucket.website_endpoint
}

output "api_gateway_domain" {
  value = yandex_api_gateway.site_gateway.domain
}
```

### 4.2 API Gateway спецификация
```yaml
openapi: 3.0.0
info:
  title: Site API
  version: 1.0.0
paths:
  /:
    get:
      x-yc-apigateway-integration:
        type: object_storage
        bucket: ${bucket_name}
        object: index.html
        presigned_redirect: false
        error_object: 404.html
  /{proxy+}:
    get:
      parameters:
        - name: proxy
          in: path
          required: true
          schema:
            type: string
      x-yc-apigateway-integration:
        type: object_storage
        bucket: ${bucket_name}
        object: '{proxy}'
        presigned_redirect: false
        error_object: 404.html
  /api/function:
    post:
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: ${function_id}
        service_account_id: ${service_account_id}
```

---

## 5. GitHub Actions workflow

### 5.1 Полный deploy.yml
```yaml
name: 🚀 Deploy to Yandex Cloud

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

env:
  PROJECT_NAME: siteki
  DOMAIN_NAME: example.com

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4

    - name: 🔐 Setup Yandex Cloud CLI
      uses: yc-actions/yc-iam-token@v1
      with:
        yc-sa-json-credentials: ${{ secrets.YC_SERVICE_ACCOUNT_KEY }}

    - name: 📦 Install dependencies
      if: hashFiles('package.json') != ''
      run: |
        npm ci
        npm run build

    - name: 🔧 Prepare Cloud Functions
      run: |
        mkdir -p yandex-cloud/functions
        
        # Архивируем функции
        for func_dir in yandex-cloud/functions/*/; do
          if [ -d "$func_dir" ]; then
            func_name=$(basename "$func_dir")
            echo "📦 Архивация функции: $func_name"
            cd "$func_dir"
            zip -r "../${func_name}.zip" . -x "*.git*" "node_modules/*"
            cd ../../..
          fi
        done

    - name: 📤 Upload static files to Object Storage
      run: |
        # Загружаем статические файлы
        yc storage bucket create --name ${{ env.DOMAIN_NAME }} || true
        
        # Загружаем файлы
        find . -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.png" -o -name "*.jpg" -o -name "*.svg" | \
        while read file; do
          yc storage cp "$file" "s3://${{ env.DOMAIN_NAME }}/${file#./}"
        done

    - name: 🏗️ Setup Terraform
      uses: hashicorp/setup-terraform@v3
      with:
        terraform_version: 1.6.0

    - name: 🔧 Terraform Init & Plan
      working-directory: yandex-cloud/terraform
      run: |
        # Создаём terraform.tfvars
        cat > terraform.tfvars << EOF
        folder_id = "${{ secrets.YC_FOLDER_ID }}"
        domain_name = "${{ env.DOMAIN_NAME }}"
        EOF
        
        terraform init
        
        # Функция для безопасного импорта
        safe_import() {
          local resource=$1
          local id=$2
          echo "🔍 Проверка $resource..."
          
          if terraform state show "$resource" >/dev/null 2>&1; then
            echo "✅ $resource уже в state"
            return 0
          fi
          
          if terraform import -var-file=terraform.tfvars "$resource" "$id" 2>/dev/null; then
            echo "✅ $resource успешно импортирован"
          else
            echo "⚠️ Не удалось импортировать $resource"
          fi
        }
        
        # Импорт существующих ресурсов
        safe_import "yandex_storage_bucket.site_bucket" "${{ env.DOMAIN_NAME }}"
        
        # Получаем ID функций и импортируем
        FUNC_ID=$(yc serverless function get example-function --format=json 2>/dev/null | jq -r '.id' 2>/dev/null || echo "")
        if [[ -n "$FUNC_ID" && "$FUNC_ID" != "null" ]]; then
          safe_import "yandex_function.example_function" "$FUNC_ID"
        fi
        
        # API Gateway удаляем если существует (не поддерживает импорт)
        API_ID=$(yc serverless api-gateway get site-api --format=json 2>/dev/null | jq -r '.id' 2>/dev/null || echo "")
        if [[ -n "$API_ID" && "$API_ID" != "null" ]]; then
          echo "🗑️ Удаление существующего API Gateway..."
          yc serverless api-gateway delete "$API_ID" --async || true
          sleep 5
        fi

    - name: 🚀 Terraform Apply
      working-directory: yandex-cloud/terraform
      run: |
        terraform plan -var-file=terraform.tfvars
        terraform apply -var-file=terraform.tfvars -auto-approve

    - name: 📋 Get outputs
      working-directory: yandex-cloud/terraform
      run: |
        echo "🌐 Website URL: https://$(terraform output -raw api_gateway_domain)"
        echo "📦 Bucket endpoint: $(terraform output -raw bucket_website_endpoint)"

    - name: 🎉 Deployment complete
      run: |
        echo "✅ Деплой завершён успешно!"
        echo "🔗 Сайт доступен по адресу: https://${{ env.DOMAIN_NAME }}"
```

---

## 6. Решение типичных проблем

### 6.1 BucketAlreadyOwnedByYou
```bash
# Решение: добавить import блок в main.tf
import {
  to = yandex_storage_bucket.site_bucket
  id = "domain.com"
}
```

### 6.2 Function already exists
```bash
# Получить ID функции
FUNC_ID=$(yc serverless function get function-name --format=json | jq -r '.id')

# Добавить import блок
import {
  to = yandex_function.function_name
  id = "$FUNC_ID"
}
```

### 6.3 API Gateway already exists
```bash
# API Gateway НЕ поддерживает импорт! Нужно удалить существующий:
yc serverless api-gateway delete api-gateway-name --async

# И добавить lifecycle правило:
lifecycle {
  create_before_destroy = true
}
```

### 6.4 Redundant ignore_changes warning
```hcl
# НЕПРАВИЛЬНО:
lifecycle {
  ignore_changes = [version, created_at]
}

# ПРАВИЛЬНО:
lifecycle {
  prevent_destroy = true
  # Убираем version и created_at - они контролируются провайдером
}
```

### 6.5 Скрипт для автоматического исправления
```bash
#!/bin/bash
# fix-state.sh

# Получаем ID всех ресурсов
BUCKET_NAME="example.com"
FUNC_IDS=$(yc serverless function list --format=json | jq -r '.[].id')
API_ID=$(yc serverless api-gateway list --format=json | jq -r '.[0].id // empty')

# Удаляем из state
terraform state rm yandex_storage_bucket.site_bucket || true
for id in $FUNC_IDS; do
  terraform state rm yandex_function.function_name || true
done

# Удаляем API Gateway (не поддерживает импорт)
if [[ -n "$API_ID" ]]; then
  yc serverless api-gateway delete "$API_ID" --async
fi

# Импортируем заново
terraform import yandex_storage_bucket.site_bucket "$BUCKET_NAME"
# Функции импортируются автоматически через import блоки

echo "✅ State исправлен!"
```

---

## 7. Проверочный чек-лист

### 7.1 Перед деплоем
- [ ] YC CLI настроен и аутентифицирован
- [ ] Сервисный аккаунт создан с ролью `admin`
- [ ] GitHub Secrets настроены корректно
- [ ] Структура проекта соответствует рекомендуемой
- [ ] `terraform.tfvars.example` создан с образцами переменных
- [ ] API Gateway спецификация корректна

### 7.2 В процессе деплоя
- [ ] GitHub Actions запущен без ошибок
- [ ] Terraform импорт прошёл успешно
- [ ] Cloud Functions заархивированы корректно  
- [ ] Статические файлы загружены в Object Storage
- [ ] API Gateway создан/обновлён

### 7.3 После деплоя
- [ ] Сайт открывается по основному домену
- [ ] API функции отвечают корректно
- [ ] Статические ресурсы (CSS, JS, изображения) загружаются
- [ ] HTTPS работает корректно
- [ ] Мобильная версия отображается правильно

### 7.4 Мониторинг
- [ ] Логи Cloud Functions проверены
- [ ] Метрики Object Storage в норме
- [ ] API Gateway статистика корректна
- [ ] Затраты на инфраструктуру в пределах бюджета

---

## 8. Полезные команды

### 8.1 YC CLI команды
```bash
# Список всех ресурсов
yc serverless function list
yc serverless api-gateway list  
yc storage bucket list

# Получение ID ресурса
yc serverless function get function-name --format=json | jq -r '.id'

# Удаление ресурса
yc serverless function delete function-id
yc serverless api-gateway delete api-id

# Логи функции
yc serverless function logs function-name

# Загрузка файлов в Object Storage
yc storage cp file.html s3://bucket-name/
```

### 8.2 Terraform команды
```bash
# Инициализация
terraform init

# Планирование
terraform plan -var-file=terraform.tfvars

# Применение  
terraform apply -var-file=terraform.tfvars -auto-approve

# Просмотр state
terraform state list
terraform state show resource.name

# Импорт ресурса
terraform import resource.name resource-id

# Удаление из state
terraform state rm resource.name
```

### 8.3 Отладка
```bash
# Проверка переменных Terraform
terraform console -var-file=terraform.tfvars

# Валидация конфигурации
terraform validate

# Форматирование
terraform fmt

# Просмотр выходных данных
terraform output
```

---

## 🎯 Заключение

Это руководство покрывает 99% сценариев деплоя проектов на Yandex Cloud через GitHub Actions. Основные принципы:

1. **Всегда используй существующий сервисный аккаунт** с ролью admin
2. **Импортируй существующие ресурсы** через import блоки  
3. **API Gateway не поддерживает импорт** - удаляй и создавай заново
4. **Используй lifecycle правила** для защиты критических ресурсов
5. **Проверяй state перед импортом** во избежание дублирования

При возникновении проблем - всегда проверяй логи GitHub Actions и используй `fix-state.sh` скрипт для исправления состояния Terraform.

**Удачных деплоев!** 🚀 