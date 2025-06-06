/**
 * Netlify Function для создания платежей Т-банка
 * Обрабатывает подпись Token на backend
 * ESM версия для современных Netlify Functions
 */

import crypto from 'crypto';

// Конфигурация терминала
const TERMINAL_KEY = 'TinkoffBankTest';
const TERMINAL_PASSWORD = 'TinkoffBankTest'; // DEMO пароль для тестового терминала

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
 * Netlify Function handler (ESM export)
 */
export default async (request, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new Response('', {
            status: 200,
            headers
        });
    }
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Метод GET не поддерживается' }), {
            status: 405,
            headers
        });
    }
    
    try {
        const body = await request.json();
        console.log('📋 Received payment request:', body);
        
        // Валидация обязательных полей
        if (!body.Amount || !body.OrderId || !body.Description) {
            return new Response(JSON.stringify({ 
                error: 'Missing required fields: Amount, OrderId, Description' 
            }), {
                status: 400,
                headers
            });
        }
        
        // Формируем параметры для API Т-банка
        const initParams = {
            TerminalKey: TERMINAL_KEY,
            Amount: body.Amount,
            OrderId: body.OrderId,
            Description: body.Description,
            Language: 'ru',
            PayType: 'O', // Одностадийная оплата
            SuccessURL: body.SuccessURL || 'https://siteki.netlify.app/thankyou.html',
            FailURL: body.FailURL || 'https://siteki.netlify.app/fail.html',
            DATA: {
                connection_type: 'Widget',
                Email: body.Email || 'test@example.com',
                Phone: body.Phone || '+79999999999'
            },
            Receipt: {
                EmailCompany: 'info@siteki.netlify.app',
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
        
        return new Response(JSON.stringify(result), {
            status: 200,
            headers
        });
        
    } catch (error) {
        console.error('❌ Backend error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            details: error.message 
        }), {
            status: 500,
            headers
        });
    }
}; 