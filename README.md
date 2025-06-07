# Академия Финансов - Лендинг по исправлению кредитной истории

## 📋 Описание проекта

Современный адаптивный лендинг для услуг по исправлению кредитной истории с интегрированной платежной системой Т-банка.

## 🎯 Продукты и услуги

1. **Гайд "Узнай причину отказов и исправь КИ"** - 1399₽
2. **Персональная консультация по КИ** - 5000₽  
3. **Исправление КИ + ведение до кредита** - 5000₽

## 🏗️ Архитектура

### Frontend Stack
- **HTML5** - семантическая структура
- **CSS3** - стилизация с Tailwind CSS
- **JavaScript ES6+** - интерактивность
- **Адаптивный дизайн** - мобильная оптимизация

### Backend Architecture  
- **Netlify Functions** - serverless backend
- **Node.js** - runtime среда
- **Crypto API** - SHA-256 подпись для Token

### Платежная система
- **Т-банк Эквайринг** - прием платежей
- **PaymentIntegration.js** - официальная JS интеграция
- **Двухуровневая система** - надежность + fallback

## 🚀 Деплой и настройка

### Netlify Deploy Settings
```
Base directory: [пустое поле]
Build command: [пустое поле]  
Publish directory: .
Functions directory: netlify/functions
```

### Environment Variables (Production)
```
TBANK_TERMINAL_KEY=your_real_terminal_key
TBANK_PASSWORD=your_real_password
```

### Текущая конфигурация (DEMO)
```
Terminal Key: TinkoffBankTest (DEMO)
Password: TinkoffBankTest (DEMO)
API URL: https://securepay.tinkoff.ru/v2/
```

## 🔧 Техническая реализация

### Двухуровневая платежная система

#### Уровень 1: PaymentIntegration + Backend
```javascript
PaymentIntegration.init() → setPaymentStartCallback() → Backend Function → T-Bank API
```

#### Уровень 2: Direct Backend (Fallback)
```javascript
createPaymentWithBackend() → Netlify Function → T-Bank API → Payment URL
```

### Файловая структура
```
siteki/
├── index.html              # Главная страница
├── styles.css              # Основные стили
├── adaptive.css            # Адаптивные стили
├── tbank-payment.js        # Платежная интеграция v2.3.0
├── faq.js                  # FAQ функциональность
├── test-payment.html       # Тестовая страница
├── thankyou.html          # Страница успешной оплаты
├── fail.html              # Страница ошибки оплаты
├── netlify/functions/
│   └── create-payment.js  # Backend функция для платежей
├── netlify.toml           # Netlify конфигурация
├── package.json           # Зависимости проекта
├── changelog.md           # История изменений
└── README.md              # Документация проекта
```

### Безопасность

- **Server-side Token**: генерация SHA-256 подписи на сервере
- **HTTPS Required**: обязательное требование Т-банка
- **CORS Policy**: настроено для кроссдоменных запросов
- **CSP Headers**: поддержка Content Security Policy

### API Endpoints

#### Netlify Function
```
POST /.netlify/functions/create-payment
Content-Type: application/json

{
  "Amount": 139900,
  "OrderId": "order-123",
  "Description": "Product Name",
  "Email": "user@example.com",
  "Phone": "+79999999999"
}
```

#### T-Bank API Integration
```
POST https://securepay.tinkoff.ru/v2/Init
- Automatic Token generation
- Receipt data inclusion  
- DATA.connection_type: 'Widget'
```

## 🧪 Тестирование

### Test Page
- URL: `/test-payment.html`
- Функции: диагностика, логирование, API тесты
- Проверки: доступность API, генерация Token, статус интеграции

### DEMO режим
- Терминал: `TinkoffBankTest`
- Безопасное тестирование без реальных платежей
- Полная функциональность платежной формы

## 📱 Функциональность

### Мобильная оптимизация (v3.0.0)
- **Touch-оптимизация**: Все элементы адаптированы для касаний (44x44px минимум)
- **Адаптивный дизайн**: 8 breakpoints для всех устройств (320px-1920px+)
- **Полноэкранные модальные окна**: Оптимизированы для мобильных устройств
- **PWA поддержка**: Meta-теги для Progressive Web App функций
- **Производительность**: Preconnect ссылки и ленивая загрузка изображений

### Платежная интеграция
- **Кнопки оплаты**: Т-Pay, МИР Pay, SberPay, СБП
- **Модальные окна**: красивый UI для платежной формы  
- **Статус отслеживание**: real-time обновления
- **Мобильная оптимизация**: адаптивные виджеты

### Продвинутая валидация карт (v2.9.0)
- **Smart detection**: Автоматическое определение типа карты (Visa, MasterCard, МИР, AMEX)
- **Алгоритм Луна**: Математическая проверка контрольной суммы номера карты
- **Visual feedback**: Цветовые индикаторы валидности с анимациями
- **Real-time форматирование**: Автоматическое форматирование под тип карты
- **Toast уведомления**: Элегантные уведомления об ошибках и успехе

### UX Features
- **Прогрессивная загрузка**: async скрипты
- **Graceful degradation**: fallback системы
- **Error handling**: подробные сообщения об ошибках
- **Accessibility**: семантические элементы

## 🔄 Workflow

### Development
1. Разработка на localhost
2. Тестирование с DEMO ключами
3. Проверка через test-payment.html

### Staging  
1. Deploy на Netlify
2. Тестирование на production URL
3. Проверка всех payment flows

### Production
1. Замена DEMO ключей на реальные
2. Настройка environment variables
3. Мониторинг платежей

## 📈 Мониторинг

### Логирование
- Подробные console.log во всех операциях
- Диагностические сообщения в UI
- Error tracking с деталями

### Метрики
- Успешность инициализации PaymentIntegration
- Статистика использования fallback режима
- Performance загрузки скриптов

## 🛠️ Maintenance

### Обновления
- Автоматические обновления integration.js
- Версионирование через changelog.md
- Обратная совместимость с fallback

### Мониторинг проблем
- API availability checks
- Token generation validation  
- Cross-browser compatibility

## 📞 Поддержка

- **Email**: acq_help@tbank.ru (техподдержка Т-банка)
- **Документация**: https://www.tbank.ru/kassa/dev/integrationjs/
- **API Reference**: https://www.tbank.ru/kassa/dev/payments/

---

**Версия платежной интеграции**: v2.9.0  
**Последнее обновление**: 26.12.2024  
**Статус**: Production Ready (DEMO mode)  
**Новое в v2.9**: Smart валидация карт, алгоритм Луна, visual feedback
