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

# S3 bucket для статического хостинга (уже существует)
data "yandex_storage_bucket" "siteki_bucket" {
  bucket = var.domain_name
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

# Cloud Functions (уже существуют)
data "yandex_function" "create_payment" {
  name = "create-payment"
}

data "yandex_function" "send_to_n8n" {
  name = "send-to-n8n"
}

# API Gateway
resource "yandex_api_gateway" "siteki_gateway" {
  name        = "siteki-api"
  description = "API Gateway для проекта Siteki"

  spec = templatefile("${path.module}/api-gateway.yaml", {
    bucket_name         = data.yandex_storage_bucket.siteki_bucket.bucket
    create_payment_id   = data.yandex_function.create_payment.id
    send_to_n8n_id      = data.yandex_function.send_to_n8n.id
    folder_id          = var.folder_id
  })
}

# Outputs
output "bucket_website_endpoint" {
  value = data.yandex_storage_bucket.siteki_bucket.website_endpoint
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