
//----------------------------------------
//--- Part 1: Basemap ----
//----------------------------------------


//Basemap

// Open Street map

var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

var osm = new L.tileLayer(osmUrl, { 
	attribution: osmAttrib,
	minZoom: 12, 
	maxZoom: 17
});		

// L.map initializes the Webmap. The variable 'map' has to be the same as the DOM ID of the div-element in the HTML-document
// Center und zoom are necessary for the first initialization of the map.  

var map = L.map('map', {
	center: [ 53.88846844884609, -1.0712029994629912], 
	zoom: 12,
	maxBounds: [
	[53.798481938354676, -1.27790911393705],
	[54.06396352393666, -0.8849346020719624]
	],
	layers: [osm] 
});

var baseMaps = {
	"Open Street Map": osm
};

var modal = document.getElementById("interpretModal");
var interImg = document.getElementById("interpretImg");

var points = L.geoJson (mapping,{
	pointToLayer: function (feature, latlng) {
		return checkIcon(feature,latlng);
	},
	onEachFeature: onEachPoint
});

function onEachPoint (feature, layer) {
	if (feature.properties.type == "interpret" && feature.properties.image!= null && document.getElementById("map").clientWidth > 400) {
		layer.on('click', function(e) {
			map.closePopup();
			interImg.src = feature.properties.image;
			modal.style.display = "block";
			if (feature.properties.url != null) {
				document.getElementById("interpretLink").innerHTML = "More information: <a href=" + feature.properties.url + " style='color: white;' target='_blank'>Click here to visit our website!</a>" ;
			} else {
				document.getElementById("interpretLink").innerHTML = " " ;
			}
		});
	} else {
		var popupContent = '<span id="popupTitle" style="font-size:20" > ' + feature.properties.name + '</span>' + '<br> <br>' ;
		if (feature.properties.text != null) {
			var popupText = feature.properties.text + '<br><br>';
			popupContent = popupContent + popupText; 
		}
		if (feature.properties.image != null) {
			var img = '<img id="popupImg" src='+ feature.properties.image +' height="300px" width="300px"/><br>' ;
			popupContent = popupContent + img; 
		}
		if (feature.properties.url != null) {
			var url =  '<a href='+ feature.properties.url +' target="_blank">More information</a>'  ;
			popupContent = popupContent + url; 
		}
		layer.bindPopup(popupContent);
	}
};

// Layer grouping for toggle 

var lastMarker = Object.keys(points._layers).length - 1;
var markers = L.markerClusterGroup();

var access = "access" ;
var activity = "activity" ;
var bike = "bike" ;
var camping = "camping" ;
var food = "food" ;
var heritage = "heritage" ;
var interpret = "interpret";
var model = "model" ;
var planet = "planet" ;

var groups = [access, activity, bike, camping, food, heritage, interpret, model, planet] ;
map.addLayer(markers);

var clusters = [] ;

for (i in groups) {
	var classGroup = 'cluster ' + groups[i];
	clusters[i] = new L.markerClusterGroup({
		iconCreateFunction: function(cluster) {
			var numberMarkers = cluster.getAllChildMarkers().length;
			if (cluster.getAllChildMarkers().length != 0) { var classGroup = 'cluster ' + cluster.getAllChildMarkers()[0].feature.properties.type};
			return new L.DivIcon({html:  numberMarkers, className: classGroup, iconSize: new L.Point(30, 30)});
		}
	});
	clusters[i].type = groups[i] ;
	for (y in Object.keys(points._layers)) {
		if (points._layers[Object.keys(points._layers)[y]].feature.properties.type == clusters[i].type) {
			clusters[i].addLayer(points._layers[Object.keys(points._layers)[y]]) ;			
		}
	}
	map.addLayer(clusters[i]);
}

function checkIcon (feature, latlng, layer) {
	if (feature.properties.type == "planet") {
		return L.circleMarker(latlng, {fillColor: feature.properties.color, fillOpacity: 1})
	} else if (feature.properties.icon != null) {	
		var iconPath = "css\\\/Images\\\/" + feature.properties.icon ;
		var myIcon = L.icon({
			iconUrl: iconPath,
			iconSize: [30, 30]
		}) ;
		return L.marker(latlng, {
			icon: myIcon
			}
		)
	} else {
		return L.marker(latlng) ;
	}
};

// When the user clicks on <span> (x), close the modal
var closeButton = document.getElementById("closeButton");
closeButton.onclick = function(event) {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
} 

var solarway = L.geoJson(solarway,{
		style: function(feature) {
			return {
				stroke: true,
				color: "red",
				weight: 5
			};	
		}
	}
);


map.addLayer(solarway);

var overlayMaps = {
	"SolarWay" : solarway,
	"<img src='css\\\/Images\\\/access.svg' height='20px' width='20px'>  Access Points": clusters[0],
	"Activities": clusters[1],
	"Bike repairs" : clusters[2],
	"Camping" : clusters[3],
	"Food & Drink" : clusters[4],
	"Heritage Sites": clusters[5],
	"<img src='css\\\/Images\\\/interpret.svg' height='20px' width='20px'>  Info Boards": clusters[6],
	"<img src='css\\\/Images\\\/model.svg' height='20px' width='20px'>  Sculptures": clusters[7],
	"Planets": clusters[8]
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

document.getElementById("map").style.position = "" ;


