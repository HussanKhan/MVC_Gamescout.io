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

                let indexPositions = [];

                // Title : { platPrice: {ps4: {price: $9.99, index: 3}, pc: {price: $7.99, index: 45}} }
                let tempHolder = {};

                let uniqueTitle = [];

                for (let u = 0; u < model.allGames.length; u++) {
                    
                    const title = model.allGames[u].title;
                    const platform = model.allGames[u].plat;
                    const price = parseInt(model.allGames[u].price.replace('$', ''));

                    if (uniqueTitle.indexOf(title) <= -1) {
                        uniqueTitle.push(title);
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
    sortedGames: []
};

// UI
let view = {

    // Holds games that are displayed
    displayGames: ko.observableArray(),

    // Stores all known genres
    gameGenres: ko.observableArray(),

    // Applys UI functions
    init: () => {
        // Default displayed games
        const defaultGames = controller.filterGenres(["Highly Rated Games", "Recently Released Games", "Released Last Year"]);

        // const defaultGames = controller.getAllGames();
        
        // Loads arrays
        view.displayGames(defaultGames);

        view.gameGenres(controller.getAllGenres());

        // Sets states for nav and menus
        view.navState(view.states.defaultNavState());
        view.menuState(view.states.defaultMenuState());

        // Listens for input
        ko.computed(() => {
            const matches = controller.filterTitles(view.userSearch());
    
            if (matches && matches.length != 0) {
                view.displayGames(matches);
                lazyload();
            } else {
                view.displayGames(defaultGames);
                lazyload();
            }
    
        });

        ko.computed(() => {
            const matches = controller.filterPrice(view.userPrice());
    
            if (matches && matches.length != 0) {
                view.displayGames(matches);
                lazyload();
            } else {
                view.displayGames(defaultGames);
                lazyload();
            }
    
        });

        // removes preloader
        document.getElementsByClassName('preloader')[0].style.opacity = "0";

        setTimeout(() => {
            document.getElementsByClassName('preloader')[0].style.display = "none";
        },500)
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

        defaultMenuState: () => {
            return {
                platform: false,
                price: false,
                genre: false
            }
        }
    },
    
    // Current state of nav
    navState: ko.observable(),

    // Current of all menus
    menuState: ko.observable(),

    // Handles nav interactions
    selectNavOption: (option) => {
        let newNavState = view.states.defaultNavState();
        let newMenuState = view.states.defaultMenuState();
        
        newNavState[option] = view.styles.selectedNavStyle();

        newMenuState[option] = true;
        
        view.navState(newNavState);
        view.menuState(newMenuState);
    },

    platformMenuOption: (platform) => {
        const filteredGames = controller.filterPlatforms(platform);

        view.displayGames(filteredGames);

        lazyload();
    },

    priceMenuOption: (price) => {

    }
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
    filterGenres: (genres, unique=false) => {

        if (unique) {

            let addedTitles = [];

            for (let i = 0; i < model.sortedGames.length; i++) {

                if (controller.checkGenre(model.sortedGames[i].genre, genres)) {

                    if (addedTitles.indexOf(model.sortedGames[i].title) <= -1) {

                        addedTitles.push(model.sortedGames[i].title);
                        model.filteredGames.push(model.sortedGames[i]);

                    }
    
                }
            }
    
            return model.filteredGames;

        } else {

            for (let i = 0; i < model.sortedGames.length; i++) {

                if (controller.checkGenre(model.sortedGames[i].genre, genres)) {
                    
                    model.filteredGames.push(model.sortedGames[i]);
    
                }
            }
    
            return model.filteredGames;
        }

    },

    filterPlatforms: (platform, unique=false) => {

        model.filteredGames = [];
    
        if (unique) {

            let addedTitles = [];

            for (let i = 0; i < model.sortedGames.length; i++) {

                if (model.sortedGames[i].plat == platform) {

                    if (addedTitles.indexOf(model.sortedGames[i].title) <= -1) {

                        addedTitles.push(model.sortedGames[i].title);
                        model.filteredGames.push(model.sortedGames[i]);

                    }
    
                }
            }
    
            return model.filteredGames;

        } else {

            for (let i = 0; i < model.sortedGames.length; i++) {

                if (model.sortedGames[i].plat == platform) {
                    
                    model.filteredGames.push(model.sortedGames[i]);
    
                }
            }
    
            return model.filteredGames;
        }
    },

    filterPrice: (price, unique=false) => {
        model.filteredGames = [];
    
        if (unique) {

            let addedTitles = [];

            for (let i = 0; i < model.sortedGames.length; i++) {

                if (parseInt(model.sortedGames[i].price.replace("$", '')) <= parseInt(price)) {

                    if (addedTitles.indexOf(model.sortedGames[i].title) <= -1) {

                        addedTitles.push(model.sortedGames[i].title);
                        model.filteredGames.push(model.sortedGames[i]);

                    }
    
                }
            }
    
            return model.filteredGames;

        } else {

            for (let i = 0; i < model.sortedGames.length; i++) {

                if (parseInt(model.sortedGames[i].price.replace("$", '')) <= parseInt(price)) {
                    
                    model.filteredGames.push(model.sortedGames[i]);
    
                }
            }
    
            return model.filteredGames;
        }
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