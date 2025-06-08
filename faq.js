// FAQ аккордеон для Tailwind CSS

document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFaq(this);
        });
    });
});

function toggleFaq(button) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const answer = button.nextElementSibling;
    
    // Закрываем все остальные ответы
    document.querySelectorAll('.faq-question').forEach(q => {
        if (q !== button) {
            q.setAttribute('aria-expanded', 'false');
            q.nextElementSibling.classList.remove('open');
        }
    });
    
    // Переключаем состояние текущего элемента
    button.setAttribute('aria-expanded', !isExpanded);
    
    if (!isExpanded) {
        answer.classList.add('open');
    } else {
        answer.classList.remove('open');
    }
}

// Современная функция FAQ для нового дизайна
function toggleModernFaq(button) {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    const content = button.nextElementSibling;
    const icon = button.querySelector('.faq-icon');
    
    // Закрываем все остальные ответы
    document.querySelectorAll('[onclick*="toggleModernFaq"]').forEach(q => {
        if (q !== button) {
            q.setAttribute('aria-expanded', 'false');
            const otherContent = q.nextElementSibling;
            const otherIcon = q.querySelector('.faq-icon');
            
            otherContent.style.maxHeight = '0px';
            if (otherIcon) {
                otherIcon.style.transform = 'rotate(0deg)';
            }
        }
    });
    
    // Переключаем состояние текущего элемента
    button.setAttribute('aria-expanded', !isExpanded);
    
    if (!isExpanded) {
        // Открываем
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) {
            icon.style.transform = 'rotate(180deg)';
        }
    } else {
        // Закрываем
        content.style.maxHeight = '0px';
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }
}
