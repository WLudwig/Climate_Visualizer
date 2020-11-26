selectedIDs = [];
loaded = [];
data = [];
stationData = [];
markers = [];

//http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

function start() {
  let blueSymbol = {
    url: "blueMarker.png",
    scaledSize: new google.maps.Size(15, 15),
  };
  let redSymbol = {
    url: "redMarker.png",
    scaledSize: new google.maps.Size(20, 20),
  };

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
          mapTypeIds: ["roadmap", "terrain"],
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

        curMarker.addListener("mouseover", function (e) {
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

        curMarker.addListener("mouseout", function (e) {
          tooltip.transition().duration(500).style("opacity", 0);
        });

        curMarker.addListener("click", function (e) {
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
        });

        markers.push(curMarker);
      }

      // Clustering
      //https://developers.google.com/maps/documentation/javascript/marker-clustering#maps_marker_clustering-javascript
      new MarkerClusterer(map, markers, {
        imagePath: "assets/cluster/m",
      });
    });
}

function loadDataSet(stationID) {
  return fetch("data/stationData/" + stationID + ".dly.json").then((data) =>
    data.json()
  );
}

function displaySelectedData() {
  console.log("SELECTED: ", selectedIDs);
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
    console.log("NOT YET");
    setTimeout(checkLoaded, 100);
  } else {
    //DATA LOADED HERE
    drawChart();
    printSummaries();
  }
}

function drawChart() {
  let svg = d3.select("#chartSVG").attr("style", "border: 1px solid black;");

  svg.selectAll("*").remove();

  let width = 800;
  let height = 600;

  let paddingRight = 25;
  let paddingLeft = 80;
  let paddingTop = 25;
  let paddingBottom = 25;

  svg.attr("width", width).attr("height", height);

  let numYears = 150;

  let xScale = d3
    .scaleTime()
    .range([0, width - (paddingLeft + paddingRight)])
    .domain([Date.now() - 365.24 * 24 * 60 * 60 * 1000 * numYears, Date.now()]);
  // .nice();

  //Get y range

  let absMax = -10000;
  let absMin = 10000;

  data.forEach((cur, idx) => {
    for (const [year, yearData] of Object.entries(cur)) {
      let hasSummer = false;
      let yrMax = -10000;
      for (const [month, monthData] of Object.entries(yearData)) {
        if (monthData.hasOwnProperty("TMAX")) {
          if (month == 7) hasSummer = true;

          if (monthData["TMAX"] > yrMax) yrMax = monthData["TMAX"];
        }
      }
      if (yrMax > absMax && Math.abs(yrMax) != 10000 && hasSummer)
        absMax = yrMax;
      if (yrMax < absMin && Math.abs(yrMax) != 10000 && hasSummer)
        absMin = yrMax;
    }
  });

  console.log(absMax, absMin);

  let yScale = d3
    .scaleLinear()
    .range([0, height - (paddingTop + paddingBottom)])
    .domain([absMax / 10 + 5, absMin / 10 - 5]); //[50, 10]);

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

  let chartPopup = d3
    .select("body")
    .append("div")
    .classed("tooltipHover", true)
    .attr("id", "chartToolTip")
    .style("opacity", 0);

  data.forEach((cur, idx) => {
    let workingData = [];

    for (const [year, yearData] of Object.entries(cur)) {
      let maxTemp = -10000;
      hasSummer = false;

      for (const [month, monthData] of Object.entries(yearData)) {
        if (monthData.hasOwnProperty("TMAX")) {
          if (month == 7) hasSummer = true;

          if (monthData["TMAX"] > maxTemp) maxTemp = monthData["TMAX"];
        }
      }
      //   if (maxTemp >= 200) {
      if (hasSummer && maxTemp != -10000) {
        if (maxTemp < absMin) {
          console.log("MIN");
        }

        let d = new Date(year, 1);
        workingData.push({ date: d, tmax: maxTemp });
      }
    }

    //create line
    svg
      .append("path")
      .datum(workingData)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1)
      .attr("stationName", stationData[selectedIDs[idx]].name)
      .attr(
        "d",
        d3
          .line()
          .curve(d3.curveCardinal)
          .x(function (d) {
            return xScale(d.date) + paddingLeft;
          })
          .y(function (d) {
            if (d.tmax < absMin) {
              console.log(d.tmax);
            }
            val = yScale(d.tmax / 10) + paddingTop;
            return val;
          })
      );
    // .on("mouseover", function (evt) {
    //   chartPopup.html("<p>" + this.getAttribute("stationName") + "</p>");

    //   chartPopup
    //     .style("left", d3.event.pageX - 10 + "px")
    //     .style("top", d3.event.pageY - 40 + "px");

    //   chartPopup.transition().duration(200).style("opacity", 0.9);

    //   d3.select(this).classed("hovered", true).moveToFront();
    // })
    // .on("mouseout", function (evt) {
    //   chartPopup.transition().duration(200).style("opacity", 0);

    //   d3.select(this).classed("hovered", false);
    // });
  });

  //https://www.d3-graph-gallery.com/graph/line_cursor.html

  //append a circle for testing TODO REMOVE
  let circle = svg
    .append("circle")
    .attr("r", 4)
    .attr("cx", 50)
    .attr("cy", 60)
    .attr("fill", "red");

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
    .on("mouseover", function () {
      let xPix = d3.mouse(this)[0];
      line.attr("x1", xPix);
      line.attr("x2", xPix);

      //draw line here TODO
    })
    .on("mouseout", function () {
      //remove line TODO
    })
    .on("mousemove", function () {
      //draw line
      let xPix = d3.mouse(this)[0];
      line.attr("x1", xPix);
      line.attr("x2", xPix);

      //recover coordinate
      let xDate = xScale.invert(d3.mouse(this)[0] - paddingLeft);

      let yr = data[0][xDate.getFullYear()];
      if (yr) {
        let hasSummer = false;
        let maxTemp = -1000;

        for (const [month, monthData] of Object.entries(yr)) {
          if (monthData.hasOwnProperty("TMAX")) {
            if (month == 7) hasSummer = true;

            if (monthData["TMAX"] > maxTemp) maxTemp = monthData["TMAX"];
          }
        }

        if (hasSummer) {
          circle
            .attr("cx", xScale(xDate) + paddingLeft)
            .attr("cy", yScale(maxTemp / 10) + paddingTop);
          // console.log(yr, maxTemp, hasSummer);
        }

        // let mnth = yr[xDate.getMonth() + 1];
        // if (mnth) {
        //   circle
        //     .attr("cx", xScale(xDate) + paddingLeft)
        //     .attr("cy", yScale(mnth["TMAX"]) + paddingTop);
        //   console.log(yr, mnth, yScale(mnth["TMAX"] / 10) + paddingTop);
        // }
      }

      // console.log("THINK: ", xDate.getFullYear(), xDate.getMonth() + 1);
      //draw things...
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

    let info = d3.select("#info").append("tr").classed("info", true);

    info.html(
      `<td>${stationData[selectedIDs[idx]].name}</td> <td>${(
        totalMax /
        numMax /
        10
      ).toFixed(2)}</td> <td>${(totalMin / numMin / 10).toFixed(2)}</td>  `
    );
  });
}
