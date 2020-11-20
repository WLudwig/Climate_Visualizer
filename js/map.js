selectedIDs = []
loaded = []
data = []
stationData = []

//http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

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

            stationData = data;

            let mapContainer = document.getElementById('mapDiv');

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
                .attr("id", "mapTooltip")
                .style("opacity", 0);

            //add markers
            for (i in data) {

                let tooltip = d3.select("#mapTooltip");

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

                    tooltip.html("<strong>" + this.title + " - " + this.state + "</strong><br/><p>Lat: " + this.lat + "<br/> Lon:" + this.lon + "<br/>Elev: " + this.elev + "m<br/>Station: " + this.stationId + "  </p>")

                    tooltip
                        .transition()
                        .duration(200)
                        .style("opacity", 0.9);


                });

                curMarker.addListener("mouseout", function(e) {
                    tooltip
                        .transition()
                        .duration(500)
                        .style("opacity", 0);

                })


                curMarker.addListener("click", function(e) {
                    if (this.selected) {
                        this.selected = false;
                        selectedIDs.splice(selectedIDs.indexOf(this.stationId), 1);
                        displaySelectedData();
                        this.setIcon(blueSymbol);
                        this.setZIndex(2000);

                    } else {
                        this.selected = true;
                        selectedIDs.push(this.stationId);
                        displaySelectedData();
                        this.setIcon(redSymbol);
                        this.setZIndex(2000);
                    }
                })
            }
        })
}

function loadDataSet(stationID) {
    return fetch("data/stationData/" + stationID + ".dly.json").then(data => data.json());
}


function displaySelectedData() {
    console.log("SELECTED: ", selectedIDs)
    data = [];
    loaded = [];

    for (let curIdx in selectedIDs) {
        loaded[curIdx] = false;
        let dat = loadDataSet(selectedIDs[curIdx]);
        dat.then(e => {
            loaded[curIdx] = true;
            data[curIdx] = e;
        })
    }

    setTimeout(checkLoaded, 100);
}


function checkLoaded() {
    let allLoaded = true;

    for (let i in loaded) {
        if (!loaded[i])
            allLoaded = false;
    }
    if (!allLoaded) {
        console.log("NOT YET");
        setTimeout(checkLoaded, 100);
    } else {
        //DATA LOADED HERE
        drawChart();
        printSummaries();
    }
}

function drawChart() {
    let svg = d3.select("#chartSVG")
        .attr("style", "border: 1px solid black;");


    svg.selectAll("*").remove();

    let width = 800;
    let height = 600;

    let paddingRight = 25;
    let paddingLeft = 80;
    let paddingTop = 25;
    let paddingBottom = 25;


    svg.attr("width", width)
        .attr("height", height);

    let numYears = 150;

    let xScale = d3.scaleTime()
        .range([0, (width - (paddingLeft + paddingRight))])
        .domain([Date.now() - 365.24 * 24 * 60 * 60 * 1000 * numYears, Date.now()])
        // .nice();

    let yScale = d3.scaleLinear()
        .range([0, (height - (paddingTop + paddingBottom))])
        .domain([50, 10]);

    let xAxis = d3.axisBottom(xScale);

    let yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", "translate(" + paddingLeft + "," + (height - paddingBottom) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("transform", "translate(" + paddingLeft + "," + paddingTop + ")")
        .call(yAxis);

    let chartPopup = d3.select("body")
        .append("div")
        .classed("tooltipHover", true)
        .attr("id", "chartToolTip")
        .style("opacity", 0);



    data.forEach((cur, idx) => {
        let workingData = [];

        for (const [year, yearData] of Object.entries(cur)) {
            let maxTemp = -10000;

            for (const [month, monthData] of Object.entries(yearData)) {

                if (monthData["TMAX"] > maxTemp)
                    maxTemp = monthData["TMAX"];


            }
            if (maxTemp >= 200) {
                let d = new Date(year, 1)
                workingData.push({ date: d, tmax: maxTemp });
            }
        }


        svg.append("path")
            .datum(workingData)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 3)
            .attr("stationName", stationData[selectedIDs[idx]].name)
            .attr("d", d3.line()
                .x(function(d) {
                    return xScale(d.date);
                })
                .y(function(d) {
                    return yScale(d.tmax / 10.0);
                }))
            .on("mouseover", function(evt) {


                chartPopup.html("<p>" + this.getAttribute("stationName") + "</p>");


                chartPopup
                    .style("left", (d3.event.pageX - 10) + "px")
                    .style("top", (d3.event.pageY - 40) + "px");

                chartPopup
                    .transition()
                    .duration(200)
                    .style("opacity", 0.9);

                d3.select(this).classed("hovered", true)
                    .moveToFront();

            })
            .on("mouseout", function(evt) {

                chartPopup
                    .transition()
                    .duration(200)
                    .style("opacity", 0);

                d3.select(this).classed("hovered", false);
            });


    })


    // data.forEach((cur, idx) => {

    //     for (const [year, yearData] of Object.entries(cur)) {

    //         for (const [month, monthData] of Object.entries(yearData)) {

    //             let d = new Date(year, month - 1)
    //             console.log(year, month, d);

    //         }
    //     }

    // })







}


function printSummaries() {

    d3.select("#info").html("");


    data.forEach((cur, idx) => {
        let totalMax = 0;
        let totalMin = 0;
        let numMax = 0;
        let numMin = 0;

        for (const [year, yearData] of Object.entries(cur)) {

            for (const [month, monthData] of Object.entries(yearData)) {
                if ("TMAX" in monthData) {
                    totalMax += +monthData["TMAX"];
                    numMax++;
                }
                if ("TMIN" in monthData) {
                    totalMin += +monthData["TMIN"];
                    numMin++;
                }
            }
        }

        let info = d3.select("#info")
            .append("tr")
            .classed("info", true);

        info.html(`<td>${stationData[ selectedIDs[idx]].name}</td> <td>${(totalMax/numMax/10).toFixed(2)}</td> <td>${(totalMin/numMin/10).toFixed(2)}</td>  `)


    });


}