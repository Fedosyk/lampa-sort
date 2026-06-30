// ==UserScript==
// @name        Lampa - Favorites Sorting
// @description Adds sorting to Lampa Favorites
// @version     1.0.0
// @author      Lampa Community
// @icon        https://lampa.mx/favicon.ico
// @match       *://lampa.mx/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

(function () {
    'use strict';

    const {
        Lampa,
        Lampa: {
            Favorite,
            Storage,
            Listener,
            Activity,
            Controller,
            Select,
            Utils,
            Router,
            Platform
        }
    } = window;

    const SORT_MODES_STORAGE_KEY = 'favorite_sort_mode';

    // --- Helper Functions ---

    function getElementOffset(el) {
        var rect = el.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
        };
    }

    function sortArray(array, key, direction = 'asc') {
        if (!Array.isArray(array)) {
            return array;
        }

        const sortedArray = [...array].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            if (key === 'title') {
                valA = valA.localeCompare(valB);
                valB = valA; // Use localeCompare for alphabetical sort
            } else if (typeof valA === 'string' && typeof valB === 'string') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }

            if (valA < valB) {
                return direction === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return direction === 'asc' ? sortedArray : sortedArray.reverse();
    }

    function getSortState(category) {
        const savedState = Storage.get(SORT_MODES_STORAGE_KEY, '{}');
        const modes = JSON.parse(savedState);
        return modes[category] || { key: 'id', direction: 'desc' }; // Default sort by id desc
    }

    function saveSortState(category, state) {
        const savedState = Storage.get(SORT_MODES_STORAGE_KEY, '{}');
        const modes = JSON.parse(savedState);
        modes[category] = state;
        Storage.set(SORT_MODES_STORAGE_KEY, JSON.stringify(modes));
    }

    function getHumanReadableSortKey(key) {
        switch (key) {
            case 'release_date':
                return 'Дата выхода';
            case 'vote_average':
                return 'Рейтинг';
            case 'popularity':
                return 'Популярность';
            case 'title':
                return 'Название';
            default:
                return 'Дата добавления'; // Default for 'id' or unknown
        }
    }

    function getHumanReadableDirection(direction) {
        return direction === 'asc' ? '↑' : '↓';
    }

    function applySort(category, sortBy, direction) {
         // Get the correct array based on category.
         // Favorite.get() returns the actual card data for the category.
        let items = Favorite.get({ type: category });

        if (!items || items.length === 0) {
            return;
        }

        const defaultSortKey = 'id'; // Corresponds to date added

        // Determine the sort key
        let sortKey = sortBy;
        if (sortBy === 'date_added') {
            sortKey = defaultSortKey;
        }

        const sortedItems = sortArray(items, sortKey, direction);

        // Update the main favorite data (which is internally managed by Favorite module)
        // We need to directly manipulate the internal data structure that Favorite uses
        // This is a bit of a hack due to lack of direct API for reordering.
        // We'll find the internal array and replace it.

        const internalFavoriteData = Favorite.read(true); // Read internal data without triggering events
        internalFavoriteData.card = sortedItems; // Replace the main card list

        // Update specific category array if needed, THIS IS IMPORTANT
        // The Favorite.get(params) relies on the data[params.type] array for ordering.
        // So we need to update that array as well.
        internalFavoriteData[category] = sortedItems.map(item => item.id); // Update the ID list for the category

        // Save the modified data back to storage
        Storage.set('favorite', internalFavoriteData);

        // Trigger Lampa's internal refresh mechanism
        Favorite.read(); // This will send the 'state:changed' event and trigger Activity.replace()
    }


    // --- Main Plugin Logic ---

    // Monitor for changes that indicate the favorites screen is active
    // We use the router to detect when the 'favorite' or 'bookmarks' route is activated.
    Listener.follow('router', function (event) {
        if (event.name === 'favorite' || event.name === 'bookmarks') {
            // Use a short delay to ensure the Lampa UI is fully rendered
            setTimeout(addSortButton, 100);
        }
    });

    function addSortButton() {
        // Find the root element of the favorites list
        // This selector might need adjustment if Lampa's structure changes
        const favoritesRoot = document.querySelector('.content[data-name="content"] .scrollable');

        // Ensure we are on the actual favorites list and not a sub-category detail view
        // A simple check could be if the root element exists and has a specific class or attribute
        // For now, we assume that if we are here, it's a favorites list.

        if (!favoritesRoot) {
            // console.log("Sorting: Favorites root not found");
            return;
        }

        // Check if the sort button already exists to prevent duplicates
        if (favoritesRoot.querySelector('.lampa-sort-button')) {
            // console.log("Sorting: Sort button already exists");
            return;
        }

        // Create the sort button element
        const sortButton = document.createElement('div');
        sortButton.className = 'lampa-sort-button selector'; // Use 'selector' for focusability
        sortButton.innerHTML = `
            <div class="card">
                <div class="card__background"></div>
                <div class="card__layer">
                    <div class="card__layer-item card__layer-item--lg">
                        <div class="card__content">
                            <div class="card__icons">
                                <div class="card__icon icon--settings">
                                    <svg class="card__icon-svg" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7.99992 13.3333C10.8666 13.3333 13.3333 10.8666 13.3333 7.99992C13.3333 5.13325 10.8666 2.66659 7.99992 2.66659C5.13325 2.66659 2.66659 5.13325 2.66659 7.99992C2.66659 10.8666 5.13325 13.3333 7.99992 13.3333Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M11.1866 11.1866L13.7199 13.7199" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M5.48 11.8733L4.05333 13.3" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M11.8733 5.48L13.3 4.05333" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="card__title">Сортировка</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        favoritesRoot.prepend(sortButton);

        // Add event listener for selection/focus
        sortButton.addEventListener('hover:enter', () => {
            showSortMenu(sortButton);
        });

        // Ensure the button is focusable and works with navigation
        // Lampa's 'selector' class typically handles this for remote navigation.
    }

    function showSortMenu(buttonElement) {
        const currentUrl = window.location.href;
        const urlParams = new URL(currentUrl).searchParams;
        const currentCategory = urlParams.get('category') || 'favorite'; // Default to 'favorite' if no category in URL

        // Determine the current category based on the route.
        // This assumes that the route parameter for category is passed in the URL.
        // Adjust this logic if Lampa uses a different mechanism to pass route parameters.
        let category = 'favorite'; // Default category

        if (currentUrl.includes('/favorite?type=')) {
            category = currentUrl.split('type=')[1].split('&')[0];
        } else if (currentUrl.includes('/bookmarks')) {
            // For the main bookmarks screen, we might need a different way to identify categories
            // For now, let's assume 'favorite' for simplicity or handle specific known sub-routes
            category = 'favorite'; // Or a more specific identifier if needed
        }


        const currentState = getSortState(category);

        const menuItems = [
            {
                title: `Дата добавления ${getHumanReadableSortKey(currentState.key === 'id' ? 'id' : currentState.key)} ${currentState.key === 'id' ? getHumanReadableDirection(currentState.direction) : ''}`,
                key: 'id',
                direction: currentState.key === 'id' ? (currentState.direction === 'asc' ? 'desc' : 'asc') : 'desc'
            },
            {
                title: `Название ${getHumanReadableSortKey('title')} ${currentState.key === 'title' ? getHumanReadableDirection(currentState.direction) : ''}`,
                key: 'title',
                direction: currentState.key === 'title' ? (currentState.direction === 'asc' ? 'desc' : 'asc') : 'asc'
            },
            {
                title: `Дата выхода ${getHumanReadableSortKey('release_date')} ${currentState.key === 'release_date' ? getHumanReadableDirection(currentState.direction) : ''}`,
                key: 'release_date',
                direction: currentState.key === 'release_date' ? (currentState.direction === 'asc' ? 'desc' : 'asc') : 'asc'
            },
            {
                title: `Рейтинг ${getHumanReadableSortKey('vote_average')} ${currentState.key === 'vote_average' ? getHumanReadableDirection(currentState.direction) : ''}`,
                key: 'vote_average',
                direction: currentState.key === 'vote_average' ? (currentState.direction === 'asc' ? 'desc' : 'asc') : 'asc'
            },
            {
                title: `Популярность ${getHumanReadableSortKey('popularity')} ${currentState.key === 'popularity' ? getHumanReadableDirection(currentState.direction) : ''}`,
                key: 'popularity',
                direction: currentState.key === 'popularity' ? (currentState.direction === 'asc' ? 'desc' : 'asc') : 'asc'
            }
        ];

        // Add separators and dynamic titles
        menuItems.forEach((item, index) => {
            // Update title to reflect current selection
             if (item.key === currentState.key) {
                 item.title = `${getHumanReadableSortKey(item.key)} ${getHumanReadableDirection(currentState.direction)}`;
                 item.direction = currentState.direction === 'asc' ? 'desc' : 'asc'; // Toggle direction
             } else {
                 item.title = `${getHumanReadableSortKey(item.key)}`;
                 item.direction = 'asc'; // Default to asc for new selections
             }


            if (index > 0) {
                menuItems.splice(index, 0, { separator: true });
            }
        });


        Select.show({
            title: 'Сортировать по:',
            items: menuItems,
            onSelect: (selectedItem) => {
                if (selectedItem.key) {
                    const newSortState = { key: selectedItem.key, direction: selectedItem.direction };
                    saveSortState(category, newSortState);
                    applySort(category, newSortState.key, newSortState.direction);
                }
            },
            onBack: () => {
                Controller.toggle('content'); // Go back to the main content view
            }
        });
    }

    // Initial injection point
    // We could also hook into Lampa's initialization or routing system more deeply if needed.
    // For now, listening to router events is a reasonable approach.

})();
