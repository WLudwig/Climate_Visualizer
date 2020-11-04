function initMap() {

    // The first parameter of this function is the element that you want to render the map to.
    // We here use the native DOM API.
    // if using d3 instead of the native DOM API, the call should be: d3.select("#map").node().
    // notice the use of node() to access the actual DOM node instead of the d3 selection.
    let mapContainer = document.getElementById('mapDiv');
    console.log("inside initMap");
    //The second parameter we want to use is the zoom and center(lat and lng) options for the map
    let options = {
        center: {lat: 40, lng: -96}, // Show the whole USA
        zoom: 4,
        // mapTypeId: 'terrain' //This is optional and changes the type of google map shown.
    };
    //Create a new google map object
    let map = new google.maps.Map(mapContainer, options);
}