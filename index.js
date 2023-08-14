// make variables for the html elements
const latitudeInput = document.getElementById("latitudeInput");
const longitudeInput = document.getElementById("longitudeInput");
const getCoordinatesButton = document.getElementById("getCoordinatesButton");
const dataPlotArea = document.getElementById("dataPlot");
const dataResultArea = document.getElementById("mainResults");

// state variables for latitude and longitude
let latitude = 0;
let longitude = 0;

latitudeInput.value = 0;
longitudeInput.value = 0;

// setup a map view
var map = L.map('map').setView([latitude, longitude], 2);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// and create a pin to drop on the map
var popup = L.popup();

function dropPin(lat,lon,msg) {
    popup
        .setLatLng([lat,lon])
        .setContent(msg)
        .openOn(map);
}


// This is the base URL for Open-Meteo weather forecast service
const apiBaseURL = "https://api.open-meteo.com/v1/"
// 
// Make a GET api request
async function getRequest(endpoint) {
    dataResultArea.innerHTML = "";
    const response = await fetch(`${apiBaseURL}${endpoint}`);
    const result = await response.json();
    
    let objResult = (typeof result == "object") ? result  : JSON.parse(result);
    let strResult = JSON.stringify(objResult, undefined, 2);
    dataResultArea.innerHTML = `<pre><code>${strResult}</code></pre>`;
    return objResult;
}

// Use the general function above for a particular request
async function getCurrentWeather(lat, lng) {
    const result = await getRequest(`forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
    return result;
}

// when the coordinates change somehow, propagate that change everywhere
async function updateCoords(lat, lng) {
    // make sure longitude is in the range (-180, 180]
    while (lng <= -180) {
        lng += 360;
    }
    while (lng > 180) {
        lng -= 360;
    }
    
    // store the new coordinates in state variables
    latitude = lat;
    longitude = lng;
    
    // put these values into the latitude/longitude text boxes
    latitudeInput.value = latitude.toFixed(4); 
    longitudeInput.value = longitude.toFixed(4);

    // get the current weather for this location
    let result = await getCurrentWeather(latitude, longitude);
    let wc = result["current_weather"]["weathercode"];    
    let msg = weatherCodeToMessage(wc);

    // move the pin on the map to this location and set the msg
    dropPin(latitude, longitude, msg);

    // move the map to focus on this
    let currentMapZoom = map.getZoom();
    let newMapZoom = Math.max(currentMapZoom, 4);
    map.setView([latitude, longitude], newMapZoom);

}


// Button for getting current location
getCoordinatesButton.addEventListener('click', (event) => {
    if (! "geolocation" in navigator) { alert("Location services not available"); return; }
    navigator.geolocation.getCurrentPosition((position) => {
        updateCoords(position.coords.latitude, position.coords.longitude);
    });
});


// Also allow for manual entry of latitude and longitude
latitudeInput.addEventListener('change', (event) => {
    try {
        let lat = parseFloat(latitudeInput.value);
        let lng = parseFloat(longitudeInput.value);
        updateCoords(lat, lng);
    } catch(e) {
        console.log(e);
    }    
})

longitudeInput.addEventListener('change', (event) => {
    updateCoords(latitudeInput.value, longitudeInput.value);
})


// or enter coords by clicking on map
async function onMapClick(e) {
    updateCoords(e.latlng.lat, e.latlng.lng);
}

map.on('click', onMapClick);


// interpret the weathercode result from a current weather request
function weatherCodeToMessage(wc) {
    if (wc == 0) {
        return "clear sky";
    } else if (wc == 1) {
        return "mainly clear";
    } else if (wc == 2) {
        return "partly cloudy";
    } else if (wc == 3) {
        return "overcast";
    } else if (wc == 45) {
        return "fog";
    } else if (wc == 48) {
        return "depositing rime fog";
    } else if (wc == 51) {
        return "light drizzle";
    } else if (wc == 52) {
        return "moderate drizzle";
    } else if (wc == 52) {
        return "heavy drizzle";
    } else if (wc == 56) {
        return "light freezing drizzle";
    } else if (wc == 57) {
        return "dense freezing drizzle";
    } else if (wc == 61) {
        return "slight rain";
    } else if (wc == 63) {
        return "moderate rain";
    } else if (wc == 65) {
        return "heavy rain";
    } else if (wc == 66) {
        return "light freezing rain";
    } else if (wc == 66) {
        return "heavy freezing rain";
    } else if (wc == 71) {
        return "slight snow fall";
    } else if (wc == 73) {
        return "moderate snowfall";
    } else if (wc == 73) {
        return "heavy snowfall";
    } else if (wc == 77) {
        return "snow grains";
    } else if (wc == 80) {
        return "slight rain showers";
    } else if (wc == 81) {
        return "moderate rain showers";
    } else if (wc == 82) {
        return "violent rain showers";
    } else if (wc == 85) {
        return "slight snow showers";
    } else if (wc == 86) {
        return "heavy snow showers";
    } else if (wc == 95 || wc == 96 || wc == 99) {
        return "thunderstorm";
    }
}

