(function () {
    'use strict';

    let originalItems = [];
    let observer = null;

    function startPlugin() {
        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            const title = $('.head__title').text().toLowerCase();

            const isBookmarks =
                title.includes('закладки') ||
                title.includes('избранное');

            const isCatalog =
                title.includes('фильмы') ||
                title.includes('сериалы');

            if (isBookmarks || isCatalog) {
                addSortButton();
            } else {
                originalItems = [];
                $('#lampa-sort-btn').remove();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function addSortButton() {
        const actions = $('.head__actions');
        if (!actions.length || $('#lampa-sort-btn').length) return;

        const btn = $(`
            <div id="lampa-sort-btn"
                 class="head__action selector"
                 style="margin-right: 15px; padding: 6px 12px; background: rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer; color: #fff; font-size: 14px; font-weight: 500;">
                 Сортировка
            </div>
        `);

        btn.on('click', () => showSortMenu());

        const searchBtn = actions.find('.open--search').first();
        if (searchBtn.length) btn.insertBefore(searchBtn);
        else actions.prepend(btn);
    }

    function showSortMenu() {
        const items = [
            { title: 'По дате добавления', type: 'default' },
            { title: 'По алфавиту (А-Я)', type: 'title' },
            { title: 'По рейтингу', type: 'vote' },
            { title: 'По году', type: 'year' }
        ];

        Lampa.Select.show({
            title: 'Сортировка',
            items,
            onSelect: item => sortDOM(item.type)
        });
    }

    function findContainer() {
        const selectors = [
            '.mapping--grid',        // ✔ CF/MX каталоги
            '.favorites__content',
            '.content__body',
            '.items-line',
            '.items-container',
            '.scroll__content',
            '.layer__body'
        ];

        for (const sel of selectors) {
            const c = $(sel).has('.card');
            if (c.length) return c.first();
        }

        return null;
    }

    function sortDOM(type) {
        const container = findContainer();

        if (!container) {
            console.log('Lampa Sort: контейнер карточек не найден');
            return;
        }

        let cards = container.find('.card').get();

        if (!originalItems.length) {
            originalItems = cards.slice();
        }

        if (type === 'default') {
            cards = originalItems.slice();
        } else {
            cards.sort((a, b) => {
                const $a = $(a);
                const $b = $(b);

                if (type === 'title') {
                    const tA = $a.find('.card__title').text().trim().toLowerCase();
                    const tB = $b.find('.card__title').text().trim().toLowerCase();
                    return tA.localeCompare(tB);
                }

                if (type === 'year') {
                    const yA = parseInt($a.find('.card__age').text()) || 0;
                    const yB = parseInt($b.find('.card__age').text()) || 0;
                    return yB - yA;
                }

                if (type === 'vote') {
                    const vA = parseFloat($a.find('.card__vote').text().replace(',', '.')) || 0;
                    const vB = parseFloat($b.find('.card__vote').text().replace(',', '.')) || 0;
                    return vB - vA;
                }

                return 0;
            });
        }

        cards.forEach(item => container.append(item));
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', e => {
        if (e.type === 'ready') startPlugin();
    });
})();
