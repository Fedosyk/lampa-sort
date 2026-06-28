// SORT BUTTON FOR FAVORITES (CF.LAMPA.MX)

// сортировка по названию
function sortItems() {
    const container = document.querySelector('.items-line');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.card'))
        .filter(el => !el.classList.contains('sort-button'));

    items.sort((a, b) => {
        const nameA = (a.querySelector('.card__title')?.innerText || '').toLowerCase();
        const nameB = (b.querySelector('.card__title')?.innerText || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });

    items.forEach(item => container.appendChild(item));

    const focusables = container.querySelectorAll('.focusable');
    focusables.forEach((el, i) => {
        el.setAttribute('data-index', i);
    });
}

// кнопка как карточка
function createSortButton() {
    const button = document.createElement('div');

    button.classList.add('card', 'focusable', 'sort-button');
    button.setAttribute('focusable', 'true');
    button.setAttribute('tabindex', '0');
    button.setAttribute('data-index', '0');

    button.style.width = '160px';
    button.style.height = '240px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.background = 'rgba(255,255,255,0.1)';
    button.style.borderRadius = '8px';
    button.style.marginRight = '10px';
    button.style.fontSize = '20px';
    button.style.textAlign = 'center';

    button.innerText = 'Сортировать';

    button.addEventListener('click', () => {
        sortItems();
    });

    return button;
}

// вставка кнопки
function injectSortButton() {
    const container = document.querySelector('.items-line');
    if (!container) return;

    if (container.querySelector('.sort-button')) return;

    const btn = createSortButton();
    container.prepend(btn);

    const items = container.querySelectorAll('.focusable');
    items.forEach((el, i) => {
        el.setAttribute('data-index', i);
    });
}

// запуск
setTimeout(injectSortButton, 800);
