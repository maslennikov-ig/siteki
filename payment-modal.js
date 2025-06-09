/**
 * Доверительное модальное окно оплаты
 * Версия: 3.1.0 - Добавлены элементы доверия и T-Bank брендинг
 * Дата: Январь 2025
 * 
 * Обновления v3.1.0:
 * - Добавлено лого T-Bank в заголовке
 * - Индикаторы безопасности (SSL, PCI DSS, Банк России)
 * - Trust буллеты (мгновенный чек, возврат 14 дней, техподдержка 24/7)
 * - Улучшенная секция T-Bank с дополнительными элементами доверия
 */

console.log('📄 payment-modal.js v3.1.0 загружен - Доверительный дизайн с T-Bank брендингом');

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
    container.innerHTML = `
        <div class="bg-white rounded-lg overflow-hidden border">
            <!-- Заголовок -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="tbank_logo.svg" alt="T-Bank" class="h-6" onerror="this.style.display='none'">
                    <h3 class="font-semibold">T-Bank - Безопасная оплата</h3>
                </div>
                <button 
                    onclick="showCustomerDataSection()" 
                    class="text-blue-100 hover:text-white transition-colors"
                    aria-label="Назад"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
            
            <!-- Индикаторы безопасности -->
            <div class="bg-blue-50 p-3 border-b">
                <div class="flex items-center justify-center space-x-6 text-xs text-blue-700">
                    <div class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <span>SSL шифрование</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <span>PCI DSS</span>
                    </div>
                    <div class="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                        <span>Лицензия ЦБ РФ</span>
                    </div>
                </div>
            </div>
            
            <!-- Iframe загрузки -->
            <div id="tbank-loading" class="p-8 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p class="text-gray-600">Загружаем платежную форму...</p>
            </div>
            
            <!-- Iframe -->
            <iframe 
                id="tbank-iframe"
                src="${paymentURL}"
                class="w-full h-96 border-0 hidden"
                frameborder="0"
                scrolling="auto"
                onload="hideTBankLoading()"
                onerror="showTBankError('Ошибка загрузки платежной формы')"
            ></iframe>
            
            <!-- Trust буллеты -->
            <div class="bg-gray-50 p-4 border-t">
                <div class="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-green-500">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Мгновенный чек</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-green-500">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Возврат 14 дней</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-green-500">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Техподдержка 24/7</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-green-500">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Лицензия ЦБ РФ</span>
                    </div>
                </div>
            </div>
        </div>
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

// ==================== ВТОРОЙ ЭКРАН ОПЛАТЫ ====================

// Переключение выпадающего списка суммы
function toggleAmountDropdown() {
    console.log('💰 Клик по выбору суммы (функция-заглушка)');
    // В реальной версии здесь был бы выпадающий список с вариантами сумм
}

// Переключение чекбокса квитанции
function toggleReceiptCheckbox() {
    const checkbox = document.getElementById('tbank-receipt-checkbox');
    if (checkbox) {
        const isChecked = checkbox.classList.contains('checked');
        const checkIcon = checkbox.querySelector('svg');
        
        if (isChecked) {
            // Снимаем галочку
            checkbox.classList.remove('checked', 'bg-blue-600', 'border-blue-600');
            checkbox.classList.add('border-gray-300');
            if (checkIcon) {
                checkIcon.classList.add('hidden');
            }
        } else {
            // Ставим галочку
            checkbox.classList.add('checked', 'bg-blue-600', 'border-blue-600');
            checkbox.classList.remove('border-gray-300');
            if (checkIcon) {
                checkIcon.classList.remove('hidden');
            }
        }
        
        console.log('📄 Чекбокс квитанции:', isChecked ? 'выключен' : 'включен');
    }
}

// Возврат к первому экрану (переопределяем функцию goBackToCustomerData)
function goBackToCustomerData() {
    console.log('🔙 Возврат к данным клиента');
    
    // Очищаем поле карты и сбрасываем состояние
    const cardInput = document.getElementById('tbank-card-number');
    if (cardInput) {
        cardInput.value = '';
        updateCardTypeIndicator('', 0);
    }
    
    // Сбрасываем чекбокс
    const checkbox = document.getElementById('tbank-receipt-checkbox');
    if (checkbox) {
        checkbox.classList.remove('checked', 'bg-blue-600', 'border-blue-600');
        checkbox.classList.add('border-gray-300');
        const checkIcon = checkbox.querySelector('svg');
        if (checkIcon) {
            checkIcon.classList.add('hidden');
        }
    }
    
    // Показываем первый экран
    showCustomerDataSection();
}

// Обработка оплаты через T-Bank
function processTBankPayment() {
    console.log('💳 Обработка оплаты через T-Bank');
    
    const cardNumberInput = document.getElementById('tbank-card-number');
    const payButton = document.getElementById('tbank-pay-button');
    
    if (!cardNumberInput || !cardNumberInput.value.trim()) {
        showPaymentError('Пожалуйста, введите номер карты');
        if (cardNumberInput) cardNumberInput.focus();
        return;
    }
    
    // Получаем чистый номер карты
    const cleanCardNumber = cardNumberInput.value.replace(/\s/g, '');
    const cardType = detectCardType(cleanCardNumber);
    
    // Расширенная валидация номера карты
    const validationResult = validateCardNumber(cleanCardNumber, cardType);
    if (!validationResult.isValid) {
        showPaymentError(validationResult.message);
        cardNumberInput.focus();
        return;
    }
    
    const needsReceipt = document.getElementById('tbank-receipt-checkbox')?.classList.contains('checked') || false;
    
    // Показываем индикатор загрузки
    if (payButton) {
        payButton.classList.add('opacity-75');
        payButton.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Обработка...
            </div>
        `;
        payButton.disabled = true;
    }
    
    console.log('💳 Данные для оплаты:', {
        cardType: cardType,
        cardMasked: cleanCardNumber.replace(/\d(?=\d{4})/g, '*'),
        needsReceipt: needsReceipt
    });
    
    // Симуляция обработки платежа с реалистичной задержкой
    setTimeout(() => {
        // Убираем индикатор загрузки
        if (payButton) {
            payButton.classList.remove('opacity-75');
            payButton.innerHTML = 'Оплатить';
            payButton.disabled = false;
        }
        
        // Показываем результат
        showPaymentSuccess();
    }, 2000);
}

// Валидация номера карты
function validateCardNumber(cardNumber, cardType) {
    if (cardNumber.length < 13) {
        return {
            isValid: false,
            message: 'Номер карты слишком короткий'
        };
    }
    
    if (cardType === 'unknown') {
        return {
            isValid: false,
            message: 'Неизвестный тип карты'
        };
    }
    
    // Проверяем длину для конкретного типа карты
    const expectedLengths = {
        visa: [13, 16, 19],
        mastercard: [16],
        mir: [16, 17, 18, 19],
        amex: [15],
        discover: [16],
        jcb: [16]
    };
    
    if (!expectedLengths[cardType] || !expectedLengths[cardType].includes(cardNumber.length)) {
        return {
            isValid: false,
            message: `Неверная длина номера для карты ${getCardTypeName(cardType)}`
        };
    }
    
    // Алгоритм Луна для проверки контрольной суммы
    if (!luhnCheck(cardNumber)) {
        return {
            isValid: false,
            message: 'Неверный номер карты'
        };
    }
    
    return {
        isValid: true,
        message: 'Номер карты действителен'
    };
}

// Алгоритм Луна для проверки номера карты
function luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i));
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// Определение типа карты по номеру
function detectCardType(number) {
    const patterns = {
        visa: /^4/,
        mastercard: /^5[1-5]|^2[2-7]/,
        mir: /^220[0-4]|^220[5-9]|^2[2-9]/,
        amex: /^3[47]/,
        discover: /^6011|^65/,
        jcb: /^35/
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(number)) {
            return type;
        }
    }
    
    return 'unknown';
}

// Получение названия типа карты
function getCardTypeName(cardType) {
    const names = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        mir: 'МИР',
        amex: 'American Express',
        discover: 'Discover',
        jcb: 'JCB'
    };
    
    return names[cardType] || 'Неизвестная карта';
}

// Форматирование номера карты при вводе
function formatCardNumber(input) {
    // Получаем только цифры
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    
    // Ограничиваем максимальную длину
    if (value.length > 19) {
        value = value.substr(0, 19);
    }
    
    // Определяем тип карты
    const cardType = detectCardType(value);
    
    // Форматируем с пробелами
    const formattedValue = value.replace(/\d{4}(?=.)/g, '$& ');
    
    // Устанавливаем отформатированное значение
    input.value = formattedValue;
    
    // Обновляем индикатор типа карты
    updateCardTypeIndicator(cardType, value.length);
}

// Обновление индикатора типа карты
function updateCardTypeIndicator(cardType, length) {
    const indicator = document.getElementById('tbank-card-type-indicator');
    if (!indicator) return;
    
    // Очищаем индикатор
    indicator.innerHTML = '';
    
    if (cardType === 'unknown' || length < 4) {
        return;
    }
    
    // Создаем иконку в зависимости от типа карты
    let iconHTML = '';
    
    switch (cardType) {
        case 'visa':
            iconHTML = '<div class="text-blue-600 font-bold text-sm">VISA</div>';
            break;
        case 'mastercard':
            iconHTML = '<div class="text-red-500 font-bold text-sm">MC</div>';
            break;
        case 'mir':
            iconHTML = '<div class="text-green-600 font-bold text-sm">МИР</div>';
            break;
        case 'amex':
            iconHTML = '<div class="text-blue-800 font-bold text-xs">AMEX</div>';
            break;
        default:
            iconHTML = '<div class="text-gray-500 font-bold text-xs">' + getCardTypeName(cardType) + '</div>';
    }
    
    indicator.innerHTML = iconHTML;
}

// Показать ошибку оплаты
function showPaymentError(message) {
    console.error('❌ Ошибка оплаты:', message);
    
    // Простое alert для демонстрации, можно заменить на красивое модальное окно
    alert('Ошибка: ' + message);
}

// Показать успешную оплату
function showPaymentSuccess() {
    console.log('✅ Успешная оплата');
    
    // Перенаправляем на страницу благодарности
    window.location.href = 'thankyou.html';
}

// Добавляем глобальные функции для второго экрана
window.toggleAmountDropdown = toggleAmountDropdown;
window.toggleReceiptCheckbox = toggleReceiptCheckbox;
window.processTBankPayment = processTBankPayment;
window.formatCardNumber = formatCardNumber;
window.goBackToCustomerData = goBackToCustomerData; 