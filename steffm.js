// --- GLOBAL CONSTANTS AND VARIABLES ---
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
        "bodyMin": 25,
        "bodyMax": 30,
        "fauxBodyMin": 15,
        "fauxBodyMax": 45
    }
};

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

// MIXCLOUD
let widget;
let mixState = {
    _currentIndex: 0,
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

    get currentIndex() {
        return this._currentIndex;
    },
    set currentIndex(value) {
        this._currentIndex = value;
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
    }

};

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

async function loadNewMix(mixcloudKey) {
    console.log("loadNewMix");

    // Update mixcloudKey state
    mixState.mixcloudKey = mixcloudKey;

    // Remove previous widget element
    var widgetWrapperElement = document.getElementById('mixcloudWidgetWrapper');
    while (widgetWrapperElement.firstChild) {
        widgetWrapperElement.removeChild(widgetWrapperElement.lastChild);
    }

    // Create and append new widget element
    console.log("About to create new widget-----------------------------------------");
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

    // Redraw the mix list
    populateMixList(null);
    setCurrentActiveItem(document.getElementById("mixList"), mixState.currentIndex); // This will adjust the scroll
    populateCurrentlyPlaying();
}

function pauseListener() {
    console.log("pauseListener");
    flagPlay.innerHTML = "";
    flagPause.innerHTML = "PAUSE";
}

function playListener() {
    console.log("playListener");
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
    if (playlistElement.style.display === 'none') {
        playlistElement.style.display = 'block';
    } else {
        playlistElement.style.display = 'none';
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
    console.log("selectRandomTrack");

    const randomIndex = Math.floor(Math.random() * mixState.mixcloudHeaderInfo.data.length);
    const randomItem = mixState.mixcloudHeaderInfo.data[randomIndex];
    loadNewMix(randomItem.mixcloudKey);
}

function endedListener() {
    selectRandomTrack();
}

// Populate category list
function populateCategoryList() {
    let categoryList = document.getElementById('categoryList');
    let mixList = document.getElementById('mixList');
    let currentlyPlayingList = document.getElementById('currentlyPlaying');

    // Clear the existing list
    while (categoryList.firstChild) categoryList.removeChild(categoryList.firstChild);

    // Hide the other views
    mixList.style.display = 'none';
    currentlyPlayingList.style.display = 'none';

    // Show the category list
    categoryList.style.display = 'block';

    // Add 'All' option
    let allOption = document.createElement("li");
    allOption.textContent = "[ All ]";
    allOption.onclick = () => populateMixList(null);
    categoryList.appendChild(allOption);

    // Add 'Currently Playing' option at the top
    let currentlyPlayingOption = document.createElement("li");
    currentlyPlayingOption.textContent = "[ Currently Playing ]";
    currentlyPlayingOption.onclick = populateCurrentlyPlaying;
    categoryList.prepend(currentlyPlayingOption);

    // Add categories
    let categories = mixState.mixcloudHeaderInfo.categories.sort((a, b) => a.name.localeCompare(b.name));
    categories.forEach((item, index) => {
        let li = document.createElement("li");
        li.textContent = item.name;
        li.onclick = () => populateMixList(item.code);
        categoryList.appendChild(li);
    });

    // Set initial active item
    setCurrentActiveItem(categoryList, 0);
}

// Populate mix list
function populateMixList(category) {
    let mixList = document.getElementById('mixList');
    let categoryList = document.getElementById('categoryList');
    let currentlyPlayingList = document.getElementById('currentlyPlaying');

    // Clear the existing list
    while (mixList.firstChild) mixList.removeChild(mixList.firstChild);

    // Hide the other views
    categoryList.style.display = 'none';
    currentlyPlayingList.style.display = 'none';

    // Show the mix list
    mixList.style.display = 'block';

    // Add 'Back' option
    let backOption = document.createElement("li");
    backOption.textContent = "[ Back ]";
    backOption.onclick = populateCategoryList;
    mixList.appendChild(backOption);

    // Add 'Currently Playing' option at the top
    let currentlyPlayingOption = document.createElement("li");
    currentlyPlayingOption.textContent = "[ Currently Playing ]";
    currentlyPlayingOption.onclick = populateCurrentlyPlaying;
    mixList.prepend(currentlyPlayingOption);

    // Add mixes
    let mixes = mixState.mixcloudHeaderInfo.data;
    if (category) mixes = mixes.filter(item => item.category === category);
    mixes.sort((a, b) => a.shortName.localeCompare(b.shortName)).forEach(item => {
        let li = document.createElement("li");
        li.textContent = item.shortName;
        li.onclick = () => {
            mixState.mixcloudKey = item.mixcloudKey;
            loadNewMix(mixState.mixcloudKey);
            if (mixState.selectedMixItem) mixState.selectedMixItem.classList.remove('selected');
            li.classList.add('selected');
            mixState.selectedMixItem = li;
            populateCurrentlyPlaying();
        };
        if (mixState.mixcloudKey === item.mixcloudKey) {
            li.classList.add('selected');
            mixState.selectedMixItem = li;
        }
        mixList.appendChild(li);
    });

    // Set initial active item
    if (mixState.mixcloudKey) {
        let index = mixes.findIndex(item => item.mixcloudKey === mixState.mixcloudKey);
        setCurrentActiveItem(mixList, index !== -1 ? index + 2 : 0); // Add 2 to index to account for 'Back' and 'Currently Playing' options
    } else {
        setCurrentActiveItem(mixList, 0);
    }
}

// Populate 'Currently Playing' page
async function populateCurrentlyPlaying() {
    let currentlyPlayingList = document.getElementById("currentlyPlaying");

    // Clear list
    while (currentlyPlayingList.firstChild) currentlyPlayingList.removeChild(currentlyPlayingList.firstChild);

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
        if (mixState.mixcloudKey) {
            document.getElementById("mixList").style.display = "block";
            populateMixList(null);
        } else {
            document.getElementById("categoryList").style.display = "block";
            populateCategoryList();
        }
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

// Set current active item
function setCurrentActiveItem(parent, index) {
    let items = parent.getElementsByTagName("li");

    // Ensure index is within valid range
    if (index < 0 || index >= items.length) {
        console.warn(`Invalid index: ${index}`);
        return;
    }

    for (let item of items) item.classList.remove("active");

    if (items.length > 0) {
        items[index].classList.add("active");
        //mixState.currentIndex = index;

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
    let parent;
    if (document.getElementById("categoryList").style.display !== "none") {
        parent = "categoryList";
    } else if (document.getElementById("mixList").style.display !== "none") {
        parent = "mixList";
    } else {
        parent = "currentlyPlaying";
    }

    let items = document.getElementById(parent).getElementsByTagName("li");
    mixState.currentIndex += direction;
    if (mixState.currentIndex < 0) mixState.currentIndex = items.length - 1;
    if (mixState.currentIndex >= items.length) mixState.currentIndex = 0;
    setCurrentActiveItem(document.getElementById(parent), mixState.currentIndex);
}

// Navigate left (go back)
function navigateLeft() {
    if (mixState.currentlyPlayingPage) {
        document.getElementById("currentlyPlaying").style.display = "none";

        // Show the last active page
        if (mixState.lastPage === "categoryList") {
            document.getElementById("categoryList").style.display = "block";
            mixState.currentlyPlayingPage = false;
            mixState.currentIndex = 0;
            populateCategoryList();
        } else if (mixState.lastPage === "mixList") {
            document.getElementById("mixList").style.display = "block";
            mixState.currentlyPlayingPage = false;
            mixState.currentIndex = 0;
            populateMixList(null);
        }
    } else if (document.getElementById("mixList").style.display !== "none") {
        document.getElementById("mixList").style.display = "none";
        document.getElementById("categoryList").style.display = "block";
        mixState.lastPage = "categoryList";
        mixState.currentIndex = 0;
        populateCategoryList();
    }
}

// Navigate right (select option)
function navigateRight() {
    let parent = document.getElementById("categoryList").style.display === "block" ? "categoryList" : (document.getElementById("mixList").style.display === "block" ? "mixList" : "currentlyPlaying");
    let items = document.getElementById(parent).getElementsByTagName("li");

    if (items[mixState.currentIndex].textContent === "[ Currently Playing ]") {
        mixState.lastPage = parent;
        populateCurrentlyPlaying();
    } else if (items[mixState.currentIndex].textContent === "[ Back ]" && parent === "currentlyPlaying") {
        navigateLeft();
    } else {
        items[mixState.currentIndex].click();
    }
}

// Listen for keypresses
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

async function initWidget() {
    widget = Mixcloud.PlayerWidget(document.getElementById("mixcloudWidget"));
    console.log("Mixcloud widget ready");

    await widget.ready;
    console.log("widget ready", widget);

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
    console.log("handleWidgetEvents");
    await widget.ready;

    if (widget.events) {
        console.log("widget.events is true");
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
let mutationObserverConfig = { childList: true };

// Callback function to execute when mutations are observed
let mutationObserverCallback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            for(let node of mutation.addedNodes) {
                // Check if the added node is an iframe with the id "mixcloudWidget"
                if(node.nodeName.toLowerCase() === 'iframe' && node.id === 'mixcloudWidget') {
                    console.log("New Mixcloud widget has been added to the DOM");
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
    console.log("onload");

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
};