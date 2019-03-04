// Store data
let model = {
    
    // Gets list of deals and stores in all games
    init: (startView) => {
        $.ajax({
            url: "http://127.0.0.1:8080/masterdeals",
            dataType: 'json',
            async: true,
            success: (data) => {

                model.allGames = data.Deals;

                for (let i = 0; i < data.Genres.length; i++) {
                    model.allGenres.push({name: data.Genres[i][0]});
                };

                // Title : { platPrice: {ps4: {price: $9.99, index: 3}, pc: {price: $7.99, index: 45}} }
                let tempHolder = {};

                let uniqueTitle = [];

                for (let u = 0; u < model.allGames.length; u++) {
                    
                    const title = model.allGames[u].title;
                    const platform = model.allGames[u].plat;
                    const price = parseInt(model.allGames[u].price.replace('$', ''));

                    if (uniqueTitle.indexOf(title) <= -1) {
                        model.dealOffers[title] = [model.allGames[u]];
                        uniqueTitle.push(title);
                    } else {
                        model.dealOffers[title].push(model.allGames[u]);
                    }

                    if (title in tempHolder) {

                        if (tempHolder[title].platPrice[platform]) {
                            const storedPrice = tempHolder[title].platPrice[platform].price;

                            if (price < storedPrice) {
                                tempHolder[title].platPrice[platform]['price'] = price;
                                tempHolder[title].platPrice[platform]['index'] = u;
                            }

                        } else {
                            tempHolder[title].platPrice[platform] = { 'price': price, 'index': u}
                        }

                    } else {
                        tempHolder[title] = { 'platPrice': {} };
                        tempHolder[title].platPrice[platform] = {'price': price, 'index': u};
                    }

                }

                // console.log(tempHolder);

                let lowestPricedGames = [];

                for (let t = 0; t < uniqueTitle.length; t++) {

                    const game = tempHolder[uniqueTitle[t]]; 

                    const platforms = Object.keys(game.platPrice);
                    
                    platforms.forEach((plat) => {
                        const index = game.platPrice[plat].index;
                        lowestPricedGames.push(model.allGames[index]);
                    });
                    
                };

                model.sortedGames = lowestPricedGames;

                startView();

            },
            error: (data) => {
                console.log("No Data for Server")
            }
        })
    },

    // Stores all games objects
    allGames: [],

    // Stores all genres
    allGenres: [],

    // filtered Games
    filteredGames: [],

    // Sorted deals (Lowest price for each platform)
    sortedGames: [],

    // Stores deals information for each game
    // {title of game: [offers]}
    dealOffers: {}
};

// UI
let view = {

    // Holds games that are displayed
    displayGames: ko.observableArray(),

    // Stores all known genres
    gameGenres: ko.observableArray(),

    // Text for Platform nav option
    selectedPlatform: ko.observable("All"),

    // Click out of modal
    modalOutClick: (event) => {

        if (view.states.mobile) {
            const menu = document.getElementsByClassName('menuIcon')[0];
            const back = document.getElementsByClassName('backIcon')[0];

            back.style.opacity = 0;

            setTimeout(() => {
                back.style.display = "none";
                menu.style.display = "block";
                menu.style.opacity = 1;
            }, 200);
        }

        const modal = document.getElementsByClassName('modal')[0];
        if (event.target == modal || event == 'close') {
            modal.style.display = 'none';
        }
    },

    // Opens and closes sidebar for mobile view
    sidebarToggle: () => {
        
        view.states.sidebar = !(view.states.sidebar);

        const sidebar = document.getElementsByClassName('sidebarWrapper')[0];
        const menu = document.getElementsByClassName('menuIcon')[0];

        console.log('run')

        if (view.states.sidebar) {

            menu.style.transform = "rotate(90deg)";
            sidebar.style.display = "block";
            sidebar.style.width = "100%";

            setTimeout(() => {
                sidebar.style.opacity = 1;
            },200);

        } else {
            sidebar.style.opacity = 0;

            setTimeout(() => {
                sidebar.style.width = "0%";
                sidebar.style.display = "none";
            },300);
            
            menu.style.transform = "rotate(0deg)";
            
        }

    },

    // Opens modal for game
    modalOpen: (gameName) => {

        if (view.states.mobile) {
            const menu = document.getElementsByClassName('menuIcon')[0];
            const back = document.getElementsByClassName('backIcon')[0];

            menu.style.opacity = 0;

            setTimeout(() => {
                menu.style.display = "none";
                back.style.display = "block";
                back.style.opacity = 1;
            }, 200);
        }

        const modal = document.getElementsByClassName('modal')[0];
        
        modal.style.display = 'block';

        const offers = controller.getOffers(gameName);

        const modalInfo = {title: gameName, offers: offers, image: offers[0].image};

        console.log(gameName);

        view.modalInfo(modalInfo);

        console.log(offers);
    }, 

    // Default games
    defaultGames: () => {
        const games = controller.filterGenres(["Highly Rated Games", "Recently Released Games"], view.selectedPlatform());
        return games;
    } ,

    // Applys UI functions
    init: () => {
        
        // Loads arrays
        view.displayGames(view.defaultGames());

        view.gameGenres(controller.getAllGenres());

        // Sets states for nav and menus
        view.navState(view.states.defaultNavState());
        view.menuState(view.states.defaultMenuState());
        view.platformMenuState(view.states.defaultPlatformMenuState());
        view.genreMenuState(view.states.defaultGenreMenuState());

        // Checks if mobile view 
        const display = window.innerWidth;

        if (display <= 615) {
            view.states.mobile = true;
        }

        // Listens for input
        ko.computed(() => {
            const matches = controller.filterTitles(view.userSearch());
    
            if (matches && matches.length != 0) {
                view.displayGames(matches);
                lazyload();
            } else {
                view.displayGames(view.defaultGames());
                lazyload();
            }
    
        });

        // Listens for price input
        ko.computed(() => {
            document.getElementsByClassName('mainDisplay')[0].style.opacity = 0;

            const matches = controller.filterPrice(view.userPrice(), view.selectedPlatform());
    
            if (matches && matches.length != 0) {
                view.displayGames(matches);
                lazyload();
            } else {
                view.displayGames(view.defaultGames());
                lazyload();
            }

            setTimeout(() => {
                document.getElementsByClassName('mainDisplay')[0].style.opacity = 1;
            },200)
    
        });
    },

    // User Search input
    userSearch: ko.observable(),

    // User Price input
    userPrice: ko.observable(),

    // Dynamic styles
    styles: {
        // Style for selected nav button
        selectedNavStyle: () => {
            return {
                // selected
                border: "1px solid #7f8fa6",
                boxShadow: "0px 0px 5px 0.5px rgba(255,255,255,0.5)",
                backgroundColor:  "#0000000e",
                opacity: 1
            }
        },

        // Default styles of nav
        defaultNavStyle: () => {
            return {
                // default
                border: "1px solid rgba(255,255,255,0.0)",
                boxShadow: "0px 0px 0px 0px rgba(255,255,255,0.0)",
                backgroundColor: "",
                opacity: 1
            }
        },

        selectedMenuStyle: () => {
            return {
                backgroundColor:  "#0000000e",
            }
        },

        defaultMenuStyle: () => {
            return {
                backgroundColor: "",
            }
        },
    },

    // Stores default states
    states: {
        defaultNavState: () => {
            return {
                platform: view.styles.defaultNavStyle(),
                price : view.styles.defaultNavStyle(),
                genre: view.styles.defaultNavStyle(),
            };
        },

        sidebar: false,

        mobile: false,

        defaultMenuState: () => {
            return {
                platform: false,
                price: false,
                genre: false
            }
        },

        defaultPlatformMenuState: () => {
            return {
                PC: view.styles.defaultMenuStyle(),
                PS4: view.styles.defaultMenuStyle(),
                XBOX: view.styles.defaultMenuStyle(),
                NINTENDO: view.styles.defaultMenuStyle(),
            }
        },

        defaultGenreMenuState: () => {

            let defaultGenre = {};

            for (let i = 0; i < view.gameGenres().length; i++) {
                defaultGenre[view.gameGenres()[i].name] = view.styles.defaultMenuStyle();
            }

            return defaultGenre;
        }
    },
    
    // Current state of nav
    navState: ko.observable(),

    // Current of all menus
    menuState: ko.observable(),

    // State of platform menu
    platformMenuState: ko.observable(),

    // state of genre menu
    genreMenuState: ko.observable(),

    // Holds info for modal
    modalInfo: ko.observable({
        title: "Old",
        offers: [],
        image: "#",
    }),

    // Handles nav interactions
    selectNavOption: (option) => {
        let newNavState = view.states.defaultNavState();
        let newMenuState = view.states.defaultMenuState();

        view.userPrice('');
        
        newNavState[option] = view.styles.selectedNavStyle();

        newMenuState[option] = true;
        
        view.navState(newNavState);
        view.menuState(newMenuState);
    },

    // Handles selctions in Platofrm menu
    platformMenuOption: (platform) => {

        view.selectedPlatform(platform);
        
        let defaultPlatform = view.states.defaultPlatformMenuState();

        defaultPlatform[platform] = view.styles.selectedMenuStyle();
        
        view.platformMenuState(defaultPlatform);

        const filteredGames = controller.filterPlatforms(platform);

        view.displayGames(filteredGames);

        lazyload();

    },

    // Handles genre selection
    genreMenuOption: (genre) => {

        const filteredGames = controller.filterGenres([genre], view.selectedPlatform());
        const defaultState = view.states.defaultGenreMenuState();

        defaultState[genre] = view.styles.selectedMenuStyle();
        
        view.genreMenuState(defaultState);
        view.displayGames(filteredGames);

        lazyload();

    },
};

// Interacts with model
let controller = {

    // All games from api
    getAllGames: (unique=false) => {
        return model.sortedGames
    },

    // All Known Genres
    getAllGenres: () => {
        return model.allGenres;
    },

    // Checks if genre in game genres
    checkGenre: (gameGenres, filter) => {

        const genre = gameGenres.toString();
        
        for (let g = 0; g < filter.length; g++) {
            
            if (genre.includes(filter[g])) {
                return 1;
            }
        };

        return 0;
    },

    // Uses tokens on length 3 match string
    filterTitles: (query) => {

        let tokens = [];

        let matches = [];

        if (query) {

            query = query.split(' ').join('').toLowerCase()

            let currentToken = [];
            
            for (let t = 0; t < query.length; t++) {
                currentToken.push(query[t]);
                if ( ((t+1) % 3) === 0) {
                    tokens.push(currentToken.join(''));
                    currentToken = [];
                }

            };

        } else {
            return 0;
        }
        

        for (let i = 0; i < model.sortedGames.length; i++) {
            if (controller.stringSimilarity(tokens, model.sortedGames[i].title)) {
                matches.push(model.sortedGames[i]);
            }
        }

        return matches;

    },

    // Returns filtered games by genre
    filterGenres: (genres, platform) => {

        console.log(platform);

        model.filteredGames = [];

        if (platform != 'All') {

            for (let i = 0; i < model.sortedGames.length; i++) {
                if ((controller.checkGenre(model.sortedGames[i].genre, genres)) && model.sortedGames[i].plat == platform) {
                    model.filteredGames.push(model.sortedGames[i]);
                }
            }

        } else {
            let tempArr = [];

            for (let i = 0; i < model.sortedGames.length; i++) {
                if (tempArr.indexOf(model.sortedGames[i].title) <= -1) {
                    if ((controller.checkGenre(model.sortedGames[i].genre, genres))) {
                        model.filteredGames.push(model.sortedGames[i]);
                        tempArr.push(model.sortedGames[i].title);
                    }
                }
            }

        }

        return model.filteredGames;
    },

    filterPlatforms: (platform) => {

        model.filteredGames = [];
    
        for (let i = 0; i < model.sortedGames.length; i++) {
            if (model.sortedGames[i].plat == platform) {     
                model.filteredGames.push(model.sortedGames[i]);
            }
        }

        return model.filteredGames;
    },

    // Filter games based on price and platform
    filterPrice: (price, platform) => {

        model.filteredGames = [];
    
        if (platform != 'All') {

            for (let i = 0; i < model.sortedGames.length; i++) {
                if (parseInt(model.sortedGames[i].price.replace("$", '')) <= parseInt(price) && model.sortedGames[i].plat == platform) {
                    model.filteredGames.push(model.sortedGames[i]);
                }
            }

        } else {

            for (let i = 0; i < model.sortedGames.length; i++) {
                if (parseInt(model.sortedGames[i].price.replace("$", '')) <= parseInt(price)) {
                    model.filteredGames.push(model.sortedGames[i]);
                }
            }

        }

        return model.filteredGames;
    },

    // Returns offers for a specific game
    getOffers: (title) => {
        const offers = model.dealOffers[title];
        return offers;
    },

    // Returns how many token matches
    stringSimilarity: (tokens, string, sense=65) => {

        let matches = 0;
        const allTokens = tokens.length;

        string = string.split(' ').join('').toLowerCase()

        for (let t = 0; t < tokens.length; t++) {
            if (!(string.includes(tokens[t]))) {
                return 0;
            } 
        }

        return 1;
    }, 

};

// Starts app by applying bindings
model.init(() => {
    ko.applyBindings(view.init());
    lazyload();
});