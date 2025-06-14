/**
 * Render Serverless Function для отправки данных в n8n
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

    // Поддерживаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('📤 Render функция: отправляем данные в n8n...');
        
        // Парсим данные из запроса
        const orderData = req.body;
        
        console.log('📋 Данные заказа для n8n:', orderData);
        
        // Отправляем данные в n8n webhook
        const n8nResponse = await fetch('https://flow8n.ru/webhook/order-created', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        console.log(`📨 Ответ от n8n: ${n8nResponse.status} ${n8nResponse.statusText}`);

        // Возвращаем успешный ответ
        return res.status(200).json({ 
            success: true, 
            n8nStatus: n8nResponse.status,
            message: 'Данные успешно отправлены в n8n'
        });

    } catch (error) {
        console.error('❌ Ошибка в Render функции send-to-n8n:', error);
        
        // Возвращаем ошибку
        return res.status(500).json({ 
            success: false,
            error: error.message,
            message: 'Ошибка при отправке данных в n8n'
        });
    }
} 