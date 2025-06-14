import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Импортируем serverless функции
import createPayment from './api/create-payment.js';
import sendToN8n from './api/send-to-n8n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Статические файлы
app.use(express.static(__dirname));

// API routes для serverless функций
app.use('/api/create-payment', (req, res) => createPayment(req, res));
app.use('/api/send-to-n8n', (req, res) => sendToN8n(req, res));

// Основные HTML страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/thankyou.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'thankyou.html'));
});

app.get('/fail.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'fail.html'));
});

app.get('/test-payment.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-payment.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Сайт доступен по адресу: http://localhost:${PORT}`);
    console.log(`🔧 API endpoints:`);
    console.log(`   - POST /api/create-payment`);
    console.log(`   - POST /api/send-to-n8n`);
}); 