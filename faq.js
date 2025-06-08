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
