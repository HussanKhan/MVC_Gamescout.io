// Store data
let model = {
    
    // Gets list of deals and stores in all games
    getDeals: (callback) => {
        $.ajax({
            url: "http://127.0.0.1:8080/masterdeals",
            dataType: 'json',
            async: true,
            success: (data) => {

                callback(data);
                
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
        const defaultGames = controller.filterGenres(["Highly Rated Games", "Recently Released Games", "Released Last Year"], unique=true);
        
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
    },

    // User Search input
    userSearch: ko.observable(),

    // Dynamic styles
    styles: {
        // Style for selected nav button
        selectedNavStyle: () => {
            return {
                // selected
                border: "1px solid white",
                boxShadow: "0px 0px 5px 0.5px rgba(255,255,255,0.5)",
                backgroundColor:  "#0000001f",
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
    }
};

// Interacts with model
let controller = {

    // Stores deals from api into model
    init: (startDisplay) => {
        model.getDeals((data) => {
            
            model.allGames = data.Deals;

            for (let i = 0; i < data.Genres.length; i++) {
                model.allGenres.push({name: data.Genres[i][0]});
            };

            lazyload();
            startDisplay();

        });
    },

    // All games from api
    getAllGames: () => {
        return model.allGames;
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
        

        for (let i = 0; i < model.filteredGames.length; i++) {

            if (controller.stringSimilarity(tokens, model.filteredGames[i].title)) {
                matches.push(model.filteredGames[i]);
            }

        }

        return matches;

    },

    // Returns filtered games by genre
    filterGenres: (genres, unique=false) => {

        if (unique) {

            let addedTitles = [];

            for (let i = 0; i < model.allGames.length; i++) {

                if (controller.checkGenre(model.allGames[i].genre, genres)) {

                    if (addedTitles.indexOf(model.allGames[i].title) <= -1) {

                        addedTitles.push(model.allGames[i].title);
                        model.filteredGames.push(model.allGames[i]);

                    }
    
                }
            }
    
            return model.filteredGames;

        } else {

            for (let i = 0; i < model.allGames.length; i++) {

                if (controller.checkGenre(model.allGames[i].genre, genres)) {
                    
                    model.filteredGames.push(model.allGames[i]);
    
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

            if (string.includes(tokens[t])) {

                matches = matches + 1;
                
                const ratio = parseInt((matches/allTokens) * 100);

                if (ratio > sense) {

                    console.log(ratio, string, tokens)

                    return 1;
                }

            }
        }

        return 0;
    }, 

};

// Starts app by applying bindings
controller.init(() => {
    ko.applyBindings(view.init());
    lazyload();
});