/*
    Плагин для Lampa TV - Сортировка Избранного
    Автор: Gemini
    Версия: 1.1 (Исправлена проблема с фокусом на Android TV)
*/

(function () {
    'use strict';

    // Вспомогательная функция для проверки, какая активность Lampa активна
    // и является ли она страницей "Избранное"
    function isFavoritePage(object) {
        // Проверяем, существует ли объект и его свойство 'router' равно 'favorites'
        return object && object.router === 'favorites';
    }

    // Текущий выбранный метод сортировки. По умолчанию - по дате добавления.
    let currentSortMethod = 'added_date';

    // Варианты сортировки, которые будут показаны в меню Lampa.Select.show()
    const sortOptions = [
        { title: 'По дате добавления', value: 'added_date' },
        { title: 'По дате выхода', value: 'release_date' },
        { title: 'По рейтингу', value: 'rating' },
        { title: 'По названию (А-Я)', value: 'alphabetical' }
    ];

    // Добавляем шаблон для кнопки сортировки
    Lampa.Template.add('sort_button_template', `
        <div class="card selector focusable sort-plugin-button">
            <div class="card__title">Сортировать</div>
        </div>
    `);

    let currentComponent = null; // Ссылка на текущий компонент Lampa, управляющий страницей избранного.
    let originalFavoritesData = []; // Оригинальные данные избранного.
    let sortedFavoritesData = []; // Отсортированные данные избранного.

    // --- Функции сортировки ---

    function sortByReleaseDate(a, b) {
        const dateA = a.first_air_date || a.release_date || '';
        const dateB = b.first_air_date || b.release_date || '';
        return new Date(dateB) - new Date(dateA);
    }

    function sortByRating(a, b) {
        const ratingA = a.vote_average || 0;
        const ratingB = b.vote_average || 0;
        return ratingB - ratingA;
    }

    function sortByAlphabetical(a, b) {
        const nameA = (a.title || a.name || '').toLowerCase();
        const nameB = (b.title || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    }

    function sortByAddedDate(a, b) {
        const indexA = originalFavoritesData.indexOf(a);
        const indexB = originalFavoritesData.indexOf(b);
        return indexA - indexB;
    }

    // Главная функция для выполнения сортировки
    function performSort(items, method) {
        let sortedItems = [...items];

        switch (method) {
            case 'release_date':
                sortedItems.sort(sortByReleaseDate);
                break;
            case 'rating':
                sortedItems.sort(sortByRating);
                break;
            case 'alphabetical':
                sortedItems.sort(sortByAlphabetical);
                break;
            case 'added_date':
            default:
                sortedItems = [...originalFavoritesData]; // Возвращаем к исходному порядку
                break;
        }
        return sortedItems;
    }

    // Функция для обновления интерфейса Lampa после сортировки
    function updateLampaUI(itemsToDisplay) {
        if (!currentComponent || !currentComponent.activity || !currentComponent.activity.interaction) {
            console.error('Sort Plugin: Lampa component or its interaction is not available for UI update.');
            return;
        }

        const navCollection = currentComponent.activity.interaction.collection;

        // --- ИСПРАВЛЕНИЕ: Очищаем коллекцию полностью перед добавлением новых элементов ---
        navCollection.list = [];
        navCollection.elements = [];

        // --- ИСПРАВЛЕНИЕ: Добавляем нашу кнопку в коллекцию перед другими элементами ---
        const sortButtonHtmlElement = currentComponent.body.find('.sort-plugin-button')[0];
        if (sortButtonHtmlElement) {
            navCollection.add(sortButtonHtmlElement);
        }

        // Добавляем отсортированные элементы
        itemsToDisplay.forEach(item => {
            // Убедитесь, что item.card_element - это реальный DOM-элемент
            // Lampa ожидает, что в `item.card_element` будет DOM-элемент карточки.
            if (item.card_element) {
                navCollection.add(item.card_element);
            }
        });

        // "Перестраиваем" коллекцию Lampa
        navCollection.merge();
        // Передаем обновленные элементы в Lampa для отображения
        currentComponent.update(itemsToDisplay);
        console.log('Sort Plugin: Lampa UI updated with sorted items.');
    }


    // Слушаем события Lampa
    Lampa.Listener.follow('full', function (event) {
        // Проверяем, что это наш "Избранное" компонент
        if (isFavoritePage(event.link.object)) {
            if (event.type === 'start') {
                console.log('Sort Plugin: Favorite page started loading.');
                currentComponent = event.link;
                // Сохраняем исходные данные при загрузке страницы.
                originalFavoritesData = Array.isArray(event.link.items) ? [...event.link.items] : [];
                sortedFavoritesData = [...originalFavoritesData]; // По умолчанию, отсортированные данные равны исходным

            } else if (event.type === 'build') {
                console.log('Sort Plugin: Favorite page built. Attempting to inject sort button.');

                const sortButtonEl = event.body.find('.sort-plugin-button');

                // Если кнопки еще нет, создаем и добавляем ее
                if (!sortButtonEl.length) {
                    const sortButton = Lampa.Template.get('sort_button_template');

                    sortButton.css({
                        width: '160px',
                        height: '240px',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        background: 'rgba(255,255,255,0.1)',
                        'border-radius': '8px',
                        'margin-right': '10px',
                        'font-size': '20px',
                        'text-align': 'center'
                    });

                    event.body.prepend(sortButton); // Добавляем в DOM

                    // --- ИСПРАВЛЕНИЕ: Добавляем обработчик события после добавления в DOM ---
                    sortButton.on('hover:enter', function() {
                        showSortMenu();
                    });

                    // Поскольку Lampa.Controller.collectionSet/merge могут вызываться несколько раз,
                    // лучшим местом для регистрации нашей кнопки является функция updateLampaUI
                    // Там мы гарантируем, что кнопка всегда будет первой в коллекции.
                    console.log('Sort Plugin: Sort button injected into DOM. Listener added.');

                } else {
                    console.log('Sort Plugin: Sort button already exists in DOM.');
                    // Если кнопка уже есть, убедимся, что на ней есть слушатель
                    event.body.find('.sort-plugin-button').off('hover:enter').on('hover:enter', function() {
                        showSortMenu();
                    });
                }

                // --- ИСПРАВЛЕНИЕ: Обновляем UI после build-фазы, чтобы наша кнопка всегда регистрировалась ---
                // Вызываем updateLampaUI с текущим порядком, чтобы коллекция Lampa обновилась.
                // Это гарантирует, что наша кнопка будет зарегистрирована в Lampa Controller.
                updateLampaUI(sortedFavoritesData);
            }
        }
    });

    // Функция для показа меню сортировки
    function showSortMenu() {
        // Чтобы не дублировать код, если Lampa.Select.show() уже открыто
        if (Lampa.Select && Lampa.Select.has()) {
            console.log('Sort Plugin: Select menu already open, ignoring.');
            return;
        }

        console.log('Sort Plugin: Showing sort menu.');

        Lampa.Select.show({
            title: 'Выберите тип сортировки',
            items: sortOptions,
            onSelect: function (selected) {
                currentSortMethod = selected.value;
                console.log('Sort Plugin: Selected sort method:', currentSortMethod);

                // Сортируем данные и обновляем UI
                sortedFavoritesData = performSort(originalFavoritesData, currentSortMethod);
                updateLampaUI(sortedFavoritesData);
            }
        });
    }

})();
