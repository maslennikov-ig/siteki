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
            
            // Показываем нативную форму T-Bank
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
    console.log('💳 Показываем нативную форму T-Bank:', paymentURL);
    
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <!-- T-Bank Native Payment Interface -->
        <div class="bg-gray-900 text-white rounded-xl overflow-hidden shadow-2xl border border-gray-800">
            
            <!-- Header with T-Bank Branding -->
            <div class="bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-300/5"></div>
                <div class="relative flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                            <span class="text-black font-black text-xl">T</span>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-white">Безопасная оплата</h2>
                            <p class="text-gray-400 text-sm">Защищено банком T-Bank</p>
                        </div>
                    </div>
                    <button 
                        onclick="showCustomerDataSection()" 
                        class="p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                        aria-label="Назад к данным"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-400 group-hover:text-white">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Security Indicators -->
            <div class="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
                <div class="flex items-center justify-center space-x-8 text-sm">
                    <div class="flex items-center space-x-2 text-green-400">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="font-medium">SSL шифрование</span>
                    </div>
                    <div class="flex items-center space-x-2 text-green-400">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="font-medium">PCI DSS</span>
                    </div>
                    <div class="flex items-center space-x-2 text-green-400">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="font-medium">Лицензия ЦБ РФ</span>
                    </div>
                </div>
            </div>

            <!-- Payment Amount Display -->
            <div class="bg-gray-800 p-6 text-center border-b border-gray-700">
                <div class="text-3xl font-bold text-white mb-2" id="tbank-amount">5 000 ₽</div>
                <div class="text-gray-400 text-sm" id="tbank-description">Оплата картой</div>
            </div>

            <!-- Payment Form -->
            <div class="p-6 space-y-6">
                
                <!-- Card Section -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-white flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-yellow-400">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                        <span>Оплата картой</span>
                        <div class="flex-1 flex justify-end space-x-2">
                            <div class="w-8 h-5 bg-blue-600 rounded text-xs flex items-center justify-center text-white font-bold">VISA</div>
                            <div class="w-8 h-5 bg-red-600 rounded text-xs flex items-center justify-center text-white font-bold">MC</div>
                            <div class="w-8 h-5 bg-blue-500 rounded text-xs flex items-center justify-center text-white font-bold">МИР</div>
                        </div>
                    </h3>
                    
                    <!-- Card Number -->
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-300">Номер карты</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="tbank-card-number"
                                placeholder="0000 0000 0000 0000"
                                maxlength="19"
                                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                oninput="formatCardNumber(this)"
                            >
                            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div id="card-type-icon" class="w-8 h-5 bg-gray-600 rounded flex items-center justify-center text-xs text-gray-400">
                                    CARD
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Expiry & CVV -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-300">Срок действия</label>
                            <input 
                                type="text" 
                                id="tbank-expiry"
                                placeholder="ММ/ГГ"
                                maxlength="5"
                                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                oninput="formatExpiry(this)"
                            >
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-300 flex items-center space-x-1">
                                <span>CVV</span>
                                <div class="group relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-400 cursor-help">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c0-1.032.771-1.87 1.72-1.87s1.72.838 1.72 1.87c0 .897-.557 1.663-1.34 1.897l-.362.15c-.415.172-.647.547-.647.952v.487M12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        3 цифры на обороте карты
                                    </div>
                                </div>
                            </label>
                            <input 
                                type="text" 
                                id="tbank-cvv"
                                placeholder="123"
                                maxlength="4"
                                class="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                oninput="formatCVV(this)"
                            >
                        </div>
                    </div>
                    
                    <!-- Checkbox for saving card -->
                    <div class="flex items-center space-x-3 pt-2">
                        <input type="checkbox" id="save-card" class="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2">
                        <label for="save-card" class="text-sm text-gray-300">Нужна квитанция?</label>
                    </div>
                </div>
                
                <!-- Continue Button -->
                <button 
                    onclick="processTBankPayment('${paymentURL}')"
                    class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                    id="tbank-pay-button"
                >
                    <div class="flex items-center justify-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <span>Оплатить 5 000 ₽</span>
                    </div>
                </button>
            </div>
            
            <!-- Trust Footer -->
            <div class="bg-gray-800 p-4 border-t border-gray-700">
                <div class="grid grid-cols-2 gap-3 text-xs text-gray-400">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Мгновенный чек</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Возврат 14 дней</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Техподдержка 24/7</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Лицензия ЦБ РФ</span>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-700 text-center">
                    <div class="flex items-center justify-center space-x-2 text-green-400">
                        <div class="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span class="text-black text-xs font-bold">T</span>
                        </div>
                        <span class="text-sm font-medium">T-Bank</span>
                        <span class="text-xs text-gray-500">Официальная платежная система</span>
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="text-xs text-green-400 font-medium">Защищено</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize form validation and card type detection
    initializeTBankForm();
}

// ==================== T-BANK FORM UTILITIES ====================

function initializeTBankForm() {
    // Update amount display with current product price
    const selectedProduct = window.selectedProduct;
    if (selectedProduct) {
        const amountEl = document.getElementById('tbank-amount');
        const descriptionEl = document.getElementById('tbank-description');
        const payButton = document.getElementById('tbank-pay-button');
        
        if (amountEl) amountEl.textContent = `${selectedProduct.price} ₽`;
        if (descriptionEl) descriptionEl.textContent = selectedProduct.name;
        if (payButton) {
            payButton.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span>Оплатить ${selectedProduct.price} ₽</span>
                </div>
            `;
        }
    }
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = value;
    
    // Detect card type
    detectCardType(value.replace(/\s/g, ''));
}

function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

function formatCVV(input) {
    input.value = input.value.replace(/\D/g, '');
}

function detectCardType(cardNumber) {
    const cardTypeIcon = document.getElementById('card-type-icon');
    if (!cardTypeIcon) return;
    
    if (cardNumber.startsWith('4')) {
        cardTypeIcon.className = 'w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-xs text-white font-bold';
        cardTypeIcon.textContent = 'VISA';
    } else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) {
        cardTypeIcon.className = 'w-8 h-5 bg-red-600 rounded flex items-center justify-center text-xs text-white font-bold';
        cardTypeIcon.textContent = 'MC';
    } else if (cardNumber.startsWith('2')) {
        cardTypeIcon.className = 'w-8 h-5 bg-blue-500 rounded flex items-center justify-center text-xs text-white font-bold';
        cardTypeIcon.textContent = 'МИР';
    } else if (cardNumber.length > 0) {
        cardTypeIcon.className = 'w-8 h-5 bg-gray-600 rounded flex items-center justify-center text-xs text-gray-400';
        cardTypeIcon.textContent = 'CARD';
    } else {
        cardTypeIcon.className = 'w-8 h-5 bg-gray-600 rounded flex items-center justify-center text-xs text-gray-400';
        cardTypeIcon.textContent = 'CARD';
    }
}

function processTBankPayment(paymentURL) {
    console.log('💳 Обрабатываем оплату T-Bank:', paymentURL);
    
    // Validate form
    const cardNumber = document.getElementById('tbank-card-number')?.value?.replace(/\s/g, '');
    const expiry = document.getElementById('tbank-expiry')?.value;
    const cvv = document.getElementById('tbank-cvv')?.value;
    
    if (!cardNumber || cardNumber.length < 16) {
        showTBankFormError('Введите корректный номер карты');
        return;
    }
    
    if (!expiry || expiry.length < 5) {
        showTBankFormError('Введите срок действия карты');
        return;
    }
    
    if (!cvv || cvv.length < 3) {
        showTBankFormError('Введите CVV код');
        return;
    }
    
    // Show processing state
    const payButton = document.getElementById('tbank-pay-button');
    if (payButton) {
        payButton.disabled = true;
        payButton.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                <span>Обрабатываем платеж...</span>
            </div>
        `;
    }
    
    // Redirect to T-Bank processing
    setTimeout(() => {
        window.open(paymentURL, '_blank');
        closePaymentModal();
    }, 1500);
}

function showTBankFormError(message) {
    // Create or update error message
    let errorEl = document.getElementById('tbank-form-error');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'tbank-form-error';
        errorEl.className = 'mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm';
        
        const payButton = document.getElementById('tbank-pay-button');
        if (payButton) {
            payButton.parentNode.insertBefore(errorEl, payButton);
        }
    }
    
    errorEl.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-red-400">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9-.75a9 9 0 1118 0 9 9 0 01-18 0zm9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorEl) errorEl.remove();
    }, 5000);
}

function showTBankError(message) {
    console.error('❌ Ошибка T-Bank:', message);
    
    const container = document.getElementById('tbank-payment-container');
    container.innerHTML = `
        <div class="bg-gray-900 text-white rounded-xl overflow-hidden shadow-2xl border border-gray-800 p-8 text-center">
            <div class="text-red-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Ошибка оплаты</h3>
            <p class="text-gray-400 mb-6">${message}</p>
            <button 
                onclick="showCustomerDataSection()"
                class="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-3 px-6 rounded-xl transition-all duration-200"
            >
                Попробовать снова
            </button>
        </div>
    `;
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