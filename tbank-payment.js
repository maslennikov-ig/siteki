/**
 * tbank-payment.js
 * Интеграция платежной системы Т-банка с backend
 * Версия 2.2.0 (через Netlify Functions)
 * 
 * Backend обрабатывает генерацию Token и подпись
 */

// Конфигурация терминала
const TERMINAL_KEY = '1749023114337'; // Рабочий ключ

// Карта продуктов: id, название, сумма
const products = [
    {
        id: 'guide-1399',
        name: 'Гайд "Узнай причину отказов и исправь КИ"',
        price: 1399
    },
    {
        id: 'consult-5000',
        name: 'Персональная консультация по КИ',
        price: 5000
    },
    {
        id: 'fullsupport-5000',
        name: 'Исправление КИ + ведение до кредита',
        price: 5000
    }
];

// Глобальная переменная для хранения интеграции
let paymentIntegration = null;
let isScriptLoaded = false;

/**
 * Создание платежа через backend
 * ПРИОРИТЕТ: Используем наш Netlify Function для генерации Token
 */
async function createPaymentWithBackend(product) {
    console.log('💻 Создаем платеж через backend:', product);
    
    // Генерируем уникальный ID заказа
    const orderId = 'order-backend-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    const paymentData = {
        Amount: product.price * 100, // Сумма в копейках
        OrderId: orderId,
        Description: `${product.name}`,
        SuccessURL: window.location.origin + '/thankyou.html',
        FailURL: window.location.origin + '/fail.html',
        Email: 'test@example.com',
        Phone: '+79999999999'
    };
    
    console.log('📋 Данные для backend:', paymentData);
    
    try {
        // Отправляем запрос к нашему backend
        const response = await fetch('/.netlify/functions/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📨 Ответ от backend:', result);
        
        if (result.Success && result.PaymentURL) {
            console.log('✅ PaymentURL получен через backend:', result.PaymentURL);
            
            // Открываем платежную форму в новом окне
            const paymentWindow = window.open(
                result.PaymentURL, 
                'tbankPayment',
                'width=600,height=800,scrollbars=yes,resizable=yes,centerscreen=yes'
            );
            
            if (!paymentWindow) {
                // Если блокировщик попапов заблокировал
                alert(`🎯 Платежная форма готова!

Ваш браузер заблокировал всплывающее окно.
Нажмите OK чтобы перейти к оплате.`);
                window.location.href = result.PaymentURL;
            }
            
            return result;
        } else {
            console.error('❌ Backend вернул ошибку:', result);
            throw new Error(result.Message || result.Details || result.error || 'Ошибка создания платежа');
        }
    } catch (error) {
        console.error('❌ Ошибка backend запроса:', error);
        throw error;
    }
}

/**
 * Глобальная функция paymentStartCallback для PaymentIntegration
 * Теперь использует backend
 */
async function paymentStartCallback(paymentType) {
    console.log('💰 PaymentIntegration callback, тип:', paymentType);
    
    const currentProduct = JSON.parse(sessionStorage.getItem('currentProduct'));
    if (!currentProduct) {
        throw new Error('Не найдены данные о продукте для оплаты');
    }
    
    try {
        // Используем backend для создания платежа
        const result = await createPaymentWithBackend(currentProduct);
        return result.PaymentURL;
    } catch (error) {
        console.error('❌ Ошибка в paymentStartCallback:', error);
        throw error;
    }
}

/**
 * Инициализация платежной системы при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализируем платежную систему Т-банка v2.2.0 (с backend)');
    
    // Проверяем, работает ли сайт по HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('ВНИМАНИЕ! Сайт работает по протоколу HTTP, а не HTTPS. Т-банк требует HTTPS для корректной работы платежей.');
    }
    
    // Добавляем скрипт интеграции
    loadTbankScript();
    
    // Инициализируем кнопки оплаты
    initPaymentButtons();
});

/**
 * Загрузка скрипта интеграции Т-банка
 */
function loadTbankScript() {
    console.log('🔄 Начинаем загрузку скрипта интеграции Т-банка...');
    
    // Проверяем, что скрипт еще не загружен
    if (document.querySelector('script[src="https://acq-paymentform-integrationjs.t-static.ru/integration.js"]')) {
        console.log('✅ Скрипт интеграции Т-банка уже добавлен на страницу');
        isScriptLoaded = true;
        
        // Проверяем, доступен ли уже PaymentIntegration
        if (typeof PaymentIntegration !== 'undefined') {
            console.log('✅ PaymentIntegration уже доступен');
            onPaymentIntegrationLoad();
        }
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://acq-paymentform-integrationjs.t-static.ru/integration.js';
    script.async = true;
    
    // Устанавливаем таймаут на загрузку скрипта
    const loadTimeout = setTimeout(() => {
        console.warn('⚠️ Таймаут загрузки скрипта интеграции Т-банка (15 сек)');
        console.log('💻 Будет использован только backend режим');
        isScriptLoaded = false;
    }, 15000);
    
    script.onload = () => {
        clearTimeout(loadTimeout);
        console.log('✅ Скрипт интеграции Т-банка успешно загружен');
        isScriptLoaded = true;
        
        // Даем время браузеру на инициализацию объекта PaymentIntegration
        setTimeout(() => {
            onPaymentIntegrationLoad();
        }, 100);
    };
    
    script.onerror = (event) => {
        clearTimeout(loadTimeout);
        console.error('❌ Ошибка загрузки скрипта интеграции Т-банка:', event);
        console.log('💻 Используем только backend режим');
        isScriptLoaded = false;
    };
    
    try {
    document.body.appendChild(script);
        console.log('📄 Скрипт интеграции Т-банка добавлен на страницу');
    } catch (error) {
        clearTimeout(loadTimeout);
        console.error('❌ Ошибка при добавлении скрипта на страницу:', error);
        isScriptLoaded = false;
    }
}

/**
 * Инициализация интеграции после загрузки скрипта
 */
function onPaymentIntegrationLoad() {
    console.log('🚀 Начинаем инициализацию PaymentIntegration...');
    
    // Проверяем, что PaymentIntegration доступен
    if (typeof PaymentIntegration === 'undefined') {
        console.error('❌ PaymentIntegration не найден после загрузки скрипта');
        console.log('💻 Используем только backend режим');
        return;
    }
    
    console.log('✅ PaymentIntegration найден, версия:', PaymentIntegration.version || 'unknown');
    
    try {
        // Простая конфигурация для backend интеграции
    const initConfig = {
        terminalKey: TERMINAL_KEY,
        product: 'eacq',
        features: {
            payment: {
                config: {
                        status: {
                            changedCallback: async (status) => {
                                console.log('💳 Статус платежа изменен:', status);
                            }
                        },
                        dialog: {
                            closedCallback: async () => {
                                console.log('🚪 Диалог оплаты закрыт');
                    }
                        }
                }
            }
        }
    };
        
        console.log('⚙️ Конфигурация PaymentIntegration (backend mode):', initConfig);
        console.log('🔄 Вызываем PaymentIntegration.init()...');
    
    // Инициализируем интеграцию
        const initPromise = PaymentIntegration.init(initConfig);
        
        initPromise
        .then(async integration => {
                console.log('✅ PaymentIntegration успешно инициализирован с backend!');
                paymentIntegration = integration;
            window.tbankIntegration = integration;
                
                // Устанавливаем глобальный callback согласно документации
                await integration.payments.setPaymentStartCallback(paymentStartCallback);
                console.log('✅ PaymentStartCallback установлен');
                
                console.log('🎉 Интеграция готова (приоритет: backend + виджеты)!');
        })
        .catch(error => {
                console.warn('⚠️ PaymentIntegration не инициализирован:', error);
                console.log('💻 Используем только backend режим');
                paymentIntegration = null;
            });
            
    } catch (error) {
        console.error('❌ ОШИБКА при создании конфигурации:', error);
        console.log('💻 Используем только backend режим');
        paymentIntegration = null;
    }
}

/**
 * Инициализация кнопок оплаты
 */
function initPaymentButtons() {
    // Находим все кнопки с атрибутом data-tinkoff-pay
    const payButtons = document.querySelectorAll('[data-tinkoff-pay]');
    console.log(`Найдено ${payButtons.length} кнопок оплаты`);
    
    // Добавляем обработчик для каждой кнопки
    payButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Получаем ID продукта из атрибута
            const productId = button.getAttribute('data-tinkoff-pay');
            console.log('Клик по кнопке оплаты с ID продукта:', productId);
            
            // Находим продукт по ID
            const product = products.find(p => p.id === productId);
            if (!product) {
                console.error('Продукт не найден:', productId);
                alert('Произошла ошибка при обработке данных продукта.');
                return;
            }
            
            // Сохраняем данные о продукте в sessionStorage
            sessionStorage.setItem('currentProduct', JSON.stringify(product));
            
            // Открываем платежную форму
            openPaymentForm(product);
        });
    });
}

/**
 * Открытие платежной формы
 * ПРИОРИТЕТ: Backend + PaymentIntegration виджеты
 */
async function openPaymentForm(product) {
    console.log('💳 Открываем платежную форму для продукта:', product);
    
    // Сохраняем данные о продукте
    sessionStorage.setItem('currentProduct', JSON.stringify(product));
    
    // ПРИОРИТЕТ 1: PaymentIntegration с backend
    if (paymentIntegration && paymentIntegration.payments) {
        try {
            console.log('🎯 Используем PaymentIntegration + backend...');
        
            // Создаем интеграцию
            const integration = await paymentIntegration.payments.create('main-integration', {
                loadedCallback: () => {
                    console.log('✅ PaymentIntegration виджеты загружены');
            }
            });
            
            // Создаем контейнер для виджетов
            const container = document.createElement('div');
            container.id = 'payment-form-container';
            container.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                width: 90%;
                text-align: center;
            `;
            document.body.appendChild(container);
            
            // Монтируем интеграцию
            await integration.mount(container);
            
            // Добавляем доступные методы оплаты
            await integration.updateWidgetTypes(['tpay', 'mirpay', 'sberpay']); 
    
            // Добавляем информацию о заказе
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `
                <h3 style="margin: 0 0 10px 0; color: #333;">Оплата заказа</h3>
                <p style="margin: 0; color: #666;">${product.name}</p>
                <p style="margin: 10px 0 20px 0; font-size: 24px; font-weight: bold; color: #ff6600;">${product.price} ₽</p>
            `;
            container.insertBefore(titleDiv, container.firstChild);
            
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #999;
            `;
            closeBtn.onclick = () => {
                container.remove();
            };
            container.appendChild(closeBtn);
            
            console.log('✅ PaymentIntegration виджеты созданы (backend подпись)!');
            return;
            
        } catch (integrationError) {
            console.warn('⚠️ Ошибка PaymentIntegration виджетов:', integrationError);
            console.log('🔄 Пробуем прямой backend...');
        }
    } else {
        console.log('⚠️ PaymentIntegration недоступен, используем прямой backend');
    }
    
    // ПРИОРИТЕТ 2: Прямой backend (самый надежный)
    try {
        console.log('💻 Используем прямой backend...');
        await createPaymentWithBackend(product);
        return;
    } catch (error) {
        console.error('❌ Backend не сработал:', error.message);
}

    // ПРИОРИТЕТ 3: Инструкции пользователю
    alert(`❌ Платежная система недоступна

Возможные причины:
1. Проблемы с backend сервером
2. Не настроен тип подключения "Универсальный" в ЛК Т-банка
3. Проблемы с сетевым подключением

🔧 РЕШЕНИЕ:
1. Обновите страницу
2. Проверьте подключение к интернету
3. Обратитесь в поддержку: acq_help@tbank.ru

📋 Терминал: ${TERMINAL_KEY}`);
}

/**
 * Проверка статуса платежа (через backend)
 */
async function checkPaymentStatus(paymentId) {
    console.log('Проверка статуса платежа:', paymentId);
    
    try {
        // Можно добавить отдельную function для проверки статуса
        // Пока используем простую проверку
        console.log('ℹ️ Статус платежа проверяется через T-Bank напрямую');
        return { status: 'checking' };
    } catch (error) {
        console.error('❌ Ошибка при получении статуса платежа:', error);
        throw error;
    }
}

// Экспортируем функции
window.TbankPayment = {
    openPaymentForm,
    checkPaymentStatus,
    paymentStartCallback,
    createPaymentWithBackend,
    createSimplePayment: createPaymentWithBackend  // Алиас для тестов
};
