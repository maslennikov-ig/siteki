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

# S3 bucket для статического хостинга
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
}

# Сервисный аккаунт для Object Storage
resource "yandex_iam_service_account" "sa_siteki" {
  name        = "siteki-sa"
  description = "Сервисный аккаунт для проекта Siteki"
}

# Роль для работы с Object Storage
resource "yandex_resourcemanager_folder_iam_member" "sa_editor" {
  folder_id = var.folder_id
  role      = "storage.editor"
  member    = "serviceAccount:${yandex_iam_service_account.sa_siteki.id}"
}

# Статический ключ доступа
resource "yandex_iam_service_account_static_access_key" "sa_static_key" {
  service_account_id = yandex_iam_service_account.sa_siteki.id
  description        = "Статический ключ для Object Storage"
}

# Cloud Functions
# Функция создания платежей
resource "yandex_function" "create_payment" {
  name               = "create-payment"
  description        = "Функция создания платежей T-Bank"
  user_hash          = "create-payment-v1"
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = "128"
  execution_timeout  = "10"
  service_account_id = yandex_iam_service_account.sa_siteki.id

  content {
    zip_filename = "functions/create-payment.zip"
  }

  environment = {
    NODE_ENV = "production"
  }
}

# Функция отправки в n8n
resource "yandex_function" "send_to_n8n" {
  name               = "send-to-n8n"
  description        = "Функция отправки данных в n8n"
  user_hash          = "send-to-n8n-v1"
  runtime            = "nodejs18"
  entrypoint         = "index.handler"
  memory             = "128"
  execution_timeout  = "10"
  service_account_id = yandex_iam_service_account.sa_siteki.id

  content {
    zip_filename = "functions/send-to-n8n.zip"
  }

  environment = {
    NODE_ENV = "production"
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