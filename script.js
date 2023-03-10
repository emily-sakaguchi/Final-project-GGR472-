/*--------------------------------------------------------------------
GGR472 Lab 3
JavaScript
--------------------------------------------------------------------*/


//Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZW1pbHlzYWthZ3VjaGkiLCJhIjoiY2xkbTByeWl5MDF5YjNua2RmdWYyZ240ciJ9.l0mkQSD3VSua3-9301GQbA';

//Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/emilysakaguchi/clexsrdwn000901nllrb8b6wy',
    center: [-79.371, 43.720], //these cooraintes load Toronto at the centre of the map
    zoom: 10.5, //this zooms to show all of Toronto, so users can explore by zooming in to areas of interest
    maxBounds: [
        [-180, 30], // Southwest
        [-25, 84]  // Northeast
    ],
});

/*--------------------------------------------------------------------
ADDING MAPBOX CONTROLS AS ELEMENTS ON MAP
--------------------------------------------------------------------*/
//Adds buttons for zoom and rotation to the map.
map.addControl(new mapboxgl.NavigationControl());

//Adds a button to make the map fullscreen
map.addControl(new mapboxgl.FullscreenControl());

/*--------------------------------------------------------------------
GEOCODER
- this will allow users to search for locations and see them on the map
--------------------------------------------------------------------*/

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: "ca" //Location is set to Canada because the map is of Toronto, Canada
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map)); //adds geocoder to map

/*--------------------------------------------------------------------
DATA
- The first data set is a tilset layer of neighbourhoods in Toronto
- The tileset is convenient for the large size of the data (many attributes recorded for each)
- I will be looking at neighbourhood improvement areas, a municipal designation that guides planning decisions
--------------------------------------------------------------------*/

map.on('load', () => {
    map.addSource('neighbourhoodsTO', {
        'type': 'vector',
        'url': 'mapbox://emilysakaguchi.bsiq2wyk' 
    });

    map.addLayer({
        'id': 'neighbourhoods-fill',
        'type': 'fill',
        'source': 'neighbourhoodsTO',
        'paint': {
            'fill-color': [
              'match', //this allows for categorical colour values
              ['get', 'CLASSIFICATION'], //Classification of neighbourhood status (improvement area, etc.) is the category of interest
              'Not an NIA or Emerging Neighbourhood',
              '#99e600', //lime green
              'Neighbourhood Improvement Area', 
              '#F7d125', //soft red
              'Emerging Neighbourhood',
              '#Ff6700', //neutral yellow
              'grey'
              ],
            'fill-opacity': 0.5, //Opacity set to 50%
            'fill-outline-color': 'white'
        },
        'source-layer': 'Neighbourhoods-90ored'
    });
  
    //The same polygon layers of neighbouroods with different visualization (for the hover event)
    map.addLayer({
        'id': 'neighbourhoods-opaque', //New ID for the highlighted layer
        'type': 'fill',
        'source': 'neighbourhoodsTO',
        'paint': {
            'fill-color': [
                'match', //this allows for categorical colour values
                ['get', 'CLASSIFICATION'],
                'Not an NIA or Emerging Neighbourhood',
                '#99e600', //lime green
                'Neighbourhood Improvement Area', 
                '#F7d125', //soft red
                'Emerging Neighbourhood',
                '#Ff6700', //neutral yellow
                'grey'
                ],
            'fill-opacity': 1, //Opacity set to 100%
            'fill-outline-color': 'white'
        },
        'source-layer': 'Neighbourhoods-90ored',
        'filter': ['==', ['get', '_id'], ''] //Initial filter (returns nothing)
    });


    /*--------------------------------------------------------------------
    HOVER EVENT
    - if a neighbourhood polygon is under the mouse hover, it will turn opaque
    --------------------------------------------------------------------*/

    map.on('mousemove', 'neighbourhoods-fill', (e) => {
        if (e.features.length > 0) { //determines if there is a feature under the mouse
            map.setFilter('neighbourhoods-opaque', ['==', ['get', '_id'], e.features[0].properties._id]); //applies the filter set above
        }
    });
    
    map.on('mouseleave', 'neighbourhoods-opaque', () => { //removes the highlight when the mouse moves away
        map.setFilter("neighbourhoods-opaque",['==', ['get', '_id'], '']);
    });

    /*--------------------------------------------------------------------
    LOADING GEOJSON FROM GITHUB
    --------------------------------------------------------------------*/
    map.addSource('cafesjson',{
    'type': 'geojson', //geojson format will allow me to execute future GIS analysis on this same data using Turf.js
    'data': 'https://raw.githubusercontent.com/emily-sakaguchi/lab_3/main/CafeTO%20parklet.geojson' //link to the github raw data
    })

    map.addLayer({
        'id': 'cafe-parklets',
        'type':'circle',
        'source': 'cafesjson',
        'paint': {
            'circle-radius':['interpolate', ['linear'], ['zoom'], 9, 1, 10.5, 2, 12, 3, 15, 5],
            // the above code adjusts the size of points according to the zoom level
            'circle-color':'blue'
        }
    });
});

/*--------------------------------------------------------------------
LEGEND
--------------------------------------------------------------------*/
//Declare array variables for labels and colours
var legendlabels = [ //I use var rather than const here to provide myself with flexiblity as the legend changes
    'Not an NIA or Emerging Neighbourhood',
    'Neighbourhood Improvement Area', 
    'Emerging Neighbourhood',
    'Curb lane/parklet café'
];

var legendcolours = [ //I use var rather than const here to provide myself with flexiblity as the legend changes
    '#99e600', // lime green for 'Not an NIA or Emerging Neighbourhood'
    '#F7d125', // soft red for 'Neighbourhood Improvement Area'
    '#Ff6700', // neutral yellow for 'Emerging Neighbourhood'
    'blue' // curb lane/parklet café
];

//legend variable that corresponds to legend div tag in html
const legend = document.getElementById('legend');

//Creates a legend block containing colours and labels
legendlabels.forEach((label, i) => {
    const color = legendcolours[i];

    const item = document.createElement('div'); //creates the rows
    const key = document.createElement('span'); //adds a key (circle of colour) to the row

    key.className = 'legend-key'; //style proprties assigned in style.css
    key.style.backgroundColor = color; //the color is assigned in the layers array

    const value = document.createElement('span'); //adds a value to each row 
    value.innerHTML = `${label}`; //adds a text label to the value 

    item.appendChild(key); //appends the key to the legend row
    item.appendChild(value); //appends the value to the legend row

    legend.appendChild(item); //appends each row to the legend
});


/*--------------------------------------------------------------------
INTERACTIVITY
- check boxes and buttons
--------------------------------------------------------------------*/

//event listener to return map view to full screen on button click
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.371, 43.720],
        zoom: 10.5,
        essential: true
    });
});

//Legend display (check box)
let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true; //when checked (true), the legend block is visible
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none"; 
        legendcheck.checked = false; //when unchecked (false), the legend block is not displayed
    }
});

//Neighbourhood layer display (check box)
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'neighbourhoods-fill',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});
//this ensures that unchecking the neighbourhoods layer will remove all polygons, even if one is highlighted
document.getElementById('layercheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'neighbourhoods-opaque',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

/*--------------------------------------------------------------------
POP-UP ON CLICK EVENT
- When the cursor moves over the map, it changes from the default hand to a pointer
- When the cursor clicks on a neighbourhood, the name and classification will appear in a pop-up
--------------------------------------------------------------------*/
map.on('mouseenter', 'neighbourhoods-fill', () => {
    map.getCanvas().style.cursor = 'pointer'; //Switches cursor to pointer when mouse is over provterr-fill layer
});

map.on('mouseleave', 'neighbourhoods-fill', () => {
    map.getCanvas().style.cursor = ''; //Switches cursor back when mouse leaves neighbourhood-fill layer
});


map.on('click', 'neighbourhoods-fill', (e) => {
    new mapboxgl.Popup() //Declares a new popup on each click
        .setLngLat(e.lngLat) //Coordinates of the mouse click to determine the coordinates of the pop-up
        //Text for the pop-up:
        .setHTML("<b>Neighbourhood name:</b> " + e.features[0].properties.AREA_NAME + "<br>" +// shows neighbourhood name
            "<b>Improvment status:</b> " + e.features[0].properties.CLASSIFICATION) //shows neighbourhood improvement status
        .addTo(map); //Adds the popup to the map
})
