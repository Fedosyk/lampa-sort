(function () {
    'use strict';

    function startPlugin() {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                listenBookmarksActivity();
            }
        });
    }

    function listenBookmarksActivity() {
        // Создаем кнопку сортировки
        var button = $('<div class="bookmarks-sort-btn selector" style="margin: 20px; padding: 12px; background: rgba(255,255,255,0.08); border-radius: 6px; text-align: center; cursor: pointer; font-weight: bold;">Сортировать по алфавиту</div>');

        // Логика сортировки при клике
        button.on('hover:enter', function () {
            var favoriteList = Lampa.Favorite.get({type: 'card'});

            if (favoriteList && favoriteList.length > 0) {
                favoriteList.sort(function (a, b) {
                    var titleA = (a.title || a.name || '').toLowerCase();
                    var titleB = (b.title || b.name || '').toLowerCase();
                    return titleA.localeCompare(titleB, 'ru');
                });

                Lampa.Favorite.clear({type: 'card'});

                favoriteList.forEach(function (item) {
                    Lampa.Favorite.add({
                        type: 'card',
                        item: item
                    });
                });

                Lampa.Noty.show('Отсортировано! Обновляю страницу...');
                
                setTimeout(function() {
                    Lampa.Activity.active().page.reload();
                }, 500);
            } else {
                Lampa.Noty.show('Список пуст');
            }
        });

        // Слушаем переключение экранов в Lampa
        Lampa.Activity.listener.follow('open', function (e) {
            if (e.component === 'bookmarks') {
                // Ждем отрисовки интерфейса и добавляем кнопку на экран закладок
                setTimeout(function () {
                    var activity = Lampa.Activity.active();
                    if (activity && activity.activity && activity.activity.render) {
                        var container = activity.activity.render();
                        // Если кнопки еще нет на экране, добавляем ее в самое начало
                        if (container.find('.bookmarks-sort-btn').length === 0) {
                            container.prepend(button);
                            // Принудительно обновляем навигацию пульта, чтобы кнопка стала кликабельной
                            Lampa.Controller.init();
                        }
                    }
                }, 200);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();
