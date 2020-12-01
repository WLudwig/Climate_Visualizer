# Climate_Visualizer

Our project is a Climate Visualizer that visualizes data from over a thousand weather stations all over the United States.  Our data is taken from the Global Historical Climatology Network.  The link for our data is ftp://ftp.ncdc.noaa.gov/pub/data/ghcn/.  This data shows high/low temperatures, precipitation, pressure, wind, and much more going back many years.

We processed this data using Python and processed it in JSON files for the specific individual weather stations.  We had to filter out a lot of information from the data because there were a lot more categories than what we were interested in.

We used the Google Maps API in order to create the map that shows the weather stations that users are able to select.  We also used D3.  However, everything that we implemented using D3 was our own code.

Links:
Github Repository: https://github.com/WLudwig/Climate_Visualizer
Project Website: https://wludwig.github.io/Climate_Visualizer/visualizer.html
Screencast Video: 

Our visualization allows for you to select the weather stations that you want to see data for.  You can then select the category from a drop down menu.  If you hover your mouse over the line charts the data for the year that you are hovering over will be sent to the barchart and this will compare all of your current selections for the year that you are hovering over.  There is also a table at the bottom which gives more precise numerical data.
