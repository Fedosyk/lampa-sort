(function () {
    'use strict';

    function LampaFavoritesSort() {
        var item = {
            id: 'favorites_sort',
            title: 'Сортировка',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><polyline points="3 17 6 20 9 17"></polyline><line x1="6" y1="20" x2="6" y2="4"></line></svg>',
            description: 'Сортировка закладок по названию и дате добавления'
        };

        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                // Добавляем пункт в меню закладок
                Lampa.Storage.set('favorites_sort_type', Lampa.Storage.get('favorites_sort_type', 'date_desc'));
            }
        });
        
        // Функция сортировки массива данных
        function sortFavorites(type) {
            var card = Lampa.Storage.get('favorites', '[]');
            if (!card.length) return;

            if (type === 'name_asc') {
                card.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
            } else if (type === 'name_desc') {
                card.sort((a, b) => (b.title || b.name || '').localeCompare(a.title || a.name || ''));
            } else if (type === 'date_asc') {
                card.sort((a, b) => (a.fav_time || 0) - (b.fav_time || 0));
            } else if (type === 'date_desc') {
                card.sort((a, b) => (b.fav_time || 0) - (a.fav_time || 0));
            }

            Lampa.Storage.set('favorites', card);
            Lampa.Activity.render(); // Обновляем экран
        }

        // Показ меню выбора сортировки
        window.plugin_favorites_sort_open = function() {
            var current = Lampa.Storage.get('favorites_sort_type', 'date_desc');
            Lampa.Select.show({
                title: 'Сортировка избранного',
                items: [
                    {title: 'По названию (А-Я)', type: 'name_asc'},
                    {title: 'По названию (Я-А)', type: 'name_desc'},
                    {title: 'Сначала старые', type: 'date_asc'},
                    {title: 'Сначала новые', type: 'date_desc'}
                ],
                onSelect: function(a) {
                    Lampa.Storage.set('favorites_sort_type', a.type);
                    sortFavorites(a.type);
                },
                onBack: function() {
                    Lampa.Controller.toggle('content');
                }
            });
        };
    }

    if (window.appready) LampaFavoritesSort();
    else Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') LampaFavoritesSort();
    });

})();
