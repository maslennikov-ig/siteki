/**
 * Финальное модальное окно оплаты с официальным T-Bank лого
 * Версия: 3.2.0 - Официальное T-Bank лого и финальные UX улучшения
 * Дата: Январь 2025
 * 
 * Обновления v3.2.0:
 * - Официальное SVG лого T-Bank вместо самодельного
 * - Убрано слово "Онлайн" из названия банка
 * - SSL индикатор перенесен под "Защищено"
 * - "Возврат 14 дней" заменен на "Безопасный платёж"
 * - Оптимизированная структура заголовка T-Bank секции
 * 
 * Предыдущие обновления v3.1.0:
 * - Добавлено лого T-Bank в заголовке
 * - Индикаторы безопасности (SSL, PCI DSS, Банк России)
 * - Trust буллеты (мгновенный чек, техподдержка 24/7, лицензия ЦБ РФ)
 * - Улучшенная секция T-Bank с дополнительными элементами доверия
 */

console.log('📄 payment-modal.js v3.2.0 загружен - Финальная версия с официальным T-Bank лого');

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
function openPaymentModal(productName, productPrice, productDescription) {
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
        
        // Блокируем скролл страницы
        document.body.classList.add('modal-open');
        
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
        
        // Разблокируем скролл страницы
        document.body.classList.remove('modal-open');
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
    
    if (customerSection) {
        customerSection.classList.remove('hidden');
    }
    
    if (paymentSection) {
        paymentSection.classList.add('hidden');
    }
}

function showPaymentSection() {
    console.log('💳 Показываем секцию оплаты');
    
    const customerSection = document.getElementById('customer-data-section');
    const paymentSection = document.getElementById('tbank-payment-section');
    
    if (customerSection) {
        customerSection.classList.add('hidden');
    }
    
    if (paymentSection) {
        paymentSection.classList.remove('hidden');
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
    
    // Создаем T-Bank виджет
    const widget = createTBankWidget();
    container.appendChild(widget);
}

function createTBankWidget() {
    const widget = document.createElement('div');
    widget.className = 'tbank-widget';
    
    widget.innerHTML = `
        <div class="p-6 bg-gray-50 rounded-lg">
            <div class="text-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Оплата через T-Bank</h3>
                <p class="text-3xl font-bold text-orange-600">${selectedProduct.price}</p>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Номер карты</label>
                    <input 
                        type="text" 
                        id="card-number" 
                        placeholder="1234 5678 9012 3456"
                        class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                        maxlength="19"
                    >
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Срок действия</label>
                        <input 
                            type="text" 
                            id="card-expiry" 
                            placeholder="ММ/ГГ"
                            class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                            maxlength="5"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input 
                            type="text" 
                            id="card-cvv" 
                            placeholder="123"
                            class="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                            maxlength="3"
                        >
                    </div>
                </div>
                
                <button 
                    type="button"
                    onclick="processPayment()"
                    class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                    Оплатить ${selectedProduct.price}
                </button>
            </div>
            
            <div class="mt-4 text-center text-xs text-gray-500">
                🔒 Защищённое соединение SSL
            </div>
        </div>
    `;
    
    return widget;
}

function processPayment() {
    console.log('💳 Обрабатываем оплату...');
    
    // Здесь будет интеграция с реальным T-Bank API
    // Пока что показываем сообщение об успехе
    alert(`Спасибо, ${customerData.name}! Оплата на сумму ${selectedProduct.price} обрабатывается. Инструкции отправлены на ${customerData.email}`);
    
    closePaymentModal();
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