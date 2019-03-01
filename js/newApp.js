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

    // Games already matches
    searchMatches: [],

};

let View = function() {

    const self = this;

    // User Search input
    this.userSearch = ko.observable();
    
    // Holds games that are displayed
    this.displayGames = ko.observableArray();

    // Default displayed games
    const defaultGames = controller.filterGenres(["Highly Rated Games", "Recently Released Games", "Released Last Year"], unique=true);

    this.displayGames(defaultGames);

    // Listens for user search
    ko.computed(() => {
        const matches = controller.filterTitles(this.userSearch());

        if (matches && matches.length != 0) {
            this.displayGames(matches);
            lazyload();
        } else {
            this.displayGames(defaultGames);
            lazyload();
        }

    });

}

// Interact with model
let controller = {

    // Stores deals from api into model
    init: (startDisplay) => {
        model.getDeals((data) => {
            
            model.allGames = data.Deals;
            lazyload();
            startDisplay();

        });
    },

    // All games from api
    getAllGames: () => {
        return model.allGames;
    },

    // Checks if genre in game genres
    checkGenre: (genres, filter) => {

        const genre = genres.toString();
        
        for (let g = 0; g < filter.length; g++) {
            
            if (genre.includes(filter[g])) {
                return 1;
            }
        };

        return 0;
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

    }

};

// Starts app by applying bindings
controller.init(() => {
    ko.applyBindings(new View());
     lazyload();
});