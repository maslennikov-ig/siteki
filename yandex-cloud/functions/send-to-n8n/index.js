/**
 * Yandex Cloud Function для отправки данных в n8n
 */
export const handler = async (event, context) => {
    // Поддерживаем только POST запросы
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Обработка preflight запросов
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        console.log('📤 Yandex Cloud функция: отправляем данные в n8n...');
        
        // Парсим данные из запроса
        let orderData;
        if (typeof event.body === 'string') {
            orderData = JSON.parse(event.body);
        } else {
            orderData = event.body;
        }
        
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

        // Возвращаем успешный ответ с CORS заголовками
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                success: true, 
                n8nStatus: n8nResponse.status,
                message: 'Данные успешно отправлены в n8n'
            })
        };

    } catch (error) {
        console.error('❌ Ошибка в Yandex Cloud функции send-to-n8n:', error);
        
        // Возвращаем ошибку с CORS заголовками
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                success: false,
                error: error.message,
                message: 'Ошибка при отправке данных в n8n'
            })
        };
    }
}; 