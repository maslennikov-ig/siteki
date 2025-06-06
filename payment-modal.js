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
    
    // Заполняем информацию о продукте
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `${product.price.toLocaleString()} ₽`;
    document.getElementById('modal-product-description').textContent = product.description;
    
    // Обновляем текст кнопки
    const submitButton = document.getElementById('submit-payment');
    if (submitButton) {
        submitButton.innerHTML = `
            <div class="payment-submit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
            </div>
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
    
    if (customerSection && iframeSection) {
        customerSection.classList.remove('hidden');
        iframeSection.classList.add('hidden');
        
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
        // Создаем платеж
        await createTestPayment(currentProductId, formData);
        
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
        submitButton.classList.add('loading');
        submitButton.innerHTML = `
            <div class="payment-submit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
            </div>
            Создаем платеж...
        `;
        cancelButton.disabled = true;
    } else {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        cancelButton.disabled = false;
        // Восстанавливаем оригинальный текст кнопки
        const product = productInfo[currentProductId];
        if (product) {
            submitButton.innerHTML = `
                <div class="payment-submit-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                    </svg>
                </div>
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