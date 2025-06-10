/**
 * Доверительное модальное окно оплаты
 * Версия: 5.0.0 - Переход на платежную форму T-Bank (лучшие практики)
 * Дата: Январь 2025
 * 
 * Обновления v5.0.0:
 * - Убран iframe подход, теперь используется перенаправление на платежную форму T-Bank
 * - Все способы оплаты (карты, T-Pay, СБП, SberPay, MirPay) доступны автоматически
 * - Сохранен webhook для n8n через Netlify прокси
 * - Данные клиента автоматически передаются в платежную форму
 * - Лучшие практики UX: уведомление + плавное перенаправление
 * 
 * Предыдущие v4.2.1:
 * - Исправлена CORS проблема через Netlify функцию-прокси
 * - Новый URL: /.netlify/functions/send-to-n8n вместо прямого обращения к n8n
 * - Стабильная работа без блокировки браузером
 * - Улучшенное логирование ответов от прокси функции
 * 
 * Предыдущие v4.2.0:
 * - Добавлена интеграция с n8n для автоматического создания сделок в AmoCRM
 * - Webhook вызов https://flow8n.ru/webhook/order-created перед созданием платежа
 * - Fail-safe подход: ошибки n8n не блокируют процесс оплаты
 * - Полная передача данных заказа (клиент, продукт, цена, ID)
 * - Подробное логирование всех этапов интеграции
 */

console.log('📄 payment-modal.js v5.0.0 загружен - Платежная форма T-Bank + все способы оплаты');

// ==================== ПЕРЕМЕННЫЕ ====================
let selectedProduct = null;
let customerData = {};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentModal();
});

function initializePaymentModal() {
    console.log('🚀 Инициализация модального окна оплаты...');
    
    // Привязываем обработчики событий
    bindEventHandlers();
    
    // Инициализируем маскирование телефона
    initPhoneMask();
    
    console.log('✅ Модальное окно оплаты инициализировано');
}

function bindEventHandlers() {
    // Кнопка закрытия модального окна
    const closeButton = document.getElementById('close-payment-modal');
    if (closeButton) {
        closeButton.addEventListener('click', closePaymentModal);
    }
    
    // Закрытие по клику на фон
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closePaymentModal();
        }
    });
    
    // Форма отправки данных покупателя
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handleFormSubmit);
    }
}

// ==================== ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ====================
function openPaymentModal(productName, productPrice, productDescription, event) {
    // Предотвращаем скролл страницы при открытии модального окна
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Сохраняем текущую позицию скролла
    const currentScrollPosition = window.pageYOffset;
    
    console.log(`🛒 Открываем модальное окно для продукта: ${productName}`);
    
    // Сохраняем данные о продукте
    selectedProduct = {
        name: productName,
        price: productPrice,
        description: productDescription
    };
    
    // Обновляем информацию о продукте в модальном окне
    updateProductInfo();
    
    // Очищаем форму
    resetForm();
    
    // Показываем секцию ввода данных покупателя
    showCustomerDataSection();
    
    // Показываем модальное окно
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Блокируем скролл страницы и сохраняем позицию
        document.body.style.position = 'fixed';
        document.body.style.top = `-${currentScrollPosition}px`;
        document.body.style.width = '100%';
        document.body.classList.add('modal-open');
        
        // Сохраняем позицию для восстановления
        window.modalScrollPosition = currentScrollPosition;
        
        // Фокусируемся на первом поле
        setTimeout(() => {
            const firstInput = document.getElementById('customer-name');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

function closePaymentModal() {
    console.log('❌ Закрываем модальное окно оплаты');
    
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Восстанавливаем скролл страницы
        const scrollPosition = window.modalScrollPosition || 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('modal-open');
        
        // Восстанавливаем позицию скролла
        window.scrollTo(0, scrollPosition);
        window.modalScrollPosition = null;
    }
    
    // Очищаем данные
    selectedProduct = null;
    customerData = {};
    resetForm();
}

// Делаем функцию доступной глобально для iframe страниц
window.closePaymentModal = closePaymentModal;

// ==================== НАВИГАЦИЯ МЕЖДУ СЕКЦИЯМИ ====================
function showCustomerDataSection() {
    console.log('👤 Показываем секцию ввода данных покупателя');
    
    // Скрываем секцию оплаты
    const paymentSection = document.getElementById('tbank-payment-section');
    if (paymentSection) {
        paymentSection.classList.add('hidden');
    }
    
    // Показываем секцию данных покупателя
    const customerSection = document.getElementById('customer-data-section');
    if (customerSection) {
        customerSection.classList.remove('hidden');
    }
}

function showPaymentSection() {
    console.log('💳 Показываем секцию оплаты T-Bank');
    
    // Скрываем секцию данных покупателя
    const customerSection = document.getElementById('customer-data-section');
    if (customerSection) {
        customerSection.classList.add('hidden');
    }
    
    // Показываем секцию оплаты
    const paymentSection = document.getElementById('tbank-payment-section');
    if (paymentSection) {
        paymentSection.classList.remove('hidden');
    }
    
    // Инициализируем создание платежа
    createTBankPayment();
}

// ==================== ОБРАБОТКА ФОРМЫ ====================
function handleFormSubmit(e) {
    e.preventDefault();
    console.log('📝 Обрабатываем отправку формы...');
    
    // Собираем данные формы
    const formData = collectFormData();
    
    // Валидируем данные
    if (validateFormData(formData)) {
        // Сохраняем данные покупателя
        customerData = formData;
        console.log('✅ Данные покупателя сохранены:', customerData);
        
        // Переходим к секции оплаты
        showPaymentSection();
    }
}

function collectFormData() {
    return {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        email: document.getElementById('customer-email').value.trim()
    };
}

function validateFormData(data) {
    console.log('🔍 Валидируем данные формы:', data);
    
    if (!data.name) {
        showError('Пожалуйста, введите ваше имя');
        return false;
    }
    
    if (!data.phone || data.phone.length < 11) {
        showError('Пожалуйста, введите корректный номер телефона');
        return false;
    }
    
    if (!data.email || !data.email.includes('@')) {
        showError('Пожалуйста, введите корректный email');
        return false;
    }
    
    return true;
}

// ==================== UI HELPERS ====================
function showError(message) {
    console.error('❌ Ошибка:', message);
    alert(message); // Простое решение, можно заменить на более красивое уведомление
}

function updateProductInfo() {
    if (!selectedProduct) return;
    
    console.log('📦 Обновляем информацию о продукте в модальном окне');
    
    // Обновляем название продукта
    const productNameElement = document.getElementById('modal-product-name');
    if (productNameElement) {
        productNameElement.textContent = selectedProduct.name;
    }
    
    // Обновляем цену продукта
    const productPriceElement = document.getElementById('modal-product-price');
    if (productPriceElement) {
        productPriceElement.textContent = selectedProduct.price;
    }
}

// ==================== СОЗДАНИЕ ПЛАТЕЖА T-BANK ====================
function initializeTBankWidget() {
    console.log('💳 Инициализируем виджет T-Bank...');
    // Эта функция больше не нужна, но оставляем для совместимости
    createTBankPayment();
}

async function createTBankPayment() {
    console.log('💰 Создаем платеж T-Bank и готовим перенаправление:', selectedProduct, customerData);
    
    if (!selectedProduct || !customerData) {
        showError('Данные о продукте или покупателе не найдены');
        return;
    }

    // Показываем уведомление о создании платежа
    showPaymentRedirectNotification();
    
    // Извлекаем цену из строки (убираем "₽" и пробелы)
    const priceString = selectedProduct.price.replace(/[^\d]/g, '');
    const priceNumber = parseInt(priceString, 10);
    
    // Подготавливаем данные для платежа
    const paymentData = {
        Amount: priceNumber * 100, // В копейках
        OrderId: 'order-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        Description: selectedProduct.name,
        Email: customerData.email,
        Phone: customerData.phone,
        SuccessURL: window.location.origin + '/thankyou.html',
        FailURL: window.location.origin + '/fail.html'
    };
    
    console.log('📋 Данные платежа:', paymentData);
    
    // Отправляем данные в n8n для создания сделки в AmoCRM через Netlify функцию
    try {
        console.log('📤 Отправляем данные в n8n через Netlify функцию...');
        const n8nResponse = await fetch('/.netlify/functions/send-to-n8n', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerName: customerData.name,
                customerPhone: customerData.phone,
                customerEmail: customerData.email,
                productName: selectedProduct.name,
                productPrice: priceNumber,
                orderId: paymentData.OrderId
            })
        });
        
        if (n8nResponse.ok) {
            const result = await n8nResponse.json();
            console.log('✅ Данные успешно отправлены в n8n:', result);
        } else {
            console.warn('⚠️ Netlify функция ответила с ошибкой, но продолжаем создание платежа');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки в n8n через Netlify функцию:', error);
        // Продолжаем работу даже если n8n недоступен - это не критично
    }
    
    try {
        // Отправляем запрос на создание платежа через backend
        const response = await fetch('/.netlify/functions/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📨 Ответ от T-Bank:', result);
        
        if (result.Success && result.PaymentURL) {
            console.log('✅ Платеж создан успешно, перенаправляем на:', result.PaymentURL);
            
            // Перенаправляем на платежную форму T-Bank
            redirectToTBankPaymentForm(result.PaymentURL);
            
        } else {
            throw new Error(result.Message || result.Details || result.error || 'Неизвестная ошибка при создании платежа');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при создании платежа:', error);
        showTBankError(error.message);
    }
}

function showPaymentRedirectNotification() {
    console.log('🔄 Показываем уведомление о создании платежа и подготовке к перенаправлению');
    
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <div class="text-center p-8">
            <!-- Анимация загрузки -->
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
            
            <!-- Заголовок -->
            <h3 class="text-xl font-semibold text-gray-800 mb-4">
                Создаем ваш платеж
            </h3>
            
            <!-- Описание -->
            <div class="space-y-3 mb-6">
                <p class="text-gray-600">
                    Подготавливаем платежную форму T-Bank с вашими данными...
                </p>
                <p class="text-sm text-gray-500">
                    Через несколько секунд вы будете перенаправлены на безопасную страницу оплаты
                </p>
            </div>
            
            <!-- Способы оплаты -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 class="text-sm font-medium text-blue-800 mb-3">Доступные способы оплаты:</h4>
                <div class="flex flex-wrap justify-center gap-3 text-xs text-blue-700">
                    <span class="bg-white px-2 py-1 rounded">💳 Банковские карты</span>
                    <span class="bg-white px-2 py-1 rounded">📱 T-Pay</span>
                    <span class="bg-white px-2 py-1 rounded">⚡ СБП</span>
                    <span class="bg-white px-2 py-1 rounded">🟢 SberPay</span>
                    <span class="bg-white px-2 py-1 rounded">🔵 MirPay</span>
                </div>
            </div>
            
            <!-- Индикаторы безопасности -->
            <div class="flex items-center justify-center gap-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div class="flex items-center gap-2 text-green-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-medium">SSL шифрование</span>
                </div>
                <div class="flex items-center gap-2 text-green-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-medium">PCI DSS</span>
                </div>
                <div class="flex items-center gap-2 text-green-700">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-medium">Банк России</span>
                </div>
            </div>
        </div>
    `;
}

function redirectToTBankPaymentForm(paymentURL) {
    console.log('🚀 Перенаправляем на платежную форму T-Bank:', paymentURL);
    
    // Показываем финальное уведомление
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <div class="text-center p-8">
            <!-- Иконка успеха -->
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
            </div>
            
            <!-- Сообщение -->
            <h3 class="text-xl font-semibold text-gray-800 mb-4">
                Платеж готов!
            </h3>
            <p class="text-gray-600 mb-6">
                Переходим на безопасную страницу оплаты T-Bank...
            </p>
            
            <!-- Кнопка ручного перехода -->
            <button 
                onclick="window.location.href='${paymentURL}'" 
                class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
                Если не произошло автоматическое перенаправление - нажмите здесь
            </button>
        </div>
    `;
    
    // Закрываем модальное окно через 2 секунды
    setTimeout(() => {
        closePaymentModal();
        
        // Еще через секунду делаем перенаправление
        setTimeout(() => {
            console.log('🔄 Выполняем перенаправление на T-Bank...');
            window.location.href = paymentURL;
        }, 1000);
    }, 2000);
}

function showTBankError(message) {
    console.error('❌ Ошибка T-Bank:', message);
    
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <div class="text-center p-8">
            <!-- Иконка ошибки -->
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </div>
            
            <!-- Сообщение об ошибке -->
            <h3 class="text-xl font-semibold text-red-600 mb-4">
                Ошибка создания платежа
            </h3>
            <p class="text-gray-600 mb-6">
                ${message}
            </p>
            
            <!-- Кнопка повтора -->
            <button 
                onclick="showCustomerDataSection()" 
                class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
                Попробовать снова
            </button>
        </div>
    `;
}

// ==================== LEGACY FUNCTIONS (для совместимости) ====================
function createTBankWidget() {
    // Эта функция больше не используется, но оставляем для совместимости
    console.log('⚠️ createTBankWidget() устарела, используется createTBankPayment()');
    createTBankPayment();
}

function processPayment() {
    // Эта функция больше не используется, но оставляем для совместимости
    console.log('⚠️ processPayment() устарела, используется createTBankPayment()');
    createTBankPayment();
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function initPhoneMask() {
    const phoneInput = document.getElementById('customer-phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('8')) {
            value = '7' + value.slice(1);
        }
        
        if (value.startsWith('7')) {
            value = value.slice(0, 11);
            const formatted = value.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
            e.target.value = formatted;
        } else if (value.length > 0) {
            value = '7' + value;
            value = value.slice(0, 11);
            const formatted = value.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
            e.target.value = formatted;
        }
    });
    
    phoneInput.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && e.target.value === '+7 (') {
            e.target.value = '';
        }
    });
}

function resetForm() {
    console.log('🔄 Очищаем форму');
    
    const form = document.getElementById('payment-form');
    if (form) {
        form.reset();
    }
    
    // Очищаем контейнер T-Bank
    const container = document.getElementById('tbank-payment-container');
    if (container) {
        container.innerHTML = '';
    }
    
    // Показываем секцию данных покупателя
    showCustomerDataSection();
} 