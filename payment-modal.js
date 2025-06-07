/**
 * payment-modal.js
 * Управление модальным окном оплаты и интеграция с тестовыми платежами
 * Версия 1.0.0
 */

// Информация о продуктах для модального окна
const productInfo = {
    'guide-1399': {
        name: 'Гайд "Узнай причину отказов и исправь КИ"',
        price: 1399,
        description: 'Подробный гайд с пошаговыми инструкциями по исправлению кредитной истории. Включает шаблоны заявлений и секретные методы работы с БКИ.'
    },
    'consult-5000': {
        name: 'Персональная консультация по КИ',
        price: 5000,
        description: 'Индивидуальная консультация эксперта с анализом вашей кредитной истории, персональным планом действий и ответами на все вопросы.'
    },
    'fullsupport-5000': {
        name: 'Исправление КИ + ведение до кредита',
        price: 5000,
        description: 'Полное сопровождение процесса исправления кредитной истории с ежемесячной поддержкой и ведением до получения кредита.'
    }
};

// Глобальные переменные
let currentProductId = null;
let paymentModal = null;

/**
 * Инициализация модального окна при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Инициализация модального окна оплаты');
    
    // Находим модальное окно
    paymentModal = document.getElementById('payment-modal');
    
    if (!paymentModal) {
        console.error('❌ Модальное окно не найдено');
        return;
    }
    
    // Добавляем обработчик формы
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentFormSubmit);
        console.log('✅ Форма оплаты инициализирована');
    }
    
    // Добавляем маскирование телефона
    initPhoneMask();
    
    // Добавляем обработчик клавиши Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && paymentModal && !paymentModal.classList.contains('hidden')) {
            closePaymentModal();
        }
    });
    
    console.log('✅ Модальное окно оплаты готово к работе');
});

/**
 * Открытие модального окна с информацией о продукте
 */
function openPaymentModal(productId) {
    console.log('💳 Открываем модальное окно для продукта:', productId);
    
    if (!paymentModal) {
        console.error('❌ Модальное окно не найдено');
        return;
    }
    
    const product = productInfo[productId];
    if (!product) {
        console.error('❌ Продукт не найден:', productId);
        alert('Ошибка: Продукт не найден');
        return;
    }
    
    // Сохраняем текущий продукт
    currentProductId = productId;
    
    // Информация о продукте убрана из интерфейса
    
    // Обновляем текст кнопки
    const submitButton = document.getElementById('submit-payment');
    if (submitButton) {
        submitButton.innerHTML = `
            <span class="payment-submit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
            </span>
            Оплатить ${product.price.toLocaleString()} ₽
        `;
    }
    
    // Очищаем форму
    resetPaymentForm();
    
    // Показываем модальное окно
    paymentModal.classList.remove('hidden');
    
    // Фокус на первое поле
    setTimeout(() => {
        const nameInput = document.getElementById('customer-name');
        if (nameInput) {
            nameInput.focus();
        }
    }, 300);
    
    // Блокируем скролл страницы
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Модальное окно открыто для продукта:', product.name);
}

/**
 * Закрытие модального окна
 */
function closePaymentModal() {
    console.log('❌ Закрываем модальное окно');
    
    if (!paymentModal) {
        return;
    }
    
    // Скрываем модальное окно
    paymentModal.classList.add('hidden');
    
    // Восстанавливаем скролл страницы
    document.body.style.overflow = '';
    
    // Сбрасываем состояние загрузки
    setFormLoading(false);
    
    // Очищаем текущий продукт
    currentProductId = null;
    
    console.log('✅ Модальное окно закрыто');
}

/**
 * Сброс формы оплаты
 */
function resetPaymentForm() {
    const form = document.getElementById('payment-form');
    if (form) {
        form.reset();
        
        // Убираем состояния ошибок
        const inputs = form.querySelectorAll('.payment-form-input');
        inputs.forEach(input => {
            input.classList.remove('error');
        });
    }
    
    // Сбрасываем состояние двухэтапного процесса
    const customerSection = document.getElementById('customer-data-section');
    const iframeSection = document.getElementById('payment-iframe-section');
    const iframe = document.getElementById('payment-iframe');
    const customerSecurity = document.querySelector('.customer-screen-security');
    
    if (customerSection && iframeSection) {
        customerSection.classList.remove('hidden');
        iframeSection.classList.add('hidden');
        
        // Показываем блок безопасности первого экрана
        if (customerSecurity) {
            customerSecurity.classList.remove('hidden');
        }
        
        // Очищаем iframe
        if (iframe) {
            iframe.src = '';
            iframe.classList.add('hidden');
        }
    }
}

/**
 * Обработка отправки формы оплаты
 */
async function handlePaymentFormSubmit(event) {
    event.preventDefault();
    console.log('📝 Обработка формы оплаты');
    
    if (!currentProductId) {
        console.error('❌ Продукт не выбран');
        alert('Ошибка: Продукт не выбран');
        return;
    }
    
    // Получаем данные формы
    const formData = getFormData();
    
    // Валидация
    if (!validateFormData(formData)) {
        console.warn('⚠️ Данные формы не прошли валидацию');
        return;
    }
    
    // Показываем индикатор загрузки
    setFormLoading(true);
    
    try {
        // Переходим к экрану оплаты Т-банка
        showTBankPaymentScreen(currentProductId, formData);
        
    } catch (error) {
        console.error('❌ Ошибка при создании платежа:', error);
        alert(`Ошибка при создании платежа: ${error.message}`);
        setFormLoading(false);
    }
}

/**
 * Получение данных из формы
 */
function getFormData() {
    return {
        name: document.getElementById('customer-name')?.value?.trim() || '',
        phone: document.getElementById('customer-phone')?.value?.trim() || '',
        email: document.getElementById('customer-email')?.value?.trim() || ''
    };
}

/**
 * Валидация данных формы
 */
function validateFormData(data) {
    let isValid = true;
    
    // Проверка email
    const emailInput = document.getElementById('customer-email');
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError(emailInput, 'Введите корректный email');
        isValid = false;
    } else {
        clearFieldError(emailInput);
    }
    
    // Проверка телефона
    const phoneInput = document.getElementById('customer-phone');
    if (!data.phone || !isValidPhone(data.phone)) {
        showFieldError(phoneInput, 'Введите корректный телефон');
        isValid = false;
    } else {
        clearFieldError(phoneInput);
    }
    
    return isValid;
}

/**
 * Валидация email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Валидация телефона
 */
function isValidPhone(phone) {
    // Простая проверка на наличие цифр (минимум 10)
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
}

/**
 * Показать ошибку поля
 */
function showFieldError(input, message) {
    if (!input) return;
    
    input.classList.add('error');
    input.style.borderColor = '#ef4444';
    
    // Добавляем сообщение об ошибке
    let errorMsg = input.parentNode.querySelector('.error-message');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.style.cssText = 'color: #ef4444; font-size: 0.75rem; margin-top: 4px;';
        input.parentNode.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
}

/**
 * Очистить ошибку поля
 */
function clearFieldError(input) {
    if (!input) return;
    
    input.classList.remove('error');
    input.style.borderColor = '';
    
    const errorMsg = input.parentNode.querySelector('.error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

/**
 * Установка состояния загрузки формы
 */
function setFormLoading(loading) {
    const submitButton = document.getElementById('submit-payment');
    const cancelButton = document.querySelector('.payment-form-cancel');
    
    if (loading) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="payment-submit-icon">
                <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </span>
            Обработка...
        `;
        cancelButton.disabled = true;
    } else {
        submitButton.disabled = false;
        cancelButton.disabled = false;
        // Восстанавливаем оригинальный текст кнопки
        const product = productInfo[currentProductId];
        if (product) {
            submitButton.innerHTML = `
                <span class="payment-submit-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                </span>
                Оплатить ${product.price.toLocaleString()} ₽
            `;
        }
    }
}

/**
 * Создание тестового платежа и показ iframe
 */
async function createTestPayment(productId, customerData) {
    console.log('💰 Создаем тестовый платеж:', productId, customerData);
    
    const product = productInfo[productId];
    if (!product) {
        throw new Error('Продукт не найден');
    }
    
    // Подготавливаем данные для платежа
    const paymentData = {
        Amount: product.price * 100, // В копейках
        OrderId: 'test-order-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        Description: product.name,
        Email: customerData.email,
        Phone: customerData.phone,
        CustomerName: customerData.name || 'Покупатель',
        SuccessURL: window.location.origin + '/thankyou.html',
        FailURL: window.location.origin + '/fail.html'
    };
    
    console.log('📋 Данные платежа:', paymentData);
    
    try {
        // Отправляем запрос на создание платежа через существующую систему
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
        console.log('📨 Ответ сервера:', result);
        
        if (result.Success && result.PaymentURL) {
            console.log('✅ Платеж создан успешно:', result.PaymentURL);
            
            // Переходим к этапу оплаты в модальном окне
            showPaymentIframe(result.PaymentURL);
            
        } else {
            throw new Error(result.Message || result.Details || result.error || 'Неизвестная ошибка при создании платежа');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при создании платежа:', error);
        throw error;
    }
}

/**
 * Показать этап оплаты с iframe
 */
function showPaymentIframe(paymentURL) {
    console.log('💳 Показываем iframe оплаты:', paymentURL);
    
    // Обновляем заголовок модального окна
    const modalTitle = document.querySelector('.payment-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Оплата заказа';
    }
    
    // Скрываем форму данных клиента
    const customerSection = document.getElementById('customer-data-section');
    const iframeSection = document.getElementById('payment-iframe-section');
    
    if (customerSection && iframeSection) {
        customerSection.classList.add('hidden');
        iframeSection.classList.remove('hidden');
        
        // Показываем индикатор загрузки
        const loadingElement = document.getElementById('payment-iframe-loading');
        const iframe = document.getElementById('payment-iframe');
        
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        
        if (iframe) {
            iframe.classList.add('hidden');
            
            // Настраиваем iframe
            iframe.src = paymentURL;
            
            // Обработчик загрузки iframe
            iframe.onload = function() {
                console.log('✅ Iframe загружен');
                if (loadingElement) {
                    loadingElement.classList.add('hidden');
                }
                iframe.classList.remove('hidden');
            };
            
            // Обработчик ошибки загрузки
            iframe.onerror = function() {
                console.error('❌ Ошибка загрузки iframe');
                if (loadingElement) {
                    loadingElement.innerHTML = `
                        <div class="payment-error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 32px; height: 32px; color: #ef4444;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <span style="font-size: 16px; color: #ef4444; font-weight: 500;">Ошибка загрузки формы оплаты</span>
                            <button onclick="goBackToCustomerData()" style="margin-top: 12px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Попробовать снова</button>
                        </div>
                    `;
                }
            };
        }
        
        console.log('✅ Переключились на этап оплаты');
    }
}

/**
 * Вернуться к форме ввода данных
 */
function goBackToCustomerData() {
    console.log('⬅️ Возвращаемся к форме данных');
    
    // Восстанавливаем заголовок модального окна
    const modalTitle = document.querySelector('.payment-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Оформление заказа';
    }
    
    const customerSection = document.getElementById('customer-data-section');
    const iframeSection = document.getElementById('payment-iframe-section');
    const iframe = document.getElementById('payment-iframe');
    
    if (customerSection && iframeSection) {
        // Показываем форму данных
        iframeSection.classList.add('hidden');
        customerSection.classList.remove('hidden');
        
        // Очищаем iframe
        if (iframe) {
            iframe.src = '';
            iframe.classList.add('hidden');
        }
        
        // Сбрасываем состояние загрузки
        const loadingElement = document.getElementById('payment-iframe-loading');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
            loadingElement.innerHTML = `
                <div class="payment-loading-spinner">
                    <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </div>
                <div class="payment-loading-text">Подготавливаем форму оплаты...</div>
            `;
        }
        
        // Убираем состояние загрузки с кнопки
        setFormLoading(false);
        
        console.log('✅ Вернулись к форме данных');
    }
}

/**
 * Инициализация маски телефона
 */
/**
 * Показать экран оплаты Т-банка
 */
function showTBankPaymentScreen(productId, customerData) {
    console.log('🏦 Переход к экрану оплаты Т-банка');
    
    const product = productInfo[productId];
    if (!product) {
        console.error('❌ Продукт не найден:', productId);
        return;
    }
    
    // Скрываем секцию данных клиента
    const customerSection = document.getElementById('customer-data-section');
    const iframeSection = document.getElementById('payment-iframe-section');
    const customerSecurity = document.querySelector('.customer-screen-security');
    
    if (customerSection && iframeSection) {
        customerSection.classList.add('hidden');
        iframeSection.classList.remove('hidden');
        
        // Скрываем блок безопасности первого экрана
        if (customerSecurity) {
            customerSecurity.classList.add('hidden');
        }
        
        // Устанавливаем сумму в виджете
        const amountDisplay = document.getElementById('tbank-selected-amount');
        if (amountDisplay) {
            amountDisplay.textContent = `${product.price.toLocaleString()} ₽`;
        }
        
        // Фокус на поле номера карты
        setTimeout(() => {
            const cardInput = document.getElementById('tbank-card-number');
            if (cardInput) {
                cardInput.focus();
            }
        }, 300);
    }
    
    // Сбрасываем состояние загрузки
    setFormLoading(false);
    
    console.log('✅ Экран оплаты Т-банка показан');
}

/**
 * Переключение выпадающего списка суммы (пока заглушка)
 */
function toggleAmountDropdown() {
    console.log('💰 Клик по выбору суммы (функция не реализована)');
    // В реальной версии здесь был бы выпадающий список с вариантами сумм
}

/**
 * Переключение чекбокса квитанции
 */
function toggleReceiptCheckbox() {
    const checkbox = document.getElementById('tbank-receipt-checkbox');
    if (checkbox) {
        checkbox.classList.toggle('checked');
        console.log('📄 Чекбокс квитанции:', checkbox.classList.contains('checked') ? 'включен' : 'выключен');
    }
}

/**
 * Обработка оплаты через Т-банк
 */
function processTBankPayment() {
    console.log('💳 Обработка оплаты через Т-банк');
    
    const cardNumberInput = document.getElementById('tbank-card-number');
    const payButton = document.querySelector('.tbank-pay-button');
    
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
    payButton.classList.add('loading');
    payButton.textContent = 'Обработка...';
    payButton.disabled = true;
    
    console.log('💳 Данные для оплаты:', {
        product: currentProductId,
        amount: document.getElementById('tbank-selected-amount')?.textContent,
        cardType: cardType,
        cardMasked: cleanCardNumber.replace(/\d(?=\d{4})/g, '*'),
        needsReceipt: needsReceipt
    });
    
    // Симуляция обработки платежа с реалистичной задержкой
    setTimeout(() => {
        // Убираем индикатор загрузки
        payButton.classList.remove('loading');
        payButton.textContent = 'Оплатить';
        payButton.disabled = false;
        
        // Показываем результат
        showPaymentSuccess();
    }, 2000);
}

/**
 * Валидация номера карты
 */
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
    
    if (!expectedLengths[cardType].includes(cardNumber.length)) {
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

/**
 * Алгоритм Луна для проверки номера карты
 */
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
    
    return (sum % 10) === 0;
}

/**
 * Получение красивого названия типа карты
 */
function getCardTypeName(cardType) {
    const names = {
        visa: 'Visa',
        mastercard: 'MasterCard',
        mir: 'МИР',
        amex: 'American Express',
        discover: 'Discover',
        jcb: 'JCB'
    };
    return names[cardType] || 'Неизвестная';
}

/**
 * Показ ошибки платежа
 */
function showPaymentError(message) {
    // Создаем уведомление об ошибке
    const notification = document.createElement('div');
    notification.className = 'payment-notification payment-error';
    notification.innerHTML = `
        <div class="payment-notification-content">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="payment-notification-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Добавляем стили для уведомления
    if (!document.querySelector('.payment-notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'payment-notification-styles';
        styles.textContent = `
            .payment-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            .payment-error {
                background: #ff453a;
                color: white;
            }
            .payment-success {
                background: #34c759;
                color: white;
            }
            .payment-notification.show {
                transform: translateX(0);
            }
            .payment-notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .payment-notification-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Убираем уведомление через 4 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * Показ успешного платежа
 */
function showPaymentSuccess() {
    const notification = document.createElement('div');
    notification.className = 'payment-notification payment-success';
    notification.innerHTML = `
        <div class="payment-notification-content">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="payment-notification-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Платеж успешно обработан!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Показываем подробную информацию
    setTimeout(() => {
        alert('🎉 Демо-платеж успешно обработан!\n\n✅ Это демо-версия интерфейса T-Bank\n💳 В реальном приложении здесь происходил бы настоящий платеж\n📧 Инструкции отправлены на ваш email\n\nСпасибо за покупку!');
        closePaymentModal();
    }, 1500);
    
    // Убираем уведомление
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 6000);
}

function initPhoneMask() {
    const phoneInput = document.getElementById('customer-phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value[0] === '8') {
                value = '7' + value.slice(1);
            } else if (value[0] !== '7') {
                value = '7' + value;
            }
        }
        
        if (value.length <= 11) {
            let formatted = '+7';
            if (value.length > 1) {
                formatted += ' (' + value.slice(1, 4);
            }
            if (value.length > 4) {
                formatted += ') ' + value.slice(4, 7);
            }
            if (value.length > 7) {
                formatted += '-' + value.slice(7, 9);
            }
            if (value.length > 9) {
                formatted += '-' + value.slice(9, 11);
            }
            
            e.target.value = formatted;
        }
    });
    
    phoneInput.addEventListener('keydown', function(e) {
        // Разрешаем backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Разрешаем home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        // Разрешаем только цифры
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
}

// Закрытие модального окна по клавише Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && paymentModal && !paymentModal.classList.contains('hidden')) {
        closePaymentModal();
    }
});

console.log('📄 payment-modal.js загружен');

/**
 * Форматирование номера карты с определением типа
 */
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    let formattedValue = '';
    let cardType = detectCardType(value);
    
    // Форматируем по группам цифр в зависимости от типа карты
    if (cardType === 'amex') {
        // American Express: 4-6-5
        formattedValue = value.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
        if (value.length <= 10) {
            formattedValue = value.replace(/(\d{4})(\d{0,6})/, '$1 $2');
        }
    } else {
        // Visa, MasterCard, Мир: 4-4-4-4
        formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    input.value = formattedValue;
    
    // Обновляем визуальные индикаторы типа карты
    updateCardTypeIndicator(cardType, value.length);
}

/**
 * Определение типа карты по номеру
 */
function detectCardType(number) {
    const patterns = {
        visa: /^4[0-9]{0,15}$/,
        mastercard: /^5[1-5][0-9]{0,14}$|^2[2-7][0-9]{0,14}$/,
        mir: /^220[0-4][0-9]{0,12}$/,
        amex: /^3[47][0-9]{0,13}$/,
        discover: /^6(?:011|5[0-9]{2})[0-9]{0,12}$/,
        jcb: /^(?:2131|1800|35\d{3})\d{0,11}$/
    };
    
    for (let type in patterns) {
        if (patterns[type].test(number)) {
            return type;
        }
    }
    return 'unknown';
}

/**
 * Обновление индикатора типа карты
 */
function updateCardTypeIndicator(cardType, length) {
    const cardInput = document.getElementById('tbank-card-number');
    if (!cardInput) return;
    
    // Убираем все предыдущие классы типов карт
    cardInput.classList.remove('card-visa', 'card-mastercard', 'card-mir', 'card-amex', 'card-valid', 'card-invalid');
    
    // Добавляем класс для текущего типа карты
    if (cardType !== 'unknown') {
        cardInput.classList.add(`card-${cardType}`);
    }
    
    // Проверяем валидность длины
    const expectedLengths = {
        visa: [13, 16, 19],
        mastercard: [16],
        mir: [16, 17, 18, 19],
        amex: [15],
        discover: [16],
        jcb: [16]
    };
    
    if (expectedLengths[cardType] && expectedLengths[cardType].includes(length)) {
        cardInput.classList.add('card-valid');
    } else if (length > 0) {
        cardInput.classList.add('card-invalid');
    }
    
    // Обновляем placeholder в зависимости от типа карты
    updateCardPlaceholder(cardType);
}

/**
 * Обновление placeholder в зависимости от типа карты
 */
function updateCardPlaceholder(cardType) {
    const cardInput = document.getElementById('tbank-card-number');
    if (!cardInput) return;
    
    const placeholders = {
        visa: '4111 1111 1111 1111',
        mastercard: '5555 5555 5555 4444',
        mir: '2204 1111 1111 1111',
        amex: '3782 822463 10005',
        unknown: 'Номер карты'
    };
    
    cardInput.placeholder = placeholders[cardType] || placeholders.unknown;
}

/**
 * Вернуться к данным клиента (если понадобится)
 */
function goBackToCustomerData() {
    console.log('⬅️ Возврат к данным клиента');
    
    const customerSection = document.getElementById('customer-data-section');
    const iframeSection = document.getElementById('payment-iframe-section');
    const customerSecurity = document.querySelector('.customer-screen-security');
    
    if (customerSection && iframeSection) {
        customerSection.classList.remove('hidden');
        iframeSection.classList.add('hidden');
        
        // Показываем блок безопасности первого экрана
        if (customerSecurity) {
            customerSecurity.classList.remove('hidden');
        }
    }
} 