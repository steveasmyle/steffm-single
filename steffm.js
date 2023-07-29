// GLOBAL CONSTANTS AND VARIABLES 
//#region 
const config = {
    "iframeUrlPrefix": "https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&autoplay=1&feed=%2Frymixxx%2F",
    "volumeIncrement": 0.05,
    "loadMixcloud": true,
    "keyHold": {
        "repeatInterval": 100,
        "initialDelay": 500
    },
    "output": {
        "characterCount": 12,
        "tickInterval": 250,
        "repeatInterval": 500
    },
    "perspective": {
        "bodyMin": 27,
        "bodyMax": 28,
        "fauxBodyMin": 20,
        "fauxBodyMax": 30
    }
};

const articles = [{
    title: "About Stef.FM",
    body: "Stef.FM is a music streaming service dedicated to preserving the works of the late music genius, Stefan Bauer. Explore and enjoy his vast collection of house, soul, and jazz mixes.",
    author: "Stef.FM Mod",
    date: "23 July 2023"
}];

let globalError = false;

// TICKER
var scrollers = {};

function startScroller(id, text, displayLength, tickDelay, pauseDelay) {
    var str = text.replace(/ /g, "!");
    str = str.padStart(displayLength + str.length, "!");

    var display = document.getElementById(id);
    var startIndex = 0;

    if (scrollers[id]) {
        clearInterval(scrollers[id]);
    }

    scrollers[id] = setInterval(function() {
        var substring = str.substring(startIndex, startIndex + displayLength);
        display.nextSibling.textContent = substring;
        startIndex++;

        if (startIndex > str.length) {
            startIndex = 0;
            clearInterval(scrollers[id]);
            setTimeout(function() {
                startScroller(id, text, displayLength, tickDelay, pauseDelay);
            }, pauseDelay);
        }
    }, tickDelay);
}

function stopScrollers() {
    for (var id in scrollers) {
        clearInterval(scrollers[id]);
    }
    scrollers = {};
}

// Start scrollers
startScroller(
    "displayMain",
    "My Pair of Shoes - Volume 89",
    config.output.characterCount,
    config.output.tickInterval,
    config.output.repeatInterval
);

// To stop all scrollers, call stopScrollers():
// stopScrollers();


// PERSPECTIVE SHIFT
function updatePerspective(bodyMin, bodyMax, fauxBodyMin, fauxBodyMax) {
    var bodyRange = bodyMax - bodyMin;
    var fauxBodyRange = fauxBodyMax - fauxBodyMin;

    document.addEventListener('mousemove', function(event) {
        // Using window.matchMedia to check if the viewport width is more than 64rem.
        var isLargeViewport = window.matchMedia("(min-width: 64rem)").matches;
        if (isLargeViewport) {
            var mouseY = event.clientY;
            var viewportHeight = window.innerHeight;
            var proportion = mouseY / viewportHeight;
            var bodyPerspective = (bodyRange * proportion) + bodyMin;
            var fauxBodyPerspective = (fauxBodyRange * proportion) + fauxBodyMin;
            document.body.style.perspective = `${bodyPerspective}rem`;
            document.getElementById('fauxBody').style.perspective = `${fauxBodyPerspective}rem`;
        }
        // If the viewport width is less than 64rem, unset the perspective.
        else {
            document.body.style.perspective = `unset`;
            document.getElementById('fauxBody').style.perspective = `unset`;
        }
    });
}

updatePerspective(
    config.perspective.bodyMin,
    config.perspective.bodyMax,
    config.perspective.fauxBodyMin,
    config.perspective.fauxBodyMax
);
//#endregion

// MIXCLOUD
//#region
let widget;
let mixState = {
    _currentlyPlayingPage: false,
    _currentVolume: 0.8,
    _intervalId: null,
    _lastPage: "categoryList",
    _lastActiveTrack: null,
    _mixcloudHeaderInfo: null,
    _mixcloudTracklist: null,
    _mixcloudItemInfo: null,
    _mixcloudKey: null,
    _previousNumDashes: 0,
    _progress: 0,
    _iframeUrl: "",
    _selectedMixItem: null,
    _status: "paused",
    _timeoutId: null,
    _articles: [],
    _indices: {
        category: 0,
        mix: 0,
        track: 0,
        article: 0
    },

    get currentlyPlayingPage() {
        return this._currentlyPlayingPage;
    },
    set currentlyPlayingPage(value) {
        this._currentlyPlayingPage = value;
    },

    get currentVolume() {
        return this._currentVolume;
    },
    set currentVolume(value) {
        this._currentVolume = value;

        let volumeIndicator = document.getElementById('displayMain');

        let maxVolumeIndicator = 11; // max number of dashes to display
        let dashesCount = Math.round(value * maxVolumeIndicator);

        // Generate dashes
        let dashes = '';
        for (let i = 0; i < dashesCount; i++) {
            dashes += '-<br>';
        }

        volumeIndicator.innerHTML = dashes;
    },

    get intervalId() {
        return this._intervalId;
    },
    set intervalId(value) {
        this._intervalId = value;
    },

    get lastPage() {
        return this._lastPage;
    },
    set lastPage(value) {
        this._lastPage = value;
    },

    get lastActiveTrack() {
        return this._lastActiveTrack;
    },
    set lastActiveTrack(value) {
        this._lastActiveTrack = value;
    },

    get mixcloudHeaderInfo() {
        return this._mixcloudHeaderInfo;
    },
    set mixcloudHeaderInfo(value) {
        this._mixcloudHeaderInfo = value;
    },

    get mixcloudTracklist() {
        return this._mixcloudTracklist;
    },
    set mixcloudTracklist(value) {
        this._mixcloudTracklist = value;
    },

    get mixcloudItemInfo() {
        return this._mixcloudItemInfo;
    },
    set mixcloudItemInfo(value) {
        this._mixcloudItemInfo = value;
    },

    get mixcloudKey() {
        return this._mixcloudKey;
    },
    set mixcloudKey(value) {
        this._mixcloudKey = value;
        this._iframeUrl = config.iframeUrlPrefix + encodeURIComponent(value + "/");

        // Search for the corresponding item in mixcloudItemInfo
        const mixcloudHeaderItem = mixState.mixcloudHeaderInfo.data.find(item => item.mixcloudKey === value);

        // Store the found item in _mixcloudHeaderInfo
        if (mixcloudHeaderItem) {
            this._mixcloudItemInfo = mixcloudHeaderItem;
        } else {
            console.warn('No mixcloudHeaderInfo item found for the provided mixcloudKey');
        }

        this.updateDisplay();
        this.updateScroller();
    },

    get previousNumDashes() {
        return this._previousNumDashes;
    },
    set previousNumDashes(value) {
        this._previousNumDashes = value;
        this.updateDisplay();
    },

    get progress() {
        return this._status;
    },
    set progress(value) {
        this._progress = value;
        this.updateDisplay();
    },

    get iframeUrl() {
        return this._iframeUrl;
    },
    set iframeUrl(value) {
        this._iframeUrl = value;
        this.updateDisplay();
    },

    get selectedMixItem() {
        return this._selectedMixItem;
    },
    set selectedMixItem(value) {
        this._selectedMixItem = value;
    },

    get status() {
        return this._status;
    },
    set status(value) {
        this._status = value;
        this.updateDisplay();
    },

    updateDisplay() {
        const displayDiv = document.querySelector('#stateDisplay pre code');
        displayDiv.innerHTML = JSON.stringify(this, null, 2);
    },
    updateScroller() {
        startScroller(
            "displayMain",
            this._mixcloudItemInfo.name,
            config.output.characterCount,
            config.output.tickInterval,
            config.output.repeatInterval
        );
    },

    get timeoutId() {
        return this._timeoutId;
    },
    set timeoutId(value) {
        this._timeoutId = value;
    },

    get articles() {
        return this._articles;
    },
    set articles(newArticles) {
        if (Array.isArray(newArticles)) { // check if the input is an array
            this._articles = newArticles;
        } else {
            console.error('Expected an array of articles');
        }
    },

    get categoryIndex() {
        return this._indices.category;
    },
    set categoryIndex(val) {
        this._indices.category = val;
    },

    get mixIndex() {
        return this._indices.mix;
    },
    set mixIndex(val) {
        this._indices.mix = 0;
    },

    get trackIndex() {
        return this._indices.track;
    },
    set trackIndex(val) {
        this._indices.track = val;
    },

    get articleIndex() {
        return this._indices.article;
    },
    set articleIndex(val) {
        this._indices.article = val;
    }
};
//#endregion

// MIX CONTROLS
//#region
mixState.articles = articles;

function stopKeyHold() {
    clearTimeout(mixState.timeoutId);
    clearInterval(mixState.intervalId);
}

// Function to increase volume
function volumeUp() {
    const flagVolumeUp = document.querySelector('#flagVolumeUp');
    flagVolumeUp.textContent = "VOL+";

    setTimeout(function() {
        flagVolumeUp.textContent = "";
    }, 500);

    widget.getVolume().then(volume => {
        if (volume + config.volumeIncrement <= 1) {
            let newVolume = volume + config.volumeIncrement;
            mixState.currentVolume = newVolume;
            widget.setVolume(newVolume);
        } else {
            mixState.currentVolume = 1;
            widget.setVolume(1);
        }
    });
}

// Function to decrease volume
function volumeDown() {
    const flagVolumeDown = document.querySelector('#flagVolumeDown');
    flagVolumeDown.textContent = "VOL-";

    setTimeout(function() {
        flagVolumeDown.textContent = "";
    }, 500);

    widget.getVolume().then(volume => {
        if (volume - config.volumeIncrement >= 0) {
            let newVolume = volume - config.volumeIncrement;
            mixState.currentVolume = newVolume;
            widget.setVolume(newVolume);
        } else {
            mixState.currentVolume = 0;
            widget.setVolume(0);
        }
    });
}
//#endregion

// LOAD NEW MIX
//#region
async function loadNewMix(mixcloudKey) {
    // Update mixcloudKey state
    mixState.mixcloudKey = mixcloudKey;

    // Remove previous widget element
    var widgetWrapperElement = document.getElementById('mixcloudWidgetWrapper');
    while (widgetWrapperElement.firstChild) {
        widgetWrapperElement.removeChild(widgetWrapperElement.lastChild);
    }

    // Create and append new widget element
    var newWidgetElement = document.createElement('iframe');
    newWidgetElement.id = 'mixcloudWidget';
    newWidgetElement.width = '100%';
    newWidgetElement.height = '60';
    newWidgetElement.src = mixState.iframeUrl;
    newWidgetElement.frameBorder = '0';
    newWidgetElement.allow = 'autoplay';
    document.getElementById('mixcloudWidgetWrapper').appendChild(newWidgetElement);

    // Initialize the new widget
    await initWidget();

    // Find the current mix in the header info
    currentMix = mixState.mixcloudHeaderInfo.data.find(mix => mix.mixcloudKey === mixcloudKey);

    if (currentMix) {
        document.title = `${currentMix.shortName} - Stef.FM`;
        mixState.updateDisplay();
        mixState.updateScroller();
    }

    let currentMixIndex = mixState.mixcloudHeaderInfo.data.findIndex(mix => mix.mixcloudKey === mixcloudKey);
    if (currentMixIndex > -1) {
        mixState.currentIndex = currentMixIndex;
    } else {
        console.error(`Could not find mix with key ${mixcloudKey} in mixcloudHeaderInfo`);
    }

    mixState.currentlyPlayingPage = false;
    mixState.lastActiveTrack = null;
    mixState.progress = 0;
    mixState.selectedMixItem = null;
    mixState.status = "paused";
    mixState.currentVolume = mixState.currentVolume;

    // Redraw the mix list
    populateMixList(null);
    setCurrentActiveItem(document.getElementById("mixList"), mixState.currentIndex); // This will adjust the scroll
    populateCurrentlyPlaying();
}
//#endregion

// LISTENERS
//#region
function pauseListener() {
    flagPlay.innerHTML = "";
    flagPause.innerHTML = "PAUSE";
}

function playListener() {
    flagPause.innerHTML = "";
    flagPlay.innerHTML = "PLAY";
}

function progressListener(progress, duration) {
    mixState.progress = progress;
    const scale = 11 / duration;
    const numDashes = Math.max(1, Math.ceil(progress * scale));

    if (numDashes !== mixState.previousNumDashes) {
        const progressDiv = document.querySelector('#displayMain + span');
        const dashes = '-'.repeat(numDashes);
        progressDiv.textContent = dashes;
        mixState.previousNumDashes = numDashes;
    }

    // Get the current track
    let currentTrack = getTrackFromTime(progress);

    // Get all the titleCards elements
    let titleCards = Array.from(document.querySelectorAll('.titleCard'));

    // If there are no titleCards, return early to prevent errors
    if (titleCards.length === 0) {
        return;
    }

    titleCards.forEach((titleCard, index) => {
        // Remove the 'selected' class from all titleCards
        titleCard.classList.remove('selected');

        // If the titleCard's track is the current track, add the 'selected' class and scroll it into view
        if (mixState.mixcloudTracklist[index - 1] === currentTrack) {
            titleCard.classList.add('selected');
            // Check if the current track is different from the last active track
            if (mixState.lastActiveTrack !== currentTrack) {
                const playlistDisplay = document.querySelector('#playlistDisplay');

                // Calculate viewport height and offset
                const viewportHeight = playlistDisplay.offsetHeight;
                const offset = viewportHeight / 5; // adjust this value to control where in the viewport the active track appears

                // Calculate adjustedTopPosition to position active track 1/3 of the way down the viewport
                const adjustedTopPosition = titleCard.offsetTop - offset;

                playlistDisplay.scrollTo({
                    top: adjustedTopPosition,
                    behavior: 'smooth'
                });

                // Update lastActiveTrack to the current track
                mixState.lastActiveTrack = currentTrack;
            }
        }
    });
}

function endedListener() {
    selectRandomTrack();
}

//#endregion

// CONTROLS
//#region
function getTrackFromTime(progress) {
    let tracklist = mixState.mixcloudTracklist;

    tracklist.forEach(track => {
        let timeParts = track.startTime.split(':').map(Number);
        track.startInSeconds = timeParts.reduce((total, curr, i) => total + curr * Math.pow(60, timeParts.length - i - 1), 0);
    });

    let currentTrack = tracklist.reduce((current, next) => progress >= current.startInSeconds && progress < next.startInSeconds ? current : next);

    return currentTrack;
}

function togglePlaylist() {
    var playlistElement = document.querySelector('.playlist'); // selecting the first element with 'playlist' class
    var fauxBody = document.getElementById('fauxBody');
    if (playlistElement.style.display === 'none') {
        playlistElement.style.display = 'block';
        fauxBody.classList.remove('single');
    } else {
        playlistElement.style.display = 'none';
        fauxBody.classList.add('single');
    }
}

function play() {
    widget.play();
}

function pause() {
    widget.pause();
}

async function togglePlayPause() {
    const isPaused = await widget.getIsPaused();
    if (isPaused) {
        widget.play();
    } else {
        widget.pause();
    }
}

function skipPrevious() {
    const flagSkipPrevious = document.querySelector('#flagSkipPrevious');
    flagSkipPrevious.textContent = "PREV";

    setTimeout(function() {
        flagSkipPrevious.textContent = "";
    }, 500);

    if (mixState.currentIndex > 0) { // To prevent going negative
        mixState.currentIndex--;
        loadNewMix(mixState.mixcloudHeaderInfo.data[mixState.currentIndex].mixcloudKey);
    }
}

function skipNext() {
    const flagSkipNext = document.querySelector('#flagSkipNext');
    flagSkipNext.textContent = "NEXT";

    setTimeout(function() {
        flagSkipNext.textContent = "";
    }, 500);

    if (mixState.currentIndex < mixState.mixcloudHeaderInfo.data.length - 1) { // To prevent exceeding the number of mixes
        mixState.currentIndex++;
        loadNewMix(mixState.mixcloudHeaderInfo.data[mixState.currentIndex].mixcloudKey);
    }
}

function selectRandomTrack() {
    const randomIndex = Math.floor(Math.random() * mixState.mixcloudHeaderInfo.data.length);
    const randomItem = mixState.mixcloudHeaderInfo.data[randomIndex];
    loadNewMix(randomItem.mixcloudKey);
}
//#endregion

// MENU SETUP
//#region
// Switch view function
function switchView(type) {
    // Define type map
    const typeMap = {
        'mixList': ['categoryList', 'currentlyPlaying', 'articleList', 'article'],
        'currentlyPlaying': ['categoryList', 'mixList', 'articleList', 'article'],
        'categoryList': ['mixList', 'currentlyPlaying', 'articleList', 'article'],
        'articleList': ['categoryList', 'mixList', 'currentlyPlaying', 'article'],
        'article': ['categoryList', 'mixList', 'currentlyPlaying', 'articleList']
    };

    const hidden = typeMap[type];

    // Hide elements
    hidden.forEach(id => {
        let element = document.getElementById(id);
        if (element) element.style.display = 'none';
        while (element.firstChild) element.removeChild(element.firstChild);
    });

    // Show element
    let displayElement = document.getElementById(type);
    if (displayElement) displayElement.style.display = 'block';
}

// Function to show an article by title
function showArticle(event, articleTitle) {
    event.preventDefault(); // prevent default action
    populateArticle(articleTitle); // show the article
}

function createNavigationElement(textContent, onclickFunction) {
    let element = document.createElement("li");
    element.textContent = textContent;
    element.onclick = onclickFunction;
    return element;
}

function createOption(parent, text, action, isSpecial = false) {
    let li = createNavigationElement(text, action);
    if (isSpecial) {
        parent.prepend(li);
    } else {
        parent.appendChild(li);
    }
    return li;
}
//#endregion

// POPULATORS
//#region
function populateList(parentId, backFunction, items, itemFunction) {
    let parent = document.getElementById(parentId);
    parent.innerHTML = ""; // Clear out the old items
    parent.appendChild(createNavigationElement("[ Currently Playing ]", populateCurrentlyPlaying));
    parent.appendChild(createNavigationElement("[ Back ]", backFunction));
    items.forEach((item, index) => {
        let li = document.createElement("li");
        li.textContent = item.name || item.title; // Assumes 'item' is an object with a 'name' or 'title' property
        li.onclick = () => itemFunction(item);
        parent.appendChild(li);
    });
    setCurrentActiveItem(parent, mixState[`${parentId}Index`]);
}

function populateArticleList() {
    switchView('articleList');
    populateList(
        'articleList',
        populateCategoryList,
        mixState.articles,
        (article) => populateArticle(article.title)
    );
    mixState.articleIndex = 0; // Reset the index when entering a list
}

// Populate specific article
function populateArticle(articleTitle) {
    switchView('article');

    let articleView = document.getElementById("article");
    let article = mixState.articles.find(a => a.title === articleTitle);

    if (!article) {
        console.error('No article found with title: ', articleTitle);
        return;
    }

    // Clear previous items
    articleView.innerHTML = '';

    // Add 'Back' option
    createOption(articleView, "[ Back ]", populateArticleList, true);

    // Add 'Currently Playing' option at the top
    createOption(articleView, "[ Currently Playing ]", populateCurrentlyPlaying, true);

    // Add article content
    let titleElement = document.createElement("h3");
    titleElement.textContent = article.title;
    articleView.appendChild(titleElement);

    let authorElement = document.createElement("h4");
    authorElement.textContent = 'By: ' + article.author + ', ' + article.date;
    articleView.appendChild(authorElement);

    let bodyElement = document.createElement("p");
    bodyElement.textContent = article.body;
    articleView.appendChild(bodyElement);

    // Set initial active item
    setCurrentActiveItem(articleView, mixState.articleIndex);
}

function populateCategoryList() {
    switchView('categoryList');
    let categories = mixState.mixcloudHeaderInfo.categories.sort((a, b) => a.name.localeCompare(b.name));
    populateList(
        'categoryList',
        populateMixList.bind(null, null),
        categories,
        (category) => populateMixList(category.code)
    );
    mixState.categoryIndex = 0; // Reset the index when entering a list
}

// Populate mix list
function populateMixList(category) {
    switchView('mixList');

    let mixList = document.getElementById('mixList');

    // Clear previous items
    mixList.innerHTML = '';

    // Add 'Back' option
    createOption(mixList, "[ Back ]", populateCategoryList, true);

    // Add 'Currently Playing' option at the top
    createOption(mixList, "[ Currently Playing ]", populateCurrentlyPlaying, true);

    // Add mixes
    let mixes = mixState.mixcloudHeaderInfo.data;
    if (category) mixes = mixes.filter(item => item.category === category);
    mixes.sort((a, b) => a.shortName.localeCompare(b.shortName)).forEach((item, index) => {
        let li = createOption(mixList, item.shortName, () => {
            mixState.mixcloudKey = item.mixcloudKey;
            loadNewMix(mixState.mixcloudKey);
            if (mixState.selectedMixItem) mixState.selectedMixItem.classList.remove('selected');
            li.classList.add('selected');
            mixState.selectedMixItem = li;
            populateCurrentlyPlaying();
        });

        if (mixState.mixcloudKey === item.mixcloudKey) {
            li.classList.add('selected');
            mixState.selectedMixItem = li;
            mixState.mixIndex = index + 2;
        }
    });

    // Set initial active item
    setCurrentActiveItem(mixList, mixState.mixIndex);
}

// Populate 'Currently Playing' page
async function populateCurrentlyPlaying() {
    switchView('currentlyPlaying');

    let currentlyPlayingList = document.getElementById("currentlyPlaying");

    // Show 'Currently Playing' page, hide category and mix list
    document.getElementById("categoryList").style.display = "none";
    document.getElementById("mixList").style.display = "none";
    currentlyPlayingList.style.display = "block";

    // Add 'Back' option
    let backOption = document.createElement("li");
    backOption.classList.add("nav-item"); // Add "nav-item" class for navigation support
    backOption.textContent = "[ Back ]";
    backOption.onclick = () => {
        mixState.currentlyPlayingPage = false;
        currentlyPlayingList.style.display = "none";
        // if (mixState.mixcloudKey) {
        //     document.getElementById("mixList").style.display = "block";
        //     populateMixList(null);
        // } else {
        document.getElementById("categoryList").style.display = "block";
        populateCategoryList();
        // }
    };
    currentlyPlayingList.appendChild(backOption);

    // Add currently playing mix info
    currentlyPlayingList.appendChild(
        titleCardMixInfo(
            mixState.mixcloudItemInfo.coverArtSmall,
            mixState.mixcloudHeaderInfo.data.find(item => item.mixcloudKey === mixState.mixcloudKey).name,
            mixState.mixcloudItemInfo.duration,
            mixState.mixcloudItemInfo.releaseDate,
            mixState.mixcloudItemInfo.notes
        )
    );

    // Fetch and add track list
    let tracklistData = await fetchTracklist(mixState.mixcloudKey);
    let tracklist = tracklistData.tracks;
    mixState.mixcloudTracklist = tracklist;

    tracklist.forEach((track, index) => {
        // Add currently playing mix info
        currentlyPlayingList.appendChild(
            titleCardTrackInfo(
                track.sectionNumber,
                track.startTime,
                track.coverArtSmall,
                track.trackName,
                track.artistName,
                track.publisher,
                track.remixArtistName
            )
        );
    });

    // Set initial active item
    setCurrentActiveItem(currentlyPlayingList, 0);

    mixState.currentlyPlayingPage = true;
}
//#endregion

// VIEWER PRESENTATION
//#region
function titleCardMixInfo(coverArt, name, duration, releaseDate, notes) {
    let titleCard = document.createElement("li");
    titleCard.classList.add('titleCard');

    let mixNameDiv = document.createElement("h3");
    mixNameDiv.textContent = name;
    titleCard.appendChild(mixNameDiv);

    let coverArtWrapper = document.createElement("div");
    coverArtWrapper.classList.add('coverArtWrapper');

    let coverArtDiv = document.createElement("div");
    coverArtDiv.classList.add('coverArt');
    let image = document.createElement("img");
    image.src = coverArt;
    coverArtDiv.appendChild(image);

    let itemInfoDiv = document.createElement("div");
    itemInfoDiv.classList.add('itemInfo');

    let durationDiv = document.createElement("div");
    durationDiv.textContent = duration;
    itemInfoDiv.appendChild(durationDiv);

    let releaseDateDiv = document.createElement("div");
    releaseDateDiv.textContent = releaseDate;
    itemInfoDiv.appendChild(releaseDateDiv);

    let itemNotes = document.createElement("div");
    itemNotes.classList.add('itemNotes');
    itemNotes.textContent = notes;
    itemInfoDiv.appendChild(itemNotes);

    coverArtWrapper.appendChild(coverArtDiv);
    coverArtWrapper.appendChild(itemInfoDiv);

    titleCard.appendChild(coverArtWrapper);

    return titleCard;
}

function titleCardTrackInfo(sectionNumber, startTime, coverArt, trackName, artistName, publisher, remixArtistName) {
    let titleCard = document.createElement("li");
    titleCard.classList.add('titleCard');

    if (sectionNumber === 1) {
        let mixNameDiv = document.createElement("h3");
        mixNameDiv.textContent = "Track Listing";
        titleCard.appendChild(mixNameDiv);
    }

    let coverArtWrapper = document.createElement("div");
    coverArtWrapper.classList.add('coverArtWrapper');

    let coverArtDiv = document.createElement("div");
    coverArtDiv.classList.add('coverArt');

    if (coverArt) {
        let image = document.createElement("img");
        image.src = coverArt;
        coverArtDiv.appendChild(image);
    } else {
        let placeholder = document.createElement("div");
        placeholder.classList.add('coverArtPlaceholder');
        coverArtDiv.appendChild(placeholder);
    }

    let itemInfoDiv = document.createElement("div");
    itemInfoDiv.classList.add('itemInfo');

    let sectionNumberDiv = document.createElement("div");
    sectionNumberDiv.textContent = `Track ${sectionNumber} - ${startTime}`;
    itemInfoDiv.appendChild(sectionNumberDiv);

    let trackNameDiv = document.createElement("h3");
    trackNameDiv.textContent = trackName;
    itemInfoDiv.appendChild(trackNameDiv);

    let artistNameDiv = document.createElement("div");
    artistNameDiv.textContent = artistName;
    itemInfoDiv.appendChild(artistNameDiv);

    let publisherDiv = document.createElement("div");
    publisherDiv.textContent = publisher;
    itemInfoDiv.appendChild(publisherDiv);

    if (remixArtistName) {
        let remixArtistNameDiv = document.createElement("div");
        remixArtistNameDiv.classList.add('itemNotes');
        remixArtistNameDiv.textContent = `Remixed by ${remixArtistName}`;
        itemInfoDiv.appendChild(remixArtistNameDiv);
    }

    coverArtWrapper.appendChild(coverArtDiv);
    coverArtWrapper.appendChild(itemInfoDiv);

    titleCard.appendChild(coverArtWrapper);

    return titleCard;
}

async function fetchTracklist(mixcloudKey) {
    try {
        let response = await fetch(`mixcloud/tracklist-${mixcloudKey}.json`);
        let data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
    }
}

function getOffsetTop(elem, parent) {
    let offsetTop = 0;
    do {
        if (!isNaN(elem.offsetTop)) {
            offsetTop += elem.offsetTop;
        }
    } while (elem = elem.offsetParent);
    return offsetTop;
}
//#endregion

// NAVIGATORS
//#region
// Set current active item
function setCurrentActiveItem(parent, index) {
    let items = parent.getElementsByTagName("li");
    let parentName = parent.getAttribute('id');

    // Check if index is defined
    if (index === undefined) {
        console.error(`Index is undefined for ${parentName}`);
        return;
    }

    // Ensure index is within valid range
    if (index < 0 || index >= items.length) {
        console.warn(`Invalid index: ${index}`);
        return;
    }

    for (let item of items) item.classList.remove("active");

    if (items.length > 0) {
        items[index].classList.add("active");

        // Use appropriate setter function depending on the parentName
        switch(parentName) {
            case 'categoryList':
                mixState.categoryIndex = index;
                break;
            case 'mixList':
                mixState.mixIndex = index;
                break;
            case 'currentlyPlaying':
                mixState.trackIndex = index;
                break;
            // Add cases for other lists as necessary
        }

        let playlistDisplay = document.querySelector('#playlistDisplay');
        let activeElement = items[index];
        let topPosition = activeElement.offsetTop - (playlistDisplay.offsetHeight * 0.10);
        let maxScrollTop = playlistDisplay.scrollHeight - playlistDisplay.clientHeight;
        let adjustedTopPosition = Math.min(Math.max(topPosition, 0), maxScrollTop);

        playlistDisplay.scrollTo({
            top: adjustedTopPosition,
            behavior: 'smooth'
        });
    }
}

// Navigate up/down options
function navigateOption(direction) {
    let parentName = document.getElementById("categoryList").style.display === "block" ? "categoryList" : (document.getElementById("mixList").style.display === "block" ? "mixList" : "currentlyPlaying");
    let parent = document.getElementById(parentName);

    let currentIndex;
    switch(parentName) {
        case 'categoryList':
            currentIndex = mixState.categoryIndex;
            break;
        case 'mixList':
            currentIndex = mixState.mixIndex;
            break;
        case 'currentlyPlaying':
            currentIndex = mixState.trackIndex;
            break;
        // Add cases for other lists as necessary
    }

    let newIndex = currentIndex + direction;
    setCurrentActiveItem(parent, newIndex);
}

// Navigate left (navigate back)
function navigateLeft() {
    let parentName = getCurrentView();
    
    // Implement left navigation according to the view
    switch (parentName) {
        case 'mixList':
            populateCategoryList();
            break;
        case 'article':
            populateMixList();
            break;
        case 'currentlyPlaying':
            populateCategoryList();
            break;    
        default:
            console.warn(`Unhandled left navigation for view: ${parentName}`);
            break;
    }
}

// Mapping from parent names to index properties
const parentNameToIndexProperty = {
    'categoryList': 'categoryIndex',
    'mixList': 'mixIndex',
    'currentlyPlaying': 'trackIndex',
    // Add more mappings as necessary
};

// Navigate right (select option)
function navigateRight() {
    let parentName = getCurrentView();
    let parent = document.getElementById(parentName);
    let items = parent.getElementsByTagName("li");
    let indexPropertyName = parentNameToIndexProperty[parentName]; // Get the corresponding index property name

    // Ensure valid index range
    if (mixState[indexPropertyName] >= 0 && mixState[indexPropertyName] < items.length) {
        items[mixState[indexPropertyName]].click();
    } else {
        console.error(`No item found at index: ${mixState[indexPropertyName]} for ${parentName}`);
    }
}

function getCurrentView() {
    for (let view of ['categoryList', 'mixList', 'article', 'currentlyPlaying']) {
        if (document.getElementById(view).style.display === 'block') {
            return view;
        }
    }
}
//#endregion

// KEYPRESS BEHAVIOUR
//#region
document.addEventListener("keydown", e => {
    switch (e.code) {
        case "ArrowUp":
            navigateOption(-1);
            break;
        case "ArrowDown":
            navigateOption(1);
            break;
        case "ArrowRight":
            navigateRight();
            break;
        case "ArrowLeft":
            navigateLeft();
            break;
        case "Enter":
            navigateRight();
            break;
        case "Space":
            togglePlayPause();
            break;
        case "KeyJ":
            skipPrevious();
            break;
        case "KeyK":
            togglePlayPause();
            break;
        case "KeyL":
            skipNext();
            break;
        case "KeyA":
            volumeUp();
            break;
        case "KeyZ":
            volumeDown();
            break;
    }
});

// Prevent default
playlistDisplay.addEventListener('keydown', function(e) {
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }
});
//#endregion

// INIT
//#region
async function initWidget() {
    widget = Mixcloud.PlayerWidget(document.getElementById("mixcloudWidget"));

    await widget.ready;

    const buttons = document.getElementsByTagName('button');

    let buttonFocusHandler = function(button) {
        button.classList.add('focus');

        setTimeout(function() {
            button.classList.remove('focus');
        }, 200);
    };

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('focus', function() {
            buttonFocusHandler(this);
        });
    }

    widget.setVolume(mixState.currentVolume);
}

async function handleWidgetEvents() {
    await widget.ready;

    if (widget.events) {
        if (widget.events.pause) {
            widget.events.pause.on(pauseListener);
        }
        if (widget.events.play) {
            widget.events.play.on(playListener);
        }
        if (widget.events.progress) {
            widget.events.progress.on(progressListener, widget.getDuration());
        }
        if (widget.events.ended) {
            widget.events.ended.on(endedListener);
        }
    }
}

// Select the node that will be observed for mutations
let mutationObserverTargetNode = document.getElementById('mixcloudWidgetWrapper');

// Options for the observer (which mutations to observe)
let mutationObserverConfig = {
    childList: true
};

// Callback function to execute when mutations are observed
let mutationObserverCallback = function(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            for (let node of mutation.addedNodes) {
                // Check if the added node is an iframe with the id "mixcloudWidget"
                if (node.nodeName.toLowerCase() === 'iframe' && node.id === 'mixcloudWidget') {
                    handleWidgetEvents();
                }
            }
        }
    }
};

// Create an observer instance linked to the callback function
let widgetObserver = new MutationObserver(mutationObserverCallback);

// Start observing the target node for configured mutations
widgetObserver.observe(mutationObserverTargetNode, mutationObserverConfig);

// Initialize widget and event listeners when page loads
window.onload = function() {
    // init
    fetch('mixcloud/mixesheader.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(json => {
            mixState.mixcloudHeaderInfo = json;

            if (config.loadMixcloud) {
                selectRandomTrack();
            }

            populateCategoryList();
        })
        .catch(function(err) {
            console.log("Failed to load mixcloud/mixesheader.json file", err);
            globalError = true;
        });

    document.body.addEventListener('click', function(event) {
        if (event.target.tagName.toLowerCase() === 'li' && event.target.classList.contains('mix-item')) {
            loadNewMix(event.target.getAttribute('data-key'));
        }
    });

    document.getElementById('volumeUp').addEventListener('mousedown', volumeUp);
    document.getElementById('volumeDown').addEventListener('mousedown', volumeDown);
    document.getElementById('upButton').addEventListener('click', function() {
        navigateOption(-1);
    });
    document.getElementById('downButton').addEventListener('click', function() {
        navigateOption(1);
    });
    document.getElementById('rightButton').addEventListener('click', navigateRight);
    document.getElementById('leftButton').addEventListener('click', navigateLeft);
    document.getElementById('togglePlaylist').addEventListener('click', togglePlaylist);
    document.getElementById('play').addEventListener('click', play);
    document.getElementById('pause').addEventListener('click', pause);
    document.getElementById('skipPrevious').addEventListener('click', skipPrevious);
    document.getElementById('skipNext').addEventListener('click', skipNext);
    document.getElementById('shuffle').addEventListener('click', selectRandomTrack);
    document.getElementById('about').addEventListener('click', function(event) {
        const articleTitle = "About Stef.FM";
        showArticle(event, articleTitle);
    });
};
//#endregion
