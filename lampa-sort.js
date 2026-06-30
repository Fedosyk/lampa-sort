(function () {
    'use strict';

    function startPlugin() {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                addSortButton();
            }
        });
    }

    function addSortButton() {
        // Создаем кнопку для сортировки по алфавиту
        var button = $('<div class="bookmarks-sort-btn selector" style="margin: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px; text-align: center; cursor: pointer;">Сортировать по алфавиту</div>');

        button.on('hover:enter', function () {
            // Получаем список закладок через официальный метод Lampa
            // Обычно категория называется 'card', где лежат фильмы/сериалы
            var favoriteList = Lampa.Favorite.get({type: 'card'});

            if (favoriteList && favoriteList.length > 0) {
                // 1. Сортируем массив по названию
                favoriteList.sort(function (a, b) {
                    var titleA = (a.title || a.name || '').toLowerCase();
                    var titleB = (b.title || b.name || '').toLowerCase();
                    return titleA.localeCompare(titleB, 'ru');
                });

                // 2. Очищаем старый список в памяти и базе данных
                Lampa.Favorite.clear({type: 'card'});

                // 3. Записываем отсортированные элементы обратно по одному
                favoriteList.forEach(function (item) {
                    Lampa.Favorite.add({
                        type: 'card',
                        item: item
                    });
                });

                Lampa.Noty.show('Список отсортирован!');

                // 4. Принудительно обновляем экран, если мы в закладках
                if (Lampa.Activity.active().component === 'bookmarks') {
                    Lampa.Activity.active().page.reload();
                }
            } else {
                Lampa.Noty.show('Список «Карточки» пуст.');
            }
        });

        // Добавляем кнопку в компонент закладок
        Lampa.Component.add('bookmarks', function (object) {
            var origRender = this.render;
            this.render = function () {
                var view = origRender.apply(this, arguments);
                if (view && typeof view.prepend === 'function') {
                    view.prepend(button);
                }
                return view;
            };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();
