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
                    
                    const title = model.allGames[u].title.toLowerCase();
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

    // Applys UI functions
    init: () => {

        document.addEventListener("DOMContentLoaded", function() {
            let lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
            let active = false;
          
            const lazyLoad = function() {
              if (active === false) {
                active = true;
          
                setTimeout(function() {
                  lazyImages.forEach(function(lazyImage) {
                    if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== "none") {
                      lazyImage.src = lazyImage.dataset.src;
                      lazyImage.srcset = lazyImage.dataset.srcset;
                      lazyImage.classList.remove("lazy");
          
                      lazyImages = lazyImages.filter(function(image) {
                        return image !== lazyImage;
                      });
          
                      if (lazyImages.length === 0) {
                        document.removeEventListener("scroll", lazyLoad);
                        window.removeEventListener("resize", lazyLoad);
                        window.removeEventListener("orientationchange", lazyLoad);
                      }
                    }
                  });
          
                  active = false;
                }, 200);
              }
            };
          
            document.addEventListener("scroll", lazyLoad);
            window.addEventListener("resize", lazyLoad);
            window.addEventListener("orientationchange", lazyLoad);
          });
        
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
                
            } else {
                view.displayGames(view.defaultGames());
                
            }
    
        });

        // Listens for price input
        ko.computed(() => {
            document.getElementsByClassName('mainDisplay')[0].style.opacity = 0;

            const matches = controller.filterPrice(view.userPrice(), view.selectedPlatform());
    
            if (matches && matches.length != 0) {
                view.displayGames(matches);
                
            } else {
                view.displayGames(view.defaultGames());
                
            }

            setTimeout(() => {
                document.getElementsByClassName('mainDisplay')[0].style.opacity = 1;
            },200)
    
        });

        view.openQueryGame();

    },

    // Opens game if query
    openQueryGame: () => {

        if (!(window.location.search.includes("="))) {
            return 1;
        }

        console.log("VALID")

        const query = window.location.search.replace('?', '');
        const allQueries = query.split("&");
        let queries = {};
        allQueries.forEach( param => {
            const arg = param.split("=");
            queries[arg[0]] =  decodeURIComponent(arg[1]);
        });
        
        view.modalOpen(queries.game);

        console.log(queries);
    },

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
                menu.style.transform = "rotate(0deg)";
                menu.style.opacity = 1;
            }, 200);
        }

        const modal = document.getElementsByClassName('modal')[0];
        if (event.target == modal || event == 'close') {
            modal.style.display = 'none';
        }

        history.pushState('', '', '/');

    },

    // Opens and closes sidebar for mobile view
    sidebarToggle: () => {
        
        view.states.sidebar = !(view.states.sidebar);

        const sidebar = document.getElementsByClassName('sidebarWrapper')[0];
        const menu = document.getElementsByClassName('menuIcon')[0];
        const games = document.getElementsByClassName('mainDisplay')[0];

        console.log('run')

        if (view.states.sidebar) {

            menu.style.transform = "rotate(90deg)";
            sidebar.style.display = "block";
            sidebar.style.width = "100%";

            setTimeout(() => {
                sidebar.style.opacity = 1;
                games.style.display = 'none';
            },200);

        } else {
            sidebar.style.opacity = 0;
            games.style.display = 'block';
            setTimeout(() => {
                sidebar.style.width = "0%";
                sidebar.style.display = "none";
            },300);
            
            menu.style.transform = "rotate(0deg)";
            
        }

    },

    // Opens modal for game
    modalOpen: (gameName) => {

        const modal = document.getElementsByClassName('modal')[0];
        const offers = controller.getOffers(gameName);

        if (!(offers)) {
            return 0;
        }

        const modalInfo = {title: gameName, offers: offers, image: offers[0].image};

        view.mobileModalCheck(offers);

        console.log(gameName);

        modal.style.display = 'block';

        history.pushState('', '', '/gamedeal?game=' + gameName);

        view.modalInfo(modalInfo);
    },

    // Special styling for modal on mobile
    mobileModalCheck: (offers) => {

        const container = document.getElementsByClassName('modalGame')[0];
        
        if (offers.length > 6 && !(view.states.mobile)) {
            container.style.marginTop = "2%";   
        } else {
            container.style.marginTop = "0%"; 
        }

        if (view.states.mobile) {
            const menu = document.getElementsByClassName('menuIcon')[0];
            const back = document.getElementsByClassName('backIcon')[0];

            menu.style.transform = "rotate(90deg)";
            menu.style.opacity = 0;
            
            setTimeout(() => {
                menu.style.display = "none";
                back.style.display = "block";
                back.style.transform = "rotate(0deg)";
                back.style.opacity = 1;
            }, 200);
        }
    },

    // Default games
    defaultGames: () => {
        const games = controller.filterGenres(["Highly Rated Games"], view.selectedPlatform());
        return games;
    } ,

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

        

    },

    // Handles genre selection
    genreMenuOption: (genre) => {

        const filteredGames = controller.filterGenres([genre], view.selectedPlatform());
        const defaultState = view.states.defaultGenreMenuState();

        defaultState[genre] = view.styles.selectedMenuStyle();
        
        view.genreMenuState(defaultState);
        view.displayGames(filteredGames);

        

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

            for (let g = 0; g < model.sortedGames.length; g++) {
                if (tempArr.indexOf(model.sortedGames[g].title) <= -1) {
                    model.filteredGames.push(model.sortedGames[g]);
                    tempArr.push(model.sortedGames[g].title);
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
        title = title.toLowerCase();
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
    
});