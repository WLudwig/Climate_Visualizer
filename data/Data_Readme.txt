File contents:

stationDetails.json

	contains detailed information about each weather stationDetails
	Is a json object. Each key is the station id. Each station contains:
		id		- station id
		lat		- latitude	
		lon		- longitude
		elev	- elevation
		name	- name of station
	*Note: All stations are from the HCN (Historical Climatology Network)
	
stationDetails.json
	
	a json array containing every station name
	
.dly.json files
	Naming convention is: "stationid.dly.json"
	Each file is a json object with keys being years.
	Each year has keys for each month (1 -> Jan, 2 -> Feb, etc)
	Each month CAN have 
		TMAX - Average maximum temperature for the month (10ths of degrees C)
		TMIN - Average minimum temperature for the month (10ths of degress C)
		PRCP - Average Precipiation (tenths of mm)
		SNOW - Average Snowfall for the month (mm)
		O100 - Number of days over 100F (37.78 C)
		
	Note that if there is no data for these fields they will not exist
	
