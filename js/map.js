selectedIDs = [];
loaded = [];
data = [];
stationData = [];
markers = [];
colorArr = ["#FF0000", "#FFA500", "#FF00D8", "#0043FF",
    "#8700FF"
];

category = "TMAX"; //TMAX, 0100, PREC, TMIN


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

d3.select("#catPicker").on("change", function() {
    category = this.value;
    drawChart();
});


function start() {
    let blueSymbol = {
        url: "blueMarker.png",
        scaledSize: new google.maps.Size(15, 15),
    };
    let redSymbol = {
        url: "redMarker.png",
        scaledSize: new google.maps.Size(20, 20),
    };


    d3.select("#clearButton").on("click", function() {
        markers.forEach(cur => {
            cur.selected = false;
            // selectedIDs.splice(selectedIDs.indexOf(cur.stationId), 1);
            cur.setIcon(blueSymbol);
            cur.setZIndex(2000);
        })
        displaySelectedData();
        selectedIDs = [];
        drawLegend();
        drawBarChart([], "");
    });

    fetch("data/stationDetails.json")
        .then((response) => response.json())
        .then((data) => {
            stationData = data;

            let mapContainer = document.getElementById("mapDiv");

            let options = {
                center: { lat: 40, lng: -96 }, // Show the whole USA
                zoom: 4,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    mapTypeIds: ["roadmap", "terrain", "satellite"],
                },
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,
                fullscreenControl: true,

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
                    //   map: map,
                    icon: blueSymbol,
                    zIndex: 0,
                    state: data[i].state,
                    stationId: data[i].id,
                    elev: data[i].elev,
                    lat: data[i].lat,
                    lon: data[i].lon,
                    selected: false,
                });

                curMarker.addListener("mouseover", function(e) {
                    tooltip.html(
                        "<strong>" +
                        this.title +
                        " - " +
                        this.state +
                        "</strong><br/><p>Lat: " +
                        this.lat +
                        "<br/> Lon:" +
                        this.lon +
                        "<br/>Elev: " +
                        this.elev +
                        "m<br/>Station: " +
                        this.stationId +
                        "  </p>"
                    );

                    tooltip.transition().duration(200).style("opacity", 0.9);
                });

                curMarker.addListener("mouseout", function(e) {
                    tooltip.transition().duration(500).style("opacity", 0);
                });

                curMarker.addListener("click", function(e) {
                    if (this.selected) {
                        this.selected = false;
                        selectedIDs.splice(selectedIDs.indexOf(this.stationId), 1);
                        displaySelectedData();
                        this.setIcon(blueSymbol);
                        this.setZIndex(2000);
                    } else {
                        if (selectedIDs.length === 5)
                            return;
                        this.selected = true;
                        selectedIDs.push(this.stationId);
                        displaySelectedData();
                        this.setIcon(redSymbol);
                        this.setZIndex(2000);
                    }
                });

                markers.push(curMarker);
            }

            // Clustering
            //https://developers.google.com/maps/documentation/javascript/marker-clustering#maps_marker_clustering-javascript
            new MarkerClusterer(map, markers, {
                imagePath: "assets/cluster/m",
                // gridSize: 50
            });
        });
}

function loadDataSet(stationID) {
    return fetch("data/stationData/" + stationID + ".dly.json").then((data) =>
        data.json()
    );
}

function getTMAXYear(yr) {

    let maxTemp = -1000;
    let hasSummer = false;

    for (const [month, monthData] of Object.entries(yr)) {
        if (monthData.hasOwnProperty("TMAX")) {
            if (month == 7) hasSummer = true;

            if (monthData["TMAX"] > maxTemp) maxTemp = monthData["TMAX"];
        }
    }


    return [maxTemp, hasSummer];
}

function getNumOver100Year(yr) {
    let numDays = 0;

    for (const [month, monthData] of Object.entries(yr)) {

        // console.log("MNTH: ", monthData);

        if (monthData.hasOwnProperty("O100")) {
            numDays += +monthData["O100"];
        }
    }

    return [numDays, true];

}

function getTMINYear(yr) {
    let minTemp = 1000;
    let hasSummer = false;

    for (const [month, monthData] of Object.entries(yr)) {
        if (monthData.hasOwnProperty("TMIN")) {
            if (month == 12) hasSummer = true;

            if (monthData["TMIN"] < minTemp) minTemp = monthData["TMIN"];
        }
    }


    return [minTemp, hasSummer];
}

function getPRECYear(yr) {
    let numDays = 0;

    for (const [month, monthData] of Object.entries(yr)) {

        // console.log("MNTH: ", monthData);

        if (monthData.hasOwnProperty("PRCP")) {
            numDays += +monthData["PRCP"];
        }
    }

    return [numDays, true];
}

function displaySelectedData() {
    // console.log("SELECTED: ", selectedIDs);
    data = [];
    loaded = [];

    for (let curIdx in selectedIDs) {
        loaded[curIdx] = false;
        let dat = loadDataSet(selectedIDs[curIdx]);
        dat.then((e) => {
            loaded[curIdx] = true;
            data[curIdx] = e;
        });
    }

    setTimeout(checkLoaded, 100);
}

function checkLoaded() {
    let allLoaded = true;

    for (let i in loaded) {
        if (!loaded[i]) allLoaded = false;
    }
    if (!allLoaded) {
        // console.log("NOT YET");
        setTimeout(checkLoaded, 100);
    } else {
        //DATA LOADED HERE
        drawChart();
        drawLegend();
        printSummaries();
    }
}

function drawChart() {
    let svg = d3.select("#chartSVG"); //.attr("style", "border: 1px solid black;");

    svg.selectAll("*").remove();

    let width = 800;
    let height = 600;

    let paddingRight = 25;
    let paddingLeft = 80;
    let paddingTop = 25;
    let paddingBottom = 75;

    svg.attr("width", width).attr("height", height);

    let numYears = 150;

    let xScale = d3
        .scaleTime()
        .range([0, width - (paddingLeft + paddingRight)])
        .domain([Date.now() - 365.24 * 24 * 60 * 60 * 1000 * numYears, Date.now()]);
    // .nice();

    let cat = "";

    if (category === "TMAX")
        cat = "Degrees C";
    else if (category === "TMIN")
        cat = "Degrees C";
    else if (category === "O100")
        cat = "Total Days over 100 F";
    else if (category === "PRCP")
        cat = "Precipitation (mm)"

    svg.append("text")
        .attr("transform", "rotate(-90) translate(-350,50)")
        // .attr("transform", "translate(10,50)")
        .style("text-anchor", "start")
        .text(cat);

    svg.append("text")
        .attr("transform", "translate(" + (width / 2 + 20) + "," + (height - paddingTop - 18) + ")")
        .style("text-anchor", "middle")
        .text("Year");


    //Get y range

    let absMax = -10000;
    let absMin = 10000;

    data.forEach((cur, idx) => {
        for (const [year, yearData] of Object.entries(cur)) {
            // let hasSummer = false;
            // let yrMax = -10000;
            // for (const [month, monthData] of Object.entries(yearData)) {
            //     if (monthData.hasOwnProperty("TMAX")) {
            //         if (month == 7) hasSummer = true;

            //         if (monthData["TMAX"] > yrMax) yrMax = monthData["TMAX"];
            //     }
            // }

            let yrMax, hasSummer;

            if (category === "TMAX") {
                [yrMax, hasSummer] = getTMAXYear(yearData);
            } else if (category === "O100") {
                [yrMax, hasSummer] = getNumOver100Year(yearData);
            } else if (category === "PRCP") {
                [yrMax, hasSummer] = getPRECYear(yearData);
            } else if (category === "TMIN") {

                [yrMax, hasSummer] = getTMINYear(yearData);

            }


            if (yrMax > absMax && Math.abs(yrMax) != 10000 && hasSummer)
                absMax = yrMax;
            if (yrMax < absMin && Math.abs(yrMax) != 10000 && hasSummer)
                absMin = yrMax;
        }
    });

    // console.log("MIN:", absMin, "MAX:", absMax);


    if (category === "TMAX") {
        absMax /= 10;
        absMin /= 10;

    } else if (category === "TMIN") {

        absMax /= 10;
        absMin /= 10;

    }


    let yScale = d3
        .scaleLinear()
        .range([0, height - (paddingTop + paddingBottom)])
        .domain([absMax + 5, absMin - 5]); //[50, 10]);

    let xAxis = d3.axisBottom(xScale);

    let yAxis = d3.axisLeft(yScale);

    svg
        .append("g")
        .attr(
            "transform",
            "translate(" + paddingLeft + "," + (height - paddingBottom) + ")"
        )
        .call(xAxis);

    svg
        .append("g")
        .attr("transform", "translate(" + paddingLeft + "," + paddingTop + ")")
        .call(yAxis);


    //draw lines


    data.forEach((cur, idx) => {
        let workingData = [];

        for (const [year, yearData] of Object.entries(cur)) {

            let val, hasSummer;
            // console.log(yearData);

            if (category === "TMAX") {
                [val, hasSummer] = getTMAXYear(yearData);
                val /= 10;
            } else if (category === "O100") {
                [val, hasSummer] = getNumOver100Year(yearData);
            } else if (category === "PRCP") {
                [val, hasSummer] = getPRECYear(yearData);
            } else if (category === "TMIN") {
                [val, hasSummer] = getTMINYear(yearData);
                val /= 10;

            }

            if (hasSummer && val != -10000) {

                let d = new Date(year, 1);
                workingData.push({ date: d, val: val });
            }
        }

        let colorScale = d3.scaleQuantize()
            .domain([0, data.length])
            .range(colorArr);


        if (selectedIDs.length === 0)
            return;

        //create line
        svg
            .append("path")
            .datum(workingData)
            .attr("fill", "none")
            .attr("stroke", () => {
                return colorScale(idx);
            })
            .attr("stroke-width", 1)
            .attr("stationName", stationData[selectedIDs[idx]].name)
            .attr(
                "d",
                d3
                .line()
                .curve(d3.curveCardinal)
                .x(function(d) {
                    return xScale(d.date) + paddingLeft;
                })
                .y(function(d) {

                    val = yScale(d.val) + paddingTop;
                    return val;
                })
            );

    });

    //https://www.d3-graph-gallery.com/graph/line_cursor.html


    //append vertical line
    let line = svg
        .append("line")
        .style("stroke", "lightgrey")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", paddingTop)
        .attr("y2", height - paddingBottom)
        .attr("stroke-width", 2);

    //create rect on top of svg area: this rectangle recovers mouse position
    svg
        .append("rect")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {

            if (selectedIDs.length === 0)
                return;
            let xPix = d3.mouse(this)[0];
            line.attr("x1", xPix);
            line.attr("x2", xPix);

        })
        .on("mousemove", function() {

            if (selectedIDs.length === 0)
                return;

            //draw line
            let xPix = d3.mouse(this)[0];
            line.attr("x1", xPix);
            line.attr("x2", xPix);

            //recover coordinate
            let xDate = xScale.invert(d3.mouse(this)[0] - paddingLeft);



            // draw circles
            svg.selectAll("circle")
                .data(data)
                .join("circle")
                .attr("r", 4)
                .attr("fill", "red")
                .each(function(curData, curIndex) {
                    let curCircle = d3.select(this);

                    let yr = curData[xDate.getFullYear()];
                    if (yr) {
                        let hasSummer = false;
                        let val = -1000;

                        if (category === "TMAX") {
                            [val, hasSummer] = getTMAXYear(yr);
                            val /= 10;
                        } else if (category === "O100") {
                            [val, hasSummer] = getNumOver100Year(yr);
                        } else if (category === "PRCP") {
                            [val, hasSummer] = getPRECYear(yr);
                        } else if (category === "TMIN") {
                            [val, hasSummer] = getTMINYear(yr);
                            val /= 10;

                        }


                        // for (const [month, monthData] of Object.entries(yr)) {
                        //     if (monthData.hasOwnProperty("TMAX")) {
                        //         if (month == 7) hasSummer = true;

                        //         if (monthData["TMAX"] > maxTemp) maxTemp = monthData["TMAX"];
                        //     }
                        // }

                        if (hasSummer) {
                            curCircle
                                .attr("cx", xScale(xDate) + paddingLeft)
                                .attr("cy", yScale(val) + paddingTop);
                        }

                        // let mnth = yr[xDate.getMonth() + 1];
                        // if (mnth) {
                        //   circle
                        //     .attr("cx", xScale(xDate) + paddingLeft)
                        //     .attr("cy", yScale(mnth["TMAX"]) + paddingTop);
                        //   console.log(yr, mnth, yScale(mnth["TMAX"] / 10) + paddingTop);
                        // }
                    }


                });

            //draw bar chart

            let chartData = [];

            for (let i = 0; i < data.length; i++) {
                let curData = data[i];

                let yr = curData[xDate.getFullYear()];
                if (yr) {
                    let hasSummer = false;
                    let val = -1000;


                    if (category === "TMAX") {
                        [val, hasSummer] = getTMAXYear(yr);
                        val /= 10;
                    } else if (category === "O100") {
                        [val, hasSummer] = getNumOver100Year(yr);
                    } else if (category === "PRCP") {
                        [val, hasSummer] = getPRECYear(yr);
                        // val /= 10;
                    } else if (category === "TMIN") {
                        [val, hasSummer] = getTMINYear(yr);
                        val /= 10;

                    }

                    // for (const [month, monthData] of Object.entries(yr)) {
                    //     if (monthData.hasOwnProperty("TMAX")) {
                    //         if (month == 7) hasSummer = true;

                    //         if (monthData["TMAX"] > maxTemp) maxTemp = monthData["TMAX"];
                    //     }
                    // }

                    if (hasSummer) {
                        chartData.push({ "value": val, "id": selectedIDs[i] })
                    }


                    // let mnth = yr[xDate.getMonth() + 1];
                    // if (mnth) {
                    //   circle
                    //     .attr("cx", xScale(xDate) + paddingLeft)
                    //     .attr("cy", yScale(mnth["TMAX"]) + paddingTop);
                    //   console.log(yr, mnth, yScale(mnth["TMAX"] / 10) + paddingTop);
                    // }
                }
            }

            drawBarChart(chartData, "Maximum Temperature (Celsius)");






        });

    // data.forEach((cur, idx) => {

    //     for (const [year, yearData] of Object.entries(cur)) {

    //         for (const [month, monthData] of Object.entries(yearData)) {

    //             let d = new Date(year, month - 1)
    //             console.log(year, month, d);

    //         }
    //     }

    // })
}


function drawBarChart(values, cat) {
    let svg = d3.select("#barChartSVG");
    svg.selectAll("*").remove();



    let width = 500;
    let height = 500;
    svg.attr("width", width).attr("height", height);

    let paddingRight = 25;
    let paddingLeft = 80;
    let paddingTop = 25;
    let paddingBottom = 80;

    //get max and min
    let min = 0;
    let max = 0;
    values.forEach((cur, idx) => {
        let curValue = cur["value"];
        if (curValue > max)
            max = curValue;
        if (curValue < min)
            min = curValue;
    })



    if (max < 0) {
        min = max;
        max = 0;
    }

    let yScale = d3.scaleLinear()
        .range([height - (paddingTop + paddingBottom), 0])
        .domain([max + 1, min - 1]); //[50, 10]);

    let yScaleAxis = d3.scaleLinear()
        .range([height - (paddingTop + paddingBottom), 0])
        .domain([min - 1, max + 1]); //[50, 10]);

    let colors = d3.scaleQuantize()
        .domain([0, values.length])
        .range(colorArr);


    svg
        .append("g")
        .attr("transform", "translate(" + paddingLeft + "," + paddingTop + ")")
        .call(d3.axisLeft(yScaleAxis));


    if (category === "TMAX")
        cat = "Maximum Temperature (Celsius)";
    else if (category === "TMIN")
        cat = "Minimum Temperature (Celsius)";
    else if (category === "O100")
        cat = "Number of days over 100 F";
    else if (category === "PRCP")
        cat = "Total Precipitation (mm)"

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", paddingTop - 5)
        .attr("style", "text-anchor:middle;")
        .text(cat);




    let barWidth = (width - paddingLeft - paddingRight) / values.length;

    svg.selectAll("rect")
        .data(values)
        .join("rect")
        .attr("width", barWidth)
        .attr("height", function(d, i) {
            return yScale(d["value"]);
        })
        .attr("y", function(d, i) {
            return height - paddingBottom - d3.select(this).attr("height");
        })
        .attr("x", function(d, i) {
            return (paddingLeft + (i * barWidth))
        })
        .attr("fill", function(d, i) {
            return colors(i);
        });

}

function printSummaries() {
    d3.select("#info").html("");


    if (selectedIDs.length === 0)
        return;

    data.forEach((cur, idx) => {
        let totalMax = 0;
        let totalMin = 0;
        let totalPrec = 0;
        let totalO100 = 0;
        let numO100 = 0;
        let numPrec = 0;

        let numMax = 0;
        let numMin = 0;

        for (const [year, yearData] of Object.entries(cur)) {
            let yrMax = -1000;
            let yrMin = 1000;
            let has100data = false;
            let hasPrcpData = false;

            for (const [month, monthData] of Object.entries(yearData)) {
                if ("TMAX" in monthData) {
                    if (+monthData["TMAX"] > yrMax)
                        yrMax = +monthData["TMAX"];
                }
                if ("TMIN" in monthData) {
                    if (+monthData["TMIN"] < yrMin)
                        yrMin = +monthData["TMIN"];
                }
                if ("O100" in monthData) {
                    totalO100 += +monthData["O100"];

                    has100data = true;
                }

                if ("PRCP" in monthData) {
                    totalPrec += +monthData["PRCP"];

                    hasPrcpData = true;
                }

            }

            if (has100data)
                numO100++;

            if (hasPrcpData)
                numPrec++;

            totalMax += yrMax;
            numMax++;
            totalMin += yrMin;
            numMin++;
        }

        let info = d3.select("#info").append("tr").classed("info", true);

        info.html(
            `<td>${stationData[selectedIDs[idx]].name}, ${stationData[selectedIDs[idx]].state}</td> 
              <td>${(totalMax /numMax /10).toFixed(2)}</td>
              <td>${(totalMin / numMin / 10).toFixed(2)}</td>  
              <td> ${(totalO100/numO100).toFixed(2)} </td> 
              <td>${(totalPrec/numPrec).toFixed(2)}</td> `
        );
    });
}

function drawLegend() {

    let width = 1200;
    let height = 80;

    let paddingTop = 35;
    // let paddingBottom = 50;
    let paddingLeft = 25;
    // let paddingRight = 50;

    let colorScale = d3.scaleQuantize()
        .domain([0, data.length])
        .range(colorArr);

    let svg = d3.select("#legendSVG")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("*").remove();


    let padding = 200;

    svg.append("text")
        .style("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", 12)
        .text("Legend:");

    selectedIDs.forEach((cur, index) => {
        let currentStation = stationData[cur];
        // console.log("DAT: ", currentStation.name, currentStation.state);

        let group = svg.append("g")
            .attr("transform", "translate(" + (padding * index + paddingLeft) + "," + paddingTop + ")");

        group.append("circle")
            .attr("r", 15)
            .attr("fill", colorScale(index));

        group.append("text")
            .text(currentStation.name + ", " + currentStation.state)
            .style("font-size", "13px")
            .attr("x", 15)
            .attr("y", 5);

    });

}