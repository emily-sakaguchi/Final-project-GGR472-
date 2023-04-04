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

// Empty variable for subway stations
let substns;

// Fetch GeoJSON from github URL, convert response to JSON, and store response as variable 
fetch('https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/subway-stations.geojson')
    .then(response => response.json())      // Store response as JSON format
    .then(response => {
        console.log(response);      // Check response in console
        substns = response;       // Store GeoJSON as "substns" variable
    });
    
let neighbourhoodsjson;

    fetch('https://raw.githubusercontent.com/emily-sakaguchi/Final-project-GGR472-/main/Final_clean_neighbourhoods140.geojson')
    .then(response => response.json()) // Converts the response to JSON format  
    .then(response => {
        console.log(response); //Checking the response in console
        neighbourhoodsjson = response; // Stores the response in the variable created above
    });

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
            'circle-color': '#B42222'
        }
    });
    
    map.addSource('neighbourhoodsTO_geojson', {
        type: 'geojson',
        data: neighbourhoodsjson
    });

    map.addLayer({
        'id': 'neighbourhoods-fill',
        'type': 'fill',
        'source': 'neighbourhoodsTO_geojson',
        'paint': {
            'fill-color': 'black',
            'fill-opacity': 0.5, //Opacity set to 50%
            'fill-outline-color': 'white',
            
        },
    },
    'subway-stations',
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

    // Creates 500 metre buffers around each subway station point
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
            'line-color': 'yellow',
            'line-width': 1.5
        }
    },
    'subway-stations',
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
    'subwaystn-buff'
    );
    
    // Turns off cycling network layer by default
    map.setLayoutProperty(
        'cycling',
        'visibility',
        'none'
    );

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
})


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
        .setHTML("<b>Neighbourhood Name:</b> " + e.features[0].properties.AREA_NAME + "<br>" +// shows neighbourhood name
            "<b>Improvment Status:</b> " + e.features[0].properties.CLASSIFICATION) +  "<br>" //shows neighbourhood improvement status
            "<b>CafeTO patio count:</b> " + e.features[0].properties.COUNT + "<br>" // shows the number of patios per neighbourhood
        .addTo(map); //Adds the popup to the map
});

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
FILTER NEIGHBOURHOOD LAYER
- Users can select from a dropdown menu a neighbourhood attribute to visualize on the map
--------------------------------------------------------------------*/

let attributevalue;

document.getElementById("neighbourhoodfieldset").addEventListener('change',(e) => {   
    attributevalue = document.getElementById('attribute').value;

    console.log(attributevalue);

    if (attributevalue == 'income') {
        map.setPaintProperty(
            'neighbourhoods-fill', 'fill-color', [
                 'step', //this allows for ramped colour values
                    ['get', 'Total_income__Average_amount___'], //Classification of neighbourhood status (improvement area, etc.) is the category of interest
                    'black',
                    0, 'grey',
                    25989, '#99e600', //lime green
                    33974, 'green',
                    44567, '#F7d125', //soft red
                    56911, '#Ff6700', //neutral yellow
                    89330, 'red'
                    ],
                'fill-opacity', 0.5, //Opacity set to 50%
                'fill-outline-color', 'white'
                ) 
            } else if (attributevalue == 'population') {
                map.setPaintProperty(
                    'neighbourhoods-fill', 'fill-color', [  
                        'step', //this allows for categorical colour values
                        ['get', 'Population_density_per_square_k'], //Classification of neighbourhood status (improvement area, etc.) is the category of interest
                        'white',
                        0, 'grey', // Colours assigned to values >= each step is a quintile
                        1040, 'green', //lime green
                        3594, '#Ff6700', //neutral yellow
                        5072, '#F7d125', //soft red
                        7662, 'red',
                        12859, 'black'
                    ],
                    'fill-opacity', 0.5, //Opacity set to 50%
                    'fill-outline-color', 'white'
                    ); 
                } else if (attributevalue == 'disability') {
                    map.setPaintProperty(
                        'neighbourhoods-fill', 'fill-color', [  
                            'step', //this allows for visualization of the continuous data by grouping values
                            ['get', 'CPP_QPP_Disability_benefits__Av'], //Classification of neighbourhood status (improvement area, etc.) is the category of interest
                            'black',
                            0, 'grey', // Colours assigned to values >= each step is a quintile
                            3650, 'blue',
                            8000, 'green', //green
                            9980, '#Ff6700', //neutral yellow
                            11020, '#F7d125', //soft red
                            13808, 'red'

                        ],
                        'fill-opacity', 0.5, //Opacity set to 50%
                        'fill-outline-color', 'white'
                        )
            } else if (attributevalue == 'none') {
                map.setPaintProperty(
                    'neighbourhoods-fill', 
                    'fill-color', 'transparent'
                )
            } else {
                map.setPaintProperty(
                    'neighbourhoods-fill', 
                    'fill-color', 'black',
                    'fill-opacity', 0.5, //Opacity set to 50%
                    'fill-outline-color', 'white',
            )
        };       
        })