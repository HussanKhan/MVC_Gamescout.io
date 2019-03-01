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

    // Users Search Term
    searchTerm: "",

};

let View = function() {

    const self = this;

    // User Search input
    this.userSearch = ko.observable();
    
    // Holds games that are displayed
    this.displayGames = ko.observableArray();

    this.displayGames(
        controller.filterGenres(["Highly Rated Games", "Recently Released Games", "Released Last Year"], unique=true)
    );

    // Listens for user search
    ko.computed(() => {
        console.log(this.userSearch());
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

    // filterTitles: () => {

    // };

};

// Starts app by applying bindings
controller.init(() => {
    ko.applyBindings(new View());
     lazyload();
});