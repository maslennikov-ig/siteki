# Провайдер Yandex Cloud
terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  # Токен и cloud_id будут переданы через переменные окружения
  folder_id = var.folder_id
  zone      = "ru-central1-a"
}

# Переменные
variable "folder_id" {
  description = "Folder ID в Yandex Cloud"
  type        = string
}

variable "domain_name" {
  description = "Доменное имя для сайта"
  type        = string
}

# S3 bucket для статического хостинга (используем существующий если есть)
resource "yandex_storage_bucket" "siteki_bucket" {
  bucket     = var.domain_name
  access_key = yandex_iam_service_account_static_access_key.sa_static_key.access_key
  secret_key = yandex_iam_service_account_static_access_key.sa_static_key.secret_key

  website {
    index_document = "index.html"
    error_document = "fail.html"
  }

  anonymous_access_flags {
    read = true
    list = false
  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "POST", "PUT", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      # Игнорируем изменения если bucket уже существует
      bucket,
      access_key,
      secret_key
    ]
  }
}

# Используем существующий сервисный аккаунт github-actions-sa
data "yandex_iam_service_account" "existing_sa" {
  name = "github-actions-sa"
}

# Создаём статический ключ для существующего сервисного аккаунта
resource "yandex_iam_service_account_static_access_key" "sa_static_key" {
  service_account_id = data.yandex_iam_service_account.existing_sa.id
  description        = "Статический ключ для Object Storage"
}

# Роль для работы с Object Storage (если ещё не назначена)
resource "yandex_resourcemanager_folder_iam_member" "sa_storage_editor" {
  folder_id = var.folder_id
  role      = "storage.editor"
  member    = "serviceAccount:${data.yandex_iam_service_account.existing_sa.id}"
}

# Cloud Functions

# Функция создания платежа (создаем только если не существует)
resource "yandex_function" "create_payment" {
  name               = "create-payment"
  description        = "Функция создания платежей T-Bank"
  user_hash          = "create-payment-v2"  # Увеличиваем версию
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = 128
  execution_timeout  = "10"
  service_account_id = data.yandex_iam_service_account.existing_sa.id

  environment = {
    NODE_ENV = "production"
  }

  content {
    zip_filename = "functions/create-payment.zip"
  }

  lifecycle {
    ignore_changes = [
      # Игнорируем некритичные изменения при обновлении
      created_at,
      version
    ]
  }
}

# Функция отправки в n8n (создаем только если не существует)
resource "yandex_function" "send_to_n8n" {
  name               = "send-to-n8n"
  description        = "Функция отправки данных в n8n"
  user_hash          = "send-to-n8n-v2"  # Увеличиваем версию
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = 128
  execution_timeout  = "10"
  service_account_id = data.yandex_iam_service_account.existing_sa.id

  environment = {
    NODE_ENV = "production"
  }

  content {
    zip_filename = "functions/send-to-n8n.zip"
  }

  lifecycle {
    ignore_changes = [
      # Игнорируем некритичные изменения при обновлении
      created_at,
      version
    ]
  }
}

# API Gateway
resource "yandex_api_gateway" "siteki_gateway" {
  name        = "siteki-api"
  description = "API Gateway для проекта Siteki"

  spec = templatefile("${path.module}/api-gateway.yaml", {
    bucket_name         = yandex_storage_bucket.siteki_bucket.bucket
    create_payment_id   = yandex_function.create_payment.id
    send_to_n8n_id      = yandex_function.send_to_n8n.id
    folder_id          = var.folder_id
  })

  depends_on = [
    yandex_function.create_payment,
    yandex_function.send_to_n8n
  ]
}

# Outputs
output "bucket_website_endpoint" {
  value = yandex_storage_bucket.siteki_bucket.website_endpoint
}

output "api_gateway_domain" {
  value = yandex_api_gateway.siteki_gateway.domain
}

output "access_key" {
  value     = yandex_iam_service_account_static_access_key.sa_static_key.access_key
  sensitive = true
}

output "secret_key" {
  value     = yandex_iam_service_account_static_access_key.sa_static_key.secret_key
  sensitive = true
} 