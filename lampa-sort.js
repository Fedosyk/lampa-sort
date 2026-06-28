/*
    Плагин для Lampa TV - Сортировка Избранного
    Автор: Gemini
    Версия: 1.0
*/

(function () {
    'use strict';

    // Вспомогательная функция для проверки, какая страница активна
    function isFavoritePage(object) {
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
    // Этот HTML будет использоваться для создания кнопки.
    Lampa.Template.add('sort_button_template', `
        <div class="card selector focusable sort-button">
            <div class="card__title">Сортировать</div>
        </div>
    `);

    let currentComponent = null; // Ссылка на текущий компонент Lampa, управляющий страницей избранного.
    let originalFavoritesData = []; // Оригинальные данные избранного, до применения сортировки. Нужны, чтобы не терять порядок при каждой новой сортировке.
    let sortedFavoritesData = []; // Отсортированные данные избранного.

    // --- Функции сортировки ---

    // Сортировка по дате выхода (самые новые сначала)
    function sortByReleaseDate(a, b) {
        // Проверяем наличие дат выхода и преобразуем их в объекты Date для сравнения
        const dateA = a.first_air_date || a.release_date || '';
        const dateB = b.first_air_date || b.release_date || '';
        return new Date(dateB) - new Date(dateA); // Сортировка по убыванию (новее сначала)
    }

    // Сортировка по рейтингу (самый высокий сначала)
    function sortByRating(a, b) {
        // Проверяем наличие рейтинга и сравниваем.
        // Если рейтинга нет, считаем его 0 для сортировки.
        const ratingA = a.vote_average || 0;
        const ratingB = b.vote_average || 0;
        return ratingB - ratingA; // Сортировка по убыванию (выше рейтинг сначала)
    }

    // Сортировка по алфавиту (А-Я)
    function sortByAlphabetical(a, b) {
        // Проверяем наличие названий и сравниваем их по алфавиту.
        // localeCompare учитывает особенности языка.
        const nameA = (a.title || a.name || '').toLowerCase();
        const nameB = (b.title || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    }
    
    // Сортировка по дате добавления (самые новые сначала)
    // Lampa не предоставляет поле "дата добавления" напрямую в объектах карточек.
    // Поэтому мы сохраняем исходный порядок элементов как "дату добавления".
    function sortByAddedDate(a, b) {
        // originalFavoritesData сохраняет порядок добавления.
        // Мы ищем индекс элемента в исходном массиве.
        const indexA = originalFavoritesData.indexOf(a);
        const indexB = originalFavoritesData.indexOf(b);
        return indexA - indexB; // Сортировка по возрастанию индекса (порядок добавления)
    }

    // Главная функция для выполнения сортировки
    function performSort(items, method) {
        let sortedItems = [...items]; // Делаем копию, чтобы не менять оригинальный массив напрямую

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
            // 'added_date' это фактически исходный порядок, который мы сохранили в originalFavoritesData
            case 'added_date':
            default:
                // Если выбрана сортировка по дате добавления, нам нужен исходный порядок
                sortedItems = [...originalFavoritesData];
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

        // Очищаем текущие элементы коллекции в Lampa
        navCollection.list = []; 
        navCollection.elements = [];

        // Пересоздаем элементы коллекции, сначала добавляя нашу кнопку
        // (если она еще не была добавлена, то ее добавит build-фаза)
        const currentButton = currentComponent.body.find('.sort-button');
        if(currentButton.length && currentButton[0].offsetWidth > 10){ // Проверяем, что кнопка существует и видна
           navCollection.add(currentButton[0]);
        }
        
        // Добавляем отсортированные элементы
        itemsToDisplay.forEach(item => {
            // Убедитесь, что item.card_element - это реальный DOM-элемент
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
        if (isFavoritePage(event.link.object)) {
            if (event.type === 'start') {
                console.log('Sort Plugin: Favorite page started loading.');
                currentComponent = event.link;
                // Сохраняем исходные данные при загрузке страницы.
                originalFavoritesData = Array.isArray(event.link.items) ? [...event.link.items] : [];
                sortedFavoritesData = [...originalFavoritesData]; // По умолчанию, отсортированные данные равны исходным

            } else if (event.type === 'build') {
                console.log('Sort Plugin: Favorite page built. Ready to inject sort button.');

                const sortButtonEl = event.body.find('.sort-button');

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

                    event.body.prepend(sortButton);

                    if (currentComponent && currentComponent.activity && currentComponent.activity.interaction && currentComponent.activity.interaction.collection) {
                        // Важно добавить кнопку в коллекцию, чтобы она была навигационной.
                        // Мы добавляем её перед тем как Lampa добавит остальные элементы.
                        currentComponent.activity.interaction.collection.add(sortButton);
                        // merge() будет вызван в конце build-фазы Lampa, 
                        // поэтому здесь мы просто добавляем, а Lampa сама обновит коллекцию.
                        // Или можно вызвать merge() вручную, но это может повлиять на производительность.
                        console.log('Sort Plugin: Sort button injected and registered with Lampa navigation.');
                        
                        // Добавляем обработчик нажатия на кнопку "Сортировать"
                        sortButton.on('hover:enter', function() {
                            showSortMenu();
                        });
                    } else {
                        console.error('Sort Plugin: Failed to access Lampa navigation collection.');
                    }
                }
            }
        }
    });

    // Функция для показа меню сортировки
    function showSortMenu() {
        console.log('Sort Plugin: Showing sort menu.');

        Lampa.Select.show({
            title: 'Выберите тип сортировки',
            items: sortOptions,
            onSelect: function (selected) {
                currentSortMethod = selected.value;
                console.log('Sort Plugin: Selected sort method:', currentSortMethod);
                
                // --- НОВОЕ: Сортируем данные и обновляем UI ---
                sortedFavoritesData = performSort(originalFavoritesData, currentSortMethod);
                updateLampaUI(sortedFavoritesData);
            }
        });
    }

})();

