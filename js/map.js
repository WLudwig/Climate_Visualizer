selectedIDs = []

function start() {

    let blueSymbol = {
        url: "blueMarker.png",
        scaledSize: new google.maps.Size(15, 15)
    }
    let redSymbol = {
        url: "redMarker.png",
        scaledSize: new google.maps.Size(20, 20)
    }

    fetch("data/stationDetails.json")
        .then(response => response.json()).then(data => {

            // The first parameter of this function is the element that you want to render the map to.
            // We here use the native DOM API.
            // if using d3 instead of the native DOM API, the call should be: d3.select("#map").node().
            // notice the use of node() to access the actual DOM node instead of the d3 selection.
            let mapContainer = document.getElementById('mapDiv');
            console.log("inside initMap");
            //The second parameter we want to use is the zoom and center(lat and lng) options for the map
            let options = {
                center: { lat: 40, lng: -96 }, // Show the whole USA
                zoom: 4,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    mapTypeIds: ["roadmap", "terrain"],
                },
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,

                // mapTypeId: 'terrain' //This is optional and changes the type of google map shown.
            };
            //Create a new google map object
            let map = new google.maps.Map(mapContainer, options);

            d3.select("#mapDiv")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            //add markers
            for (i in data) {

                let tooltip = d3.select(".tooltip");

                let curMarker = new google.maps.Marker({
                    position: new google.maps.LatLng(data[i].lat, data[i].lon),
                    title: data[i].name,
                    map: map,
                    icon: blueSymbol,
                    zIndex: 0,
                    state: data[i].state,
                    stationId: data[i].id,
                    elev: data[i].elev,
                    lat: data[i].lat,
                    lon: data[i].lon,
                    selected: false
                })

                curMarker.addListener("mouseover", function(e) {

                    console.log(this);
                    tooltip.html("<strong>" + this.title + " - " + this.state + "</strong><br/><p>Lat: " + this.lat + "<br/> Lon:" + this.lon + "<br/>Elev: " + this.elev + "m<br/>Station: " + this.stationId + "  </p>")

                    tooltip
                        .transition()
                        .duration(200)
                        .style("opacity", 0.9);


                });

                curMarker.addListener("mouseout", function(e) {
                    // console.log("EVT: ", this);
                    tooltip
                        .transition()
                        .duration(500)
                        .style("opacity", 0);

                })


                curMarker.addListener("click", function(e) {
                    if (this.selected) {
                        this.selected = false;
                        selectedIDs.splice(selectedIDs.indexOf(this.stationId), 1);
                        debug();
                        this.setIcon(blueSymbol);
                        this.setZIndex(2000);

                    } else {
                        this.selected = true;
                        console.log("THIS: ", this);
                        selectedIDs.push(this.stationId);
                        debug();
                        this.setIcon(redSymbol);
                        this.setZIndex(2000);
                    }
                })



            }


        })
}

function debug() {
    let sel = document.querySelector("#debug");
    console.log("SEL: ", selectedIDs);

    sel.innerHTML = "";

    selectedIDs.forEach(i => {
        console.log("i: ", i, "sel: ", selectedIDs);
        sel.innerHTML += i + "<br/>"
    })


}