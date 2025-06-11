# 🌐 Настройка DNS для домена academycredit.ru

## 📋 Обзор

Для подключения домена `academycredit.ru` к Yandex Cloud Object Storage необходимо настроить DNS записи у вашего регистратора домена.

## 🔧 Настройка DNS записей

### Рекомендуемый способ: CNAME записи

Используйте CNAME записи для всех поддоменов:

```
Тип: CNAME
Имя: www
Значение: static.yandexcloud.net
TTL: 3600
```

### Для корневого домена (@)

Если ваш регистратор поддерживает CNAME для корневого домена:
```
Тип: CNAME  
Имя: @
Значение: static.yandexcloud.net
TTL: 3600
```

Если не поддерживает CNAME для корневого домена, используйте переадресацию 301 с www на корневой домен в настройках регистратора.

## 📚 Инструкции для популярных регистраторов

### REG.RU
1. Войдите в личный кабинет REG.RU
2. Перейдите в "Домены и DNS" → "Управление DNS"
3. Выберите домен `academycredit.ru`
4. Добавьте записи согласно таблице выше
5. Сохраните изменения

### Яндекс.Домены
1. Откройте console.yandex.cloud
2. Перейдите в "Cloud DNS"
3. Создайте DNS зону для `academycredit.ru`
4. Добавьте записи:
   - A запись: @ → 213.180.193.243
   - A запись: www → 213.180.193.243

### TimeWeb/Hostland/других
1. Зайдите в панель управления доменом
2. Найдите раздел "DNS настройки" или "Управление DNS"
3. Добавьте A записи как указано выше

## ⚙️ Настройка Object Storage bucket

После настройки DNS нужно настроить bucket:

### 1. Создание bucket
```bash
# Через Yandex Cloud CLI
yc storage bucket create \
  --name academycredit.ru \
  --default-storage-class standard \
  --max-size 1073741824
```

### 2. Настройка статического сайта
```bash
# Включение веб-сайта
yc storage bucket update \
  --name academycredit.ru \
  --website-settings '{
    "index": "index.html",
    "error": "fail.html"
  }'
```

### 3. Настройка публичного доступа
```bash
# Разрешение публичного чтения
yc storage bucket update \
  --name academycredit.ru \
  --anonymous-access-flags '{
    "read": true,
    "list": false
  }'
```

## 🔍 Проверка настройки

### 1. Проверка DNS
```bash
# Windows
nslookup academycredit.ru

# Linux/Mac  
dig academycredit.ru
```

### 2. Проверка доступности сайта
```bash
# Проверка через curl
curl -I https://academycredit.ru

# Или просто откройте в браузере
# https://academycredit.ru
```

## ⏱️ Время распространения

- **DNS записи**: 10-30 минут (иногда до 24 часов)
- **SSL сертификат**: Автоматически через Yandex Cloud CDN
- **Полная доступность**: 30-60 минут после настройки

## 🚨 Важные моменты

### SSL/HTTPS
- Для HTTPS нужно подключить Yandex Cloud CDN
- CDN автоматически выпускает Let's Encrypt сертификат
- Настройка CDN описана в `yandex-cloud/terraform/main.tf`

### Редирект с www
Добавьте редирект с `www.academycredit.ru` на `academycredit.ru`:
```html
<!-- В index.html добавить в <head> -->
<script>
if (window.location.hostname === 'www.academycredit.ru') {
  window.location.replace('https://academycredit.ru' + window.location.pathname);
}
</script>
```

### Мониторинг
- Настройте мониторинг доступности через Yandex Cloud Monitoring
- Добавьте Google Analytics с новым доменом
- Обновите Yandex.Metrica для нового домена

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте корректность DNS записей
2. Убедитесь, что TTL прошел (подождите указанное время)
3. Проверьте настройки bucket в Yandex Cloud
4. Обратитесь в поддержку регистратора домена

## 🎯 Итоговые URL

После настройки будут доступны:
- **Основной сайт**: https://academycredit.ru
- **API Gateway**: https://[gateway-id].apigw.yandexcloud.net
- **Функции**: автоматически через API Gateway

**Время полной миграции**: 1-2 часа после настройки DNS 