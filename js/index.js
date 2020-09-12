
const api = {
    key: "6a41cf11109a848f1463b2e373b4ff69",
    baseUrl: "https://api.openweathermap.org/data/2.5/"
}

const welcome = document.querySelector('.welcome');
const loader = document.querySelector('.loader');
const main = document.querySelector('.main');
const message = document.querySelector('.message');

const searchBox = document.querySelector('.search-box');
searchBox.addEventListener('keypress', setQuery);

const show = {
    height: '248px',
    overflow: 'visible'
}

const show_small = {
    height: '200px',
    overflow: 'visible'
}

const show_unset = {
    height: 'unset',
    overflow: 'visible'
}

const hide = {
    height: '0px',
    overflow: 'hidden'
}

function setQuery(evt) {
    if (evt.keyCode === 13) {
        getResults(searchBox.value); 
    }
}

const current = document.querySelector('.current');
const fetch_message = document.querySelector('.fetch-message');

function fetchingWeatherData(fetchMessage) {
    Object.assign(loader.style, show);
    Object.assign(welcome.style, hide);
    Object.assign(main.style, hide);
    Object.assign(current.style, hide);
    console.log(fetchMessage);
    fetch_message.innerHTML = fetchMessage;
}

function fetchError(errorMessage) {
    Object.assign(loader.style, hide); 
    Object.assign(welcome.style, show);
    Object.assign(main.style, hide);
    Object.assign(current.style, hide);
    console.log(errorMessage);
    message.innerHTML = errorMessage;
}

function getResults(query) {
    //Show loader to signify fetch is ongoing & hide other things
    fetchingWeatherData(`Fetching weather data for <span class="colored">${query}</span>...`);
    document.querySelector('.colored').style.color = 'yellow';

    //Use user query to fetch data that will produce the longitude & latitude for forecast fetch
    let userQuery = fetch(`${api.baseUrl}weather?q=${query}&units=metric&APPID=${api.key}`);

    userQuery.then(response => {
        return response.json();
    },
    error => {
        console.log(error);
        switch(error.code) {
            case error.INTERNET_DISCONNECTED:
                fetchError('Internet disconnected. Check your connection & try again...');
                break;
            case error.NETWORK_CHANGED:
                fetchError('Network changed! Check your connection & try again...');
                break;  
            case error.TIMED_OUT:
                fetchError('Timed out! Check your connection & try again...');
                break;  
            default:
                fetchError('Could not connect to server, please try again...');
        }
    })
    .then(displayResults);

    /*-------------------------------------------
    Trying to implement service worker cache here
    --------------------------------------------*/
    getResultsFromCache(query)
    /*.then(response => {
        return response.json();
    })*/
    //.then(displayResults);
    console.log(getResultsFromCache(query));
    /*------------------end---------------------*/
}


function displayResults(response) {

    if (response.name === undefined) {
        fetchError(`"${searchBox.value}" does not not exist in Open Weather Map API database.`);
    }
   
    const city = document.querySelector('.location .city');
    city.innerText = `${response.name}, ${response.sys.country}`;

    //Use longitude and latitude obtained from user's query/search for fetch forecast data
    console.log(`lat: ${response.coord.lat}, lon: ${response.coord.lon}`);
        
    let automatedQuery = fetch(`${api.baseUrl}onecall?lat=${response.coord.lat}&lon=${response.coord.lon}&exclude=hourly&units=metric&appid=${api.key}`);
    
    /*-------------------------------------------
    Trying to implement service worker cache here
   --------------------------------------------*/
    /*getForecastFromCache(response); 
        /*.then(forecast => {
            return forecast.json();
        })*\/
        //.then(displayforecast);
    console.log(getForecastFromCache(response));*/
    /*------------------end---------------------*/
    
    automatedQuery.then(forecast => {
        return forecast.json();

    }).then(displayforecast);
    Object.assign(loader.style, show_small);
    Object.assign(main.style, show_unset);


   /*  //find out when response was last updated


    const cardLastUpdatedElem = document.querySelector('.card-last-updated');
    const cardLastUpdated = cardLastUpdatedElem.textContent;
    
    //const cardLastUpdated = cardLastUpdatedElem.textContent;
    console.log(cardLastUpdated);
    const lastUpdated = parseInt(cardLastUpdated);
    console.log(lastUpdated);
    console.log(response.dt);

    // If the data on the element is newer, skip the update.
    if (lastUpdated >= response.dt) {
      return;
    }

    cardLastUpdatedElem.textContent = response.dt;
    console.log(cardLastUpdatedElem.textContent);*/
}

function displayforecast(forecast) {
   
    let unix_time = forecast.current.dt * 1000;
    let now = new Date(unix_time);
    console.log(now.toDateString());

    const date = document.querySelector('.location .date');
    date.innerText = now.toDateString();

    let temp = document.querySelector('.current .temp');
    temp.innerHTML = `${Math.round(forecast.current.temp)}<span>&deg;c</span>`;

    let icon = document.querySelector('#icon');
    icon.src = `https://openweathermap.org/img/wn/${forecast.current.weather[0].icon}@2x.png`; //remove @2x to get a smaller img

    let weather_el = document.querySelector('.current .weather');
    weather_el.innerHTML = forecast.current.weather[0].main; //weather[0] as weather in the json is an array.


    //This part is working but is a work in progress both design & javascript...
    
    let daily_date = document.querySelectorAll('.forecast .date');
    daily_date.forEach(function (date, index) {
        unix_time = forecast.daily[index].dt * 1000;
        now = new Date(unix_time);
        console.log(now.toDateString());
        date.innerHTML = now.toDateString();
    });
    
    let daily_temp = document.querySelectorAll('.forecast .temp');
    daily_temp.forEach(function (temp, index) {
        console.log(temp);
        temp.innerHTML = `${Math.round(forecast.daily[index].temp.min)}<span>&deg;c</span>`;
    });

    let daily_icon = document.querySelectorAll('.small-icon');
    daily_icon.forEach(function (icon, index) {
        console.log(icon);
        icon.src = `https://openweathermap.org/img/wn/${forecast.daily[index].weather[0].icon}.png`; //remove @2x to get a smaller img
    });

    const daily_weather = document.querySelectorAll('.forecast .weather');
    daily_weather.forEach(function (weather, index) {
        console.log(weather);
        weather.innerHTML = forecast.daily[index].weather[0].main;
    });
    
    Object.assign(current.style, show_unset);
    Object.assign(loader.style, hide);
    Object.assign(main.style, show);
}


 //----------- Service Worker Cache ------------------------------

 //for query
 function getResultsFromCache(query) {
    if (!('caches' in window)) {
        return null;
    }

    const url = `${window.location.origin}/${api.baseUrl}weather?q=${query}&units=metric&APPID=${api.key}`;
    return caches.match(url)
        .then((response) => {
            if (response) {
                return response.json();
            }
            return null;
        })
        .catch((err) => {
            console.error('Error getting data from cache', err);
            return null;
        });
}

//for forecast
/*
function getForecastFromCache(response) {
    if (!('caches' in window)) {
        return null;
    }

    const url = `${window.location.origin}/${api.baseUrl}onecall?lat=${response.coord.lat}&lon=${response.coord.lon}&exclude=hourly&units=metric&appid=${api.key}`;
    return caches.match(url)
        .then((forcast) => {
            if (forcast) {
                return forecast.json();
            }
            return null;
        })
        .catch((err) => {
            console.error('Error getting data from cache', err);
            return null;
        });
}
*/
