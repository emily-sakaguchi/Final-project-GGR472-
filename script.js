/*--------------------------------------------------------------------
GGR472 Final Project
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
- We fetch data from GitHub and conver it intp JSON for compatability woht Turf.js analysis
- We load data for subway stations, neighbourhoods, buffers, bus routes, cycling routes, and CafeTO patios
--------------------------------------------------------------------*/

// Empty variable for subway stations
let substns;

// Fetch GeoJSON from github URL, convert response to JSON, and store response as variable 
fetch('https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/subway-stations.geojson')
    .then(response => response.json())      // Store response as JSON format
    .then(response => {
        console.log(response);      // Check response in console
        substns = response;       // Store GeoJSON as "substns" variable
    });
    
let neighbourhoodsjson; // Empty variable for neighbourhoods

    fetch('https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/Final_clean_neighbourhoods140.geojson')
    .then(response => response.json()) // Converts the response to JSON format  
    .then(response => {
        console.log(response); //Checking the response in console
        neighbourhoodsjson = response; // Stores the response in the variable created above
    });

    
let cafejson; // Empty variable for CafeTO locations

    fetch('https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/CafeTO%20parklet.geojson%20copy')
    .then(response => response.json()) // Converts the response to JSON format  
    .then(response => {
        console.log(response); //Checking the response in console
        cafejson = response; // Stores the response in the variable created above
    });
// Loading data into the map
map.on('load', () => {

    map.addSource('subway-stns',{
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/subway-stations.geojson' 
    });

    // Adds subway stations layer to map
    map.addLayer({
        'id': 'subway-stations',
        'type': 'circle',
        'source': 'subway-stns',
        'paint': {
            'circle-radius': 4,
            'circle-color': '#B42222' // red
        }
    });
    
    map.addSource('neighbourhoodsTO_geojson', {
        type: 'geojson',
        data: neighbourhoodsjson //using the variable created to store the neighbourhood data
    });

    map.addLayer({
        'id': 'neighbourhoods-fill',
        'type': 'fill',
        'source': 'neighbourhoodsTO_geojson',
        'paint': {
            'fill-color': 'black',
            'fill-opacity': 0.5, //Opacity set to 50%
            'fill-outline-color': 'white'
        },
    },
    'subway-stations', //Sets the drawing orer so the subways, buffers, bus routes, and cycling layers are on top of neighbourhoods
    'subwaystn-buff',
    'bus-routes',
    'cycling'
    );

    //The same polygon layers of neighbouroods with different visualization (for the hover event)
    map.addLayer({
        'id': 'neighbourhoods-opaque', //New ID for the highlighted layer
        'type': 'fill',
        'source': 'neighbourhoodsTO_geojson',
        'paint': {
            'fill-color': 'white',
            'fill-opacity': 0.8, //Opacity set to 80%
            'fill-outline-color': 'white',
        },
        'filter': ['==', ['get', '_id'], ''] //Initial filter (returns nothing)
     },
     'subway-stations', //Sets the drawing orer so the subways, buffers, bus routes, and cycling layers are on top of neighbourhoods
    'subwaystn-buff',
    'bus-routes',
    'cycling'
    );

    // Turns off subway station layer by default
    map.setLayoutProperty(
        'subway-stations',
        'visibility',
        'none'
    );

    // Creates 500 metre buffers (a reasonable walking distance) around each subway station point
    let buffer = turf.buffer(substns, 0.5, {units: 'kilometers'}); 

    map.addSource('buffer-stns', {
        'type': 'geojson',
        'data': buffer
    });

    // Add subway buffers as a layer to map
    map.addLayer({
        'id': 'subwaystn-buff',
        'type': 'fill',
        'source': 'buffer-stns',
        'paint': {
            'fill-color': 'blue',
            'fill-opacity': 0.5,
            'fill-outline-color': 'black'
        }
    });

    // Turns off subway buffers layer by default
    map.setLayoutProperty(
         'subwaystn-buff',
         'visibility',
         'none'
     );

    map.addSource('ttcbusroutes',{
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/BusRoutes_Toronto.geojson' 
    });

    // Adds bus routes layer to map
    map.addLayer({
        'id': 'bus-routes',
        'type': 'line',
        'source': 'ttcbusroutes',
        'paint': {
            'line-color': 'black',
            'line-width': 1.5
        }
    },
    'subway-stations', //Sets the drawing orer so the subways and subway buffers are drawn over bus routes
    'subwaystn-buff'
    );
    
    // Turns off bus routes layer by default
    map.setLayoutProperty(
        'bus-routes',
        'visibility',
        'none'
    );

    map.addSource('cycling-network',{
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/cycling-layer/cycling-network.geojson' 
    });

    // Adds cycling network layer to map
    map.addLayer({
        'id': 'cycling',
        'type': 'line',
        'source': 'cycling-network',
        'paint': {
            'line-color': '#b45bf5'
        }
    },
    'subway-stations',
    'subwaystn-buff' //Sets the drawing orer so the subways and subway buffers are drawn over cycling routes
    );
    
    // Turns off cycling network layer by default
    map.setLayoutProperty(
        'cycling',
        'visibility',
        'none'
    );
   
    map.addSource('cafes_json',{
    'type': 'geojson', 
    'data': cafejson
    })

    // Adds CafeTo patios layer to map
    map.addLayer({
        'id': 'cafe-parklets',
        'type':'circle',
        'source': 'cafes_json',
        'paint': {
            'circle-radius':['interpolate', ['linear'], ['zoom'], 9, 1, 10.5, 3, 12, 3.5, 15, 4],
            // the above code adjusts the size of points according to the zoom level
            'circle-color':'yellow',
            'circle-stroke-color': 'black',
            'circle-stroke-width': 0.3,
        }
    });

})

/*--------------------------------------------------------------------
INTERACTIVITY
- check boxes and buttons
--------------------------------------------------------------------*/

//Event listener to return map view to full screen on button click
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.371, 43.720],
        zoom: 10.5,
        essential: true
    });
});

// Income legend display (check box)
let incomeLegendCheck = document.getElementById('incomeLegendCheck');

incomeLegendCheck.addEventListener('click', () => {
    if (incomeLegendCheck.checked) {
        incomeLegendCheck.checked = true; //when checked (true), the legend block is visible
        incomeLegend.style.display = 'block';
    }
    else {
        incomeLegend.style.display = "none"; 
        incomeLegendCheck.checked = false; //when unchecked (false), the legend block is not displayed
    }
});

// Population legend display (check box)
let popLegendCheck = document.getElementById('popLegendCheck');

popLegendCheck.addEventListener('click', () => {
    if (popLegendCheck.checked) {
        popLegendCheck.checked = true; //when checked (true), the legend block is visible
        popLegend.style.display = 'block';
    }
    else {
        popLegend.style.display = "none"; 
        popLegendCheck.checked = false; //when unchecked (false), the legend block is not displayed
    }
});

//Disability index legend display (check box)
let disLegendCheck = document.getElementById('disLegendCheck');

disLegendCheck.addEventListener('click', () => {
    if (disLegendCheck.checked) {
        disLegendCheck.checked = true; //when checked (true), the legend block is visible
        disLegend.style.display = 'block';
    }
    else {
        disLegend.style.display = "none"; 
        disLegendCheck.checked = false; //when unchecked (false), the legend block is not displayed
    }
});

// Subway stations layer display (check box)
document.getElementById('subwayCheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'subway-stations',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// Bus routes layer display (check box)
document.getElementById('busCheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'bus-routes',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// Cycling network layer display (check box)
document.getElementById('bikeCheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'cycling',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

// Subway station buffer layer display (check box)
document.getElementById('buffCheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'subwaystn-buff',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

/*--------------------------------------------------------------------
POP-UP ON CLICK EVENT
- When the cursor moves over the map, it changes from the default hand to a pointer
- When the cursor clicks on a feature, the name and classification will appear in a pop-up
--------------------------------------------------------------------*/
//Neighbourhoods pop-up
map.on('mouseenter', 'neighbourhoods-fill', () => {
    map.getCanvas().style.cursor = 'pointer'; //Switches cursor to pointer when mouse is over the neighbourhood-fill layer
});

map.on('mouseleave', 'neighbourhoods-fill', () => {
    map.getCanvas().style.cursor = ''; //Switches cursor back when mouse leaves neighbourhood-fill layer
});

map.on('click', 'neighbourhoods-fill', (e) => {
    new mapboxgl.Popup() //Declares a new popup on each click
        .setLngLat(e.lngLat) //Coordinates of the mouse click to determine the coordinates of the pop-up
        //Text for the pop-up:
        .setHTML("<b>Neighbourhood Name:</b> " + e.features[0].properties.FIELD_7 + "<br>" +// shows neighbourhood name
            "<b>Improvment Status:</b> " + e.features[0].properties.FIELD_9//shows neighbourhood improvement status
            )
        .addTo(map); //Adds the popup to the map
});

//Subways pop-up
map.on('mouseenter', 'subway-stations', () => {
    map.getCanvas().style.cursor = 'pointer';   //Switches cursor to pointer when mouse is over a subway station point
});

map.on('mouseleave', 'subway-stations', () => {
    map.getCanvas().style.cursor = '';  //Switches cursor back when mouse leaves subway station point

});

map.on('click', 'subway-stations', (e) => {
    new mapboxgl.Popup()    // Declares new pop-up on each click
        .setLngLat(e.lngLat)    //Coordinates of the mouse click to determine the coordinates of the pop-up
        .setHTML("<b>Station Name: </b>" + e.features[0].properties.LOCATION_N) // Shows subway station name in pop-up
        .addTo(map); // Adds pop-up to map
});

//Bus routes pop-up
map.on('mouseenter', 'bus-routes', () => {
    map.getCanvas().style.cursor = 'pointer';   //Switches cursor to pointer when mouse is over a subway station point
});

map.on('mouseleave', 'bus-routes', () => {
    map.getCanvas().style.cursor = '';  //Switches cursor back when mouse leaves subway station point

});

map.on('click', 'bus-routes', (e) => {
    
    // Variable assigned 'If else' statement so that undefined branches show up as blank instead of "undefined" in the pop-ups
    let routeBranch = e.features[0].properties.BRANCH;
        if (e.features[0].properties.BRANCH === undefined) {
            routeBranch = " ";
        } else {
            routeBranch = e.features[0].properties.BRANCH
        };

    console.log(routeBranch);

    new mapboxgl.Popup()    // Declares new pop-up on each click
        .setLngLat(e.lngLat)    //Coordinates of the mouse click to determine the coordinates of the pop-up
        .setHTML(
            "<b>Bus Number: </b>" + e.features[0].properties.NUMBER + routeBranch + " " + e.features[0].properties.ROUTE +
            "<br>" + "<b>Route: </b>" + e.features[0].properties.OD) // Shows bus number and route in pop-up 
        .addTo(map); // Adds pop-up to map
    
})

/*--------------------------------------------------------------------
DROP-DOWN MENU NEIGHBOURHOOD LAYER
- Users can select from a drop-down menu a neighbourhood attribute to visualize on the map
- The paint property of the neighbourhoods layer changes for different attribute values
--------------------------------------------------------------------*/

let attributevalue; //creates an empty variable to store the selection in the filter menu

document.getElementById("neighbourhoodfieldset").addEventListener('change',(e) => {   
    attributevalue = document.getElementById('attribute').value;

    console.log(attributevalue); //allows to check if the selection is working properly using the Inspect tool

    if (attributevalue == 'income') {
        map.setPaintProperty( 
            'neighbourhoods-fill', 'fill-color', [
                 'step', //this allows for ramped colour values
                    ['get', 'Total_income__Average_amount___'], //Classification of average income is the category of interest
                    //quartile classification, colours light to dark (darkest = highest density)
                    '#b3c5af', 
                    29305.75, '#8da685', //25th percentile
                    36538.5, '#326f07', //50th percentile
                    44805.75, '#164808', //75th percentile
                    ],
                'fill-opacity', 0.5, //Opacity set to 50%
                'fill-outline-color', 'white'
                ) 
            } else if (attributevalue == 'population') {
                map.setPaintProperty(
                    'neighbourhoods-fill', 'fill-color', [  
                        'step', //this allows for categorical colour values
                        ['get', 'Population_density_per_square_k'], //Classification of population density is the category of interest
                        //quartile classification, colours light to dark (darkest = highest density)
                        '#ccb5ae', 
                        3595.25, '#ac8f85', //25th percentile
                        5071.5, '#784224', //50th percentile
                        7621.25, '#532119' //75th percentile
                    ],
                    'fill-opacity', 0.5, //Opacity set to 50%
                    'fill-outline-color', 'white'
                    ); 
                } else if (attributevalue == 'disability') {
                    map.setPaintProperty(
                        'neighbourhoods-fill', 'fill-color', [  
                            'step', //this allows for visualization of the continuous data by grouping values
                            ['get', 'CPP_QPP_Disability_benefits__Av'], //Classification of mean disability benefits received is the category of interest
                           //quartile classification, colours light to dark (darkest = highest density)
                            '#ddb7d9', 
                            8164.5, '#ca92c4', //25th percentile
                            9979.5, '#aa3aa1', //50th percentile
                            11018, '#711c6c' //75th percentile
                        ],
                        'fill-opacity', 0.5, //Opacity set to 50%
                        'fill-outline-color', 'white'
                        )
            } else if (attributevalue == 'none') {
                map.setPaintProperty(
                    'neighbourhoods-fill', 
                    'fill-color', 'transparent',
                    'fill-outline-color', 'transparent',
                )
            } else {
                map.setPaintProperty(
                    'neighbourhoods-fill', 
                    'fill-color', 'black',
                    'fill-opacity', 0.5, //Opacity set to 50%
                    'fill-outline-color', 'white',
            )
        };       
        });

    /*--------------------------------------------------------------------
    HOVER EVENT
    - if a neighbourhood polygon is under the mouse hover, it will turn opaque and white to create a highighting effect
    --------------------------------------------------------------------*/

    map.on('mousemove', 'neighbourhoods-fill', (e) => {
        if (e.features.length > 0) { //determines if there is a feature under the mouse
            map.setFilter('neighbourhoods-opaque', ['==', ['get', 'OBJECTID'], e.features[0].properties.OBJECTID]); //applies the empty filter created
        }
    });
    
    map.on('mouseleave', 'neighbourhoods-opaque', () => { //removes the highlight when the mouse moves away
        map.setFilter("neighbourhoods-opaque",['==', ['get', 'OBJECTID'], '']);
    });
