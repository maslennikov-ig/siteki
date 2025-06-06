// FAQ аккордеон — современная, адаптивная реализация

document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(btn => {
        btn.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            // Свернуть все
            faqQuestions.forEach(b => {
                b.setAttribute('aria-expanded', 'false');
                document.getElementById(b.getAttribute('aria-controls')).style.maxHeight = null;
            });
            // Если был закрыт — открыть
            if (!expanded) {
                this.setAttribute('aria-expanded', 'true');
                const answer = document.getElementById(this.getAttribute('aria-controls'));
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
    // Для плавного открытия — скрыть все по умолчанию
    document.querySelectorAll('.faq-answer').forEach(a => {
        a.style.overflow = 'hidden';
        a.style.transition = 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)';
        a.style.maxHeight = null;
    });
});
