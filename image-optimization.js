/**
 * Скрипт для оптимизации загрузки изображений
 * Добавляет ленивую загрузку для изображений, которые находятся вне области видимости
 */

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем поддержку IntersectionObserver
    if ('IntersectionObserver' in window) {
        // Выбираем все изображения с атрибутом data-src
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        // Создаем новый IntersectionObserver
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // Если элемент виден
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Заменяем src на data-src
                    img.src = img.dataset.src;
                    
                    // Если есть srcset, тоже заменяем
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                    }
                    
                    // Удаляем класс lazy
                    img.classList.remove('lazy');
                    
                    // Прекращаем наблюдение за этим изображением
                    imageObserver.unobserve(img);
                }
            });
        });
        
        // Начинаем наблюдение за каждым изображением
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Запасной вариант для браузеров без поддержки IntersectionObserver
        // Загружаем все изображения сразу
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
            }
            img.classList.remove('lazy');
        });
    }
    
    // Добавляем обработчик для адаптивных изображений в picture элементах
    const pictures = document.querySelectorAll('picture');
    pictures.forEach(picture => {
        const img = picture.querySelector('img');
        const sources = picture.querySelectorAll('source');
        
        // Добавляем обработчик события загрузки для изображения
        img.addEventListener('load', function() {
            // Добавляем класс loaded для применения плавного появления
            img.classList.add('loaded');
        });
    });
});

// Функция для предзагрузки критических изображений
function preloadCriticalImages() {
    const criticalImages = [
        'alexandra.jpg',
        'logo.png'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Вызываем функцию предзагрузки после загрузки страницы
window.addEventListener('load', preloadCriticalImages);
