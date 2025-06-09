/**
 * Доверительное модальное окно оплаты
 * Версия: 3.2.0 - Устранение дублирования интерфейса
 * Дата: Январь 2025
 * 
 * Обновления v3.2.0:
 * - Убрано дублирование элементов интерфейса между HTML и JavaScript
 * - Упрощена функция showTBankIframe() - только iframe без дублированных элементов
 * - Все статические элементы доверия остаются в HTML (заголовки, индикаторы, кнопки)
 * - Значительно уменьшен объем кода (~100 строк меньше)
 * - Улучшена производительность и удобство поддержки
 */

console.log('📄 payment-modal.js v3.2.0 загружен - Устранено дублирование интерфейса');

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
    
    // Кнопка возврата к данным покупателя
    const backButton = document.getElementById('back-to-customer-data');
    if (backButton) {
        backButton.addEventListener('click', showCustomerDataSection);
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

// ==================== УПРАВЛЕНИЕ СЕКЦИЯМИ ====================
function showCustomerDataSection() {
    console.log('👤 Показываем секцию ввода данных покупателя');
    
    const customerSection = document.getElementById('customer-data-section');
    const paymentSection = document.getElementById('tbank-payment-section');
    const productSummary = document.getElementById('product-summary');
    
    if (customerSection) {
        customerSection.classList.remove('hidden');
    }
    
    if (paymentSection) {
        paymentSection.classList.add('hidden');
    }
    
    // Показываем Product Summary на первом экране
    if (productSummary) {
        productSummary.classList.remove('hidden');
    }
}

function showPaymentSection() {
    console.log('💳 Показываем секцию оплаты');
    
    const customerSection = document.getElementById('customer-data-section');
    const paymentSection = document.getElementById('tbank-payment-section');
    const productSummary = document.getElementById('product-summary');
    
    if (customerSection) {
        customerSection.classList.add('hidden');
    }
    
    if (paymentSection) {
        paymentSection.classList.remove('hidden');
    }
    
    // Скрываем Product Summary на втором экране
    if (productSummary) {
        productSummary.classList.add('hidden');
    }
    
    // Инициализируем T-Bank виджет
    initializeTBankWidget();
}

// ==================== ОБРАБОТКА ФОРМЫ ====================
function handleFormSubmit(e) {
    e.preventDefault();
    console.log('📝 Обработка отправки формы...');
    
    // Собираем данные формы
    const formData = collectFormData();
    
    // Валидируем данные
    if (!validateFormData(formData)) {
        return;
    }
    
    // Сохраняем данные покупателя
    customerData = formData;
    
    console.log('✅ Данные покупателя сохранены:', customerData);
    
    // Переходим к секции оплаты
    showPaymentSection();
}

function collectFormData() {
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    
    return {
        name,
        phone,
        email
    };
}

function validateFormData(data) {
    // Проверяем обязательные поля
    if (!data.name) {
        showError('Пожалуйста, введите ваше имя');
        document.getElementById('customer-name').focus();
        return false;
    }
    
    if (!data.phone) {
        showError('Пожалуйста, введите номер телефона');
        document.getElementById('customer-phone').focus();
        return false;
    }
    
    if (!data.email) {
        showError('Пожалуйста, введите email');
        document.getElementById('customer-email').focus();
        return false;
    }
    
    // Проверяем формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showError('Пожалуйста, введите корректный email');
        document.getElementById('customer-email').focus();
        return false;
    }
    
    return true;
}

function showError(message) {
    // Можно добавить более красивое отображение ошибок
    alert(message);
}

// ==================== ОБНОВЛЕНИЕ ИНФОРМАЦИИ О ПРОДУКТЕ ====================
function updateProductInfo() {
    if (!selectedProduct) return;
    
    const nameElement = document.getElementById('selected-product-name');
    const descriptionElement = document.getElementById('selected-product-description');
    const priceElement = document.getElementById('selected-product-price');
    
    if (nameElement) {
        nameElement.textContent = selectedProduct.name;
    }
    
    if (descriptionElement) {
        descriptionElement.textContent = selectedProduct.description;
    }
    
    if (priceElement) {
        priceElement.textContent = selectedProduct.price;
    }
}

// ==================== T-BANK ИНТЕГРАЦИЯ ====================
function initializeTBankWidget() {
    console.log('🏦 Инициализируем T-Bank виджет...');
    
    const container = document.getElementById('tbank-payment-container');
    if (!container || !selectedProduct) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем реальную интеграцию с T-Bank вместо виджета
    createTBankPayment();
}

async function createTBankPayment() {
    console.log('💰 Создаем реальный платеж T-Bank:', selectedProduct, customerData);
    
    if (!selectedProduct || !customerData) {
        showError('Данные о продукте или покупателе не найдены');
        return;
    }
    
    // Показываем индикатор загрузки
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Создаем платеж...</p>
        </div>
    `;
    
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
            console.log('✅ Платеж создан успешно:', result.PaymentURL);
            
            // Показываем iframe с платежной формой T-Bank
            showTBankIframe(result.PaymentURL);
            
        } else {
            throw new Error(result.Message || result.Details || result.error || 'Неизвестная ошибка при создании платежа');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при создании платежа:', error);
        showTBankError(error.message);
    }
}

function showTBankIframe(paymentURL) {
    console.log('💳 Показываем iframe T-Bank:', paymentURL);
    
    const container = document.getElementById('tbank-payment-container');
    // Теперь создаем только iframe без дублированных элементов интерфейса
    container.innerHTML = `
        <!-- Iframe загрузки -->
        <div id="tbank-loading" class="p-6 text-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p class="text-gray-600 text-sm">Загружаем платежную форму T-Bank...</p>
        </div>
        
        <!-- Iframe -->
        <iframe 
            id="tbank-iframe"
            src="${paymentURL}"
            class="w-full h-64 sm:h-72 border-0 rounded-lg hidden"
            frameborder="0"
            scrolling="auto"
            onload="hideTBankLoading()"
            onerror="showTBankError('Ошибка загрузки платежной формы')"
        ></iframe>
    `;
}

function hideTBankLoading() {
    console.log('✅ T-Bank iframe загружен');
    const loading = document.getElementById('tbank-loading');
    const iframe = document.getElementById('tbank-iframe');
    
    if (loading) {
        loading.classList.add('hidden');
    }
    
    if (iframe) {
        iframe.classList.remove('hidden');
    }
}

function showTBankError(message) {
    console.error('❌ Ошибка T-Bank:', message);
    
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <div class="p-8 text-center">
            <div class="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Ошибка оплаты</h3>
            <p class="text-gray-600 mb-4">${message}</p>
            <button 
                onclick="showCustomerDataSection()"
                class="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
                Попробовать снова
            </button>
        </div>
    `;
}

function createTBankWidget() {
    // Эта функция больше не используется, заменена на createTBankPayment
    return document.createElement('div');
}

function processPayment() {
    // Эта функция больше не используется, заменена на createTBankPayment
    console.log('💳 processPayment() вызвана, но теперь используется createTBankPayment()');
}

// ==================== МАСКИРОВАНИЕ ТЕЛЕФОНА ====================
function initPhoneMask() {
    const phoneInput = document.getElementById('customer-phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value[0] === '8') {
                value = '7' + value.slice(1);
            }
            if (value[0] !== '7') {
                value = '7' + value;
            }
        }
        
        let formattedValue = '';
        if (value.length > 0) {
            formattedValue = '+7';
            if (value.length > 1) {
                formattedValue += ' (' + value.slice(1, 4);
                if (value.length > 4) {
                    formattedValue += ') ' + value.slice(4, 7);
                    if (value.length > 7) {
                        formattedValue += '-' + value.slice(7, 9);
                        if (value.length > 9) {
                            formattedValue += '-' + value.slice(9, 11);
                        }
                    }
                }
            }
        }
        
        e.target.value = formattedValue;
    });
}

// ==================== СБРОС ФОРМЫ ====================
function resetForm() {
    const form = document.getElementById('payment-form');
    if (form) {
        form.reset();
    }
}

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ВЫЗОВА ИЗ HTML ====================
window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;
window.processPayment = processPayment;
window.hideTBankLoading = hideTBankLoading;
window.showTBankError = showTBankError; 