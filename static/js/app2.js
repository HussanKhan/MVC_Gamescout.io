var ViewModel = function() {



    var self = this;
    this.gameitems = ko.observableArray();
    this.listsearch = ko.observable();
    this.allgenres = ko.observableArray();
    this.num_deals = ko.observable();
    this.everygame = ko.observableArray();
    this.listGenres = ko.observableArray();
    this.showgenre = ko.observable(!1);
    this.game_match = ko.observableArray();
    this.search_matches = ko.observableArray();
    this.searchdis = ko.observable(!1);
    this.searchphrase = ko.observable();
    this.matchesmessage = ko.observable();
    this.sitemessage = ko.observable(!0);
    this.alldealsbackup = ko.observableArray();
    this.sidebarvis = ko.observable(!1);
    this.unique_titles = ko.observableArray();
    this.loader = ko.observable(true);
    this.store = ko.observable(true);
    this.init_load = ko.observable(false);
    this.init_loader = ko.observable(true);
    this.show_main_mess = ko.observable(false);
    this.upperload = ko.observable(true);

    // if ($(document).width() < 820) {
    //     window.scrollTo(0,1);
    // };


    // These are for more game info
    this.twitter = ko.observable();
    this.reddit = ko.observable();
    this.feat_img = ko.observable();
    this.feat_title = ko.observable();
    this.feat_date = ko.observable();
    this.feat_rating = ko.observable();
    this.feat_trailer = ko.observable();
    this.feat_sum = ko.observable();
    this.feat_deals = ko.observableArray();
    this.feat_extras1 = ko.observable();
    this.feat_extras2 = ko.observableArray();
    this.feat_extras3 = ko.observableArray();

    this.feat_loader = ko.observable(true);
    this.feat_content = ko.observable(false);
    this.review_viz = ko.observable(true);

    this.opensidebar = function() {
        self.sidebarvis(!0);
        document.getElementById('side-menu').style.width = '250px';
        document.getElementById('storewrap').style.marginLeft = '250px';
        document.getElementById('topcont').style.marginLeft = '250px';
        console.log("opensidebar")
    }

    this.closesidebar = function() {
        self.sidebarvis(!1);
        document.getElementById('side-menu').style.width = '0px';
        document.getElementById('storewrap').style.marginLeft = '0px';
        document.getElementById('topcont').style.marginLeft = '0px';
        console.log("closesidebar")
    }

    this.close_game_info = function() {
        document.getElementById('feat_game2').style.opacity = '0';
        document.getElementById('feat_game2').style.display = 'none';

        var pages = "";

        history.pushState(pages, '', '/');

        document.title = "Browse Hundreds of New Video Game Deals Everyday | GameScout.io";

        self.feat_loader(true);
        self.feat_content(false);
    }

    this.findmatch = function(arr, word) {
        if (arr.toString().includes(word)) {
            return 1
        } else {
            return 0
        }
    };


    this.filterplat = function(check) {

        self.store(false);
        self.loader(true);
        self.listGenres.removeAll();
        if (check == 'all') {
            for (var i = 0; i < self.alldealsbackup().length; i++) {
                self.listGenres.push(self.alldealsbackup()[i]);
                lazyload()
            }
        } else {
            for (var i = 0; i < self.allgenres().length; i++) {
                var already_in = [];
                var match = {
                    genre: "",
                    gamelist: ko.observableArray(),
                    scroll_id: "genr" + i,
                    infoviz: ko.observable(!1)
                };
                for (var m = 0; m < self.gameitems().length; m++) {
                    if (self.findmatch(self.gameitems()[m].genre, self.allgenres()[i].genre) && self.gameitems()[m].plat.split(' ')[1] == check) {
                        if (already_in.includes(self.gameitems()[m].title)) {} else {
                            match.gamelist.push(self.gameitems()[m]);
                            already_in.push(self.gameitems()[m].title)
                        }
                    }
                }
                if (match.gamelist().length > 1) {
                    match.genre = self.allgenres()[i].genre;
                    self.listGenres.push(match)
                }
                lazyload()
            }

        }

        setTimeout( function(){
            self.loader(false);
            self.store(true);
        }, 800);
    };

    this.openweb = function openInNewTab(img_ref) {
        document.getElementById('feat_game2').style.display = 'block';
        document.getElementById('feat_game2').style.opacity = '1';

        $.ajax({
            url: "https://gamescout.io/json/" + img_ref,
            dataType: 'json',
            async: true,
            success: function(data) {
                res_obj = data.more_info

                self.twitter(res_obj.social.twitter);
                self.reddit(res_obj.social.reddit);

                self.feat_img(res_obj.image);
                self.feat_title(res_obj.title);
                self.feat_date(res_obj.date);
                self.feat_rating(res_obj.rating);
                self.feat_trailer(res_obj.trailer);

                self.feat_sum(res_obj.summary);

                var pages = "";

                history.pushState(pages, '', '/info/' + res_obj.title);

                document.title = res_obj.title + " Game Deal | GameScout.io";


                self.feat_deals.removeAll();

                for (var i = 0; i < res_obj.rel_deals.length; i++) {
                    self.feat_deals.push({"buylink": res_obj.rel_deals[i].buylink, "offer_phrase": res_obj.rel_deals[i].offer_phrase, "offer_title": res_obj.rel_deals[i].offer_title, "platform": res_obj.rel_deals[i].platform, "tag": res_obj.rel_deals[i].platform.split(" ")[0]});

                };

                self.feat_extras1(res_obj.extra.section_1);


                self.feat_extras2.removeAll();
                for (var i = 0; i < res_obj.extra.section_2.length; i++) {
                    self.feat_extras2.push({"rev": res_obj.extra.section_2[i]});
                };

                if (res_obj.extra.section_2.length > 1) {
                    self.review_viz(true);
                } else {
                    self.review_viz(false);
                }

                self.feat_extras3.removeAll();

                for (var i = 0; i < res_obj.extra.section_3.length; i++) {
                    self.feat_extras3.push({"sup": res_obj.extra.section_3[i]});
                }

                self.feat_loader(false);
                self.feat_content(true);



            },
            error: function(data) {
                console.log("No Data for Server");
                document.getElementById('feat_game2').style.opacity = '0';
                document.getElementById('feat_game2').style.display = 'none';

                self.feat_loader(true);
                self.feat_content(false);


            }
        })
    }

    this.open_social = function openInNewTab(img_ref) {
        var win = window.open(img_ref, '_blank');
        win.focus()
    }

    this.find_results = ko.computed(function() {
        if (self.searchphrase()) {
            $('html, body').animate({
                scrollTop: 0
            }, 0);
            self.showgenre(!1);
            self.search_matches.removeAll();
            for (var i = 0; i < self.unique_titles().length; i++) {
                if (self.unique_titles()[i].toLowerCase().includes(self.searchphrase().toLowerCase())) {
                        self.search_matches.push({"title": self.unique_titles()[i]});
                        self.searchdis(true);
                    }
                }
            } else {
                self.searchdis(false);
            }
    });

    this.scrollerl = function(the_id = "search_results") {
        console.log("Got: " + the_id);
        $("#" + the_id).animate({
            scrollLeft: "+=1190px"
        }, "fast")
    };

    this.scrollerr = function(the_id = "search_results") {
        console.log("Got: " + the_id);
        $("#" + the_id).animate({
            scrollLeft: "-=1190px"
        }, "fast")
    };

    this.shgen = function() {
        self.searchdis(!1);
        $('html, body').animate({
            scrollTop: 0
        }, 0);
        self.sitemessage(!1);
        self.showgenre(!0)
    }

    if (window.location.pathname.includes('info')) {
        var game = window.location.pathname.replace("/info/", "");
        game = game.replace("%20", " ");

        self.openweb(game);
    }

    $.ajax({
        url: "https://gamescout.io/masterdeals",
        dataType: 'json',
        async: true,
        success: function(data) {
            for (var i = 0; i < data.Deals.length; i++) {
                self.gameitems.push({
                    id: data.Deals[i].id,
                    source: data.Deals[i].source,
                    title: data.Deals[i].title,
                    price: data.Deals[i].price,
                    image: data.Deals[i].image,
                    link: data.Deals[i].link,
                    genre: data.Deals[i].genre,
                    plat: "gameprice " + data.Deals[i].plat
                })

                if (self.unique_titles().includes(data.Deals[i].title)) {

                } else {
                    self.unique_titles().push(data.Deals[i].title);
                }
            }
            self.gameitems().sort(function() {
                return Math.random()
            })
            for (var g = 0; g < data.Genres.length; g++) {
                var num_match = 0;
                var match = {
                    genre: "",
                    gamelist: ko.observableArray(),
                    scroll_id: "genr" + g,
                    infoviz: ko.observable(!1)
                };
                for (var m = 0; m < self.gameitems().length; m++) {
                    if (data.Genres[g][1].indexOf(self.gameitems()[m].id) > -1) {
                        match.gamelist.push(self.gameitems()[m]);
                        num_match = num_match + 1
                    }
                }
                if (match.gamelist().length > 3) {
                    match.genre = data.Genres[g][0];
                    self.listGenres.push(match);
                    self.alldealsbackup.push(match);
                    self.allgenres.push({
                        genre: data.Genres[g][0],
                        link: "#" + data.Genres[g][0]
                    })
                }
            }
            lazyload();
            self.num_deals(self.gameitems().length + " Deals Today!");
            self.upperload(false);
            self.show_main_mess(true);
            self.loader(false);
            self.init_loader(false);
            self.init_load(true);
            document.getElementById('moreinfoload').style.display = 'none';
        },
        error: function(data) {
            console.log("No Data for Server")
        }
    })
}
ko.applyBindings(new ViewModel())
