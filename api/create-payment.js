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
 * Render Serverless Function handler
 */
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод GET не поддерживается' });
    }
    
    try {
        const body = req.body;
        
        console.log('📋 Received payment request:', body);
        
        // Валидация обязательных полей
        if (!body.Amount || !body.OrderId || !body.Description) {
            return res.status(400).json({ 
                error: 'Missing required fields: Amount, OrderId, Description' 
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
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('❌ Backend error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
} 