(function () {
    'use strict';

    function startPlugin() {
        // Ждем полной загрузки интерфейса Lampa
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                addSortButton();
            }
        });
    }

    function addSortButton() {
        // Создаем кнопку для сортировки
        var button = $('<div class="bookmarks-sort-btn selector" style="margin: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px; text-align: center; cursor: pointer;">Сортировать по алфавиту</div>');

        // Обработчик нажатия на кнопку
        button.on('hover:enter', function () {
            var account = Lampa.Account;
            if (account && account.bookmarks) {
                // Сортируем массив избранного по названию (title или name)
                account.bookmarks.sort(function (a, b) {
                    var titleA = (a.title || a.name || '').toLowerCase();
                    var titleB = (b.title || b.name || '').toLowerCase();
                    return titleA.localeCompare(titleB, 'ru');
                });

                // Сохраняем отсортированный список в локальное хранилище Lampa
                Lampa.Storage.set('bookmarks', account.bookmarks);
                
                // Уведомление об успешной сортировке
                Lampa.Noty.show('Избранное отсортировано! Перезагрузите раздел.');
                
                // Обновляем текущую страницу, если пользователь находится в закладках
                if (Lampa.Activity.active().component === 'bookmarks') {
                    Lampa.Activity.active().page.reload();
                }
            } else {
                Lampa.Noty.show('Список избранного пуст или недоступен.');
            }
        });

        // Внедряем кнопку в начало контейнера закладок, когда этот компонент открывается
        Lampa.Component.add('bookmarks', function (object) {
            var origRender = this.render;
            this.render = function () {
                var view = origRender.currentTarget ? origRender : origRender();
                view.prepend(button);
                return view;
            };
        });
    }

    // Запуск плагина после проверки окружения
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();
