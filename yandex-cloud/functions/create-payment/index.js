import crypto from 'crypto';

// Конфигурация терминала
const TERMINAL_KEY = '1749023114337';
const TERMINAL_PASSWORD = 'vawWil$gMyWOi0wk'; // Рабочий пароль

/**
 * Генерация Token (SHA-256 подписи) на backend
 */
function generateToken(params) {
    // Добавляем пароль к параметрам
    const allParams = { ...params, Password: TERMINAL_PASSWORD };
    
    // Удаляем Token если есть
    delete allParams.Token;
    
    // Сортируем по алфавиту
    const sortedKeys = Object.keys(allParams).sort();
    
    // Конкатенируем только значения согласно документации
    let concatenated = '';
    sortedKeys.forEach(key => {
        const value = allParams[key];
        if (typeof value === 'object') {
            // Пропускаем вложенные объекты (Receipt, DATA)
            return;
        }
        if (typeof value === 'boolean') {
            concatenated += value ? 'true' : 'false';
        } else {
            concatenated += String(value);
        }
    });
    
    console.log('🔐 Строка для подписи (DEMO):', concatenated);
    
    // Генерируем SHA-256 хеш
    return crypto.createHash('sha256').update(concatenated).digest('hex');
}

/**
 * Yandex Cloud Function handler
 */
export const handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    
    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Метод GET не поддерживается' })
        };
    }
    
    try {
        let body;
        if (typeof event.body === 'string') {
            body = JSON.parse(event.body);
        } else {
            body = event.body;
        }
        
        console.log('📋 Received payment request:', body);
        
        // Валидация обязательных полей
        if (!body.Amount || !body.OrderId || !body.Description) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields: Amount, OrderId, Description' 
                })
            };
        }
        
        // Формируем параметры для API Т-банка
        const initParams = {
            TerminalKey: TERMINAL_KEY,
            Amount: body.Amount,
            OrderId: body.OrderId,
            Description: body.Description,
            Language: 'ru',
            PayType: 'O', // Одностадийная оплата
            SuccessURL: body.SuccessURL || 'https://academycredit.ru/thankyou.html',
            FailURL: body.FailURL || 'https://academycredit.ru/fail.html',
            DATA: {
                connection_type: 'Widget'
            },
            Receipt: {
                Email: body.Email || 'test@example.com', // Email ВНУТРИ Receipt объекта
                Phone: body.Phone || '+79999999999', // Phone ВНУТРИ Receipt объекта
                EmailCompany: 'info@academycredit.ru',
                Taxation: 'usn_income',
                Items: [
                    {
                        Name: body.Description,
                        Price: body.Amount,
                        Quantity: 1,
                        Amount: body.Amount,
                        PaymentMethod: 'full_prepayment',
                        PaymentObject: 'service',
                        Tax: 'none'
                    }
                ]
            }
        };
        
        // Генерируем Token на backend
        const token = generateToken(initParams);
        initParams.Token = token;
        
        console.log('✅ Token generated on backend:', token.substring(0, 16) + '...');
        console.log('📤 Sending to T-Bank API:', initParams);
        
        // Отправляем запрос к API Т-банка
        const response = await fetch('https://securepay.tinkoff.ru/v2/Init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initParams)
        });
        
        const result = await response.json();
        console.log('📨 T-Bank API response:', result);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };
        
    } catch (error) {
        console.error('❌ Backend error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
}; 