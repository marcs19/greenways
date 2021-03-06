//----------------------------------------
//--- Part 1: Basemap ----
//----------------------------------------

//Basemap

// Open Street map

const osmUrl = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const osmAttrib =
  'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

const osm = new L.tileLayer(osmUrl, {
  attribution: osmAttrib,
  minZoom: 12,
  maxZoom: 17,
});

// L.map initializes the Webmap. The variable 'map' has to be the same as the DOM ID of the div-element in the HTML-document
// Center und zoom are necessary for the first initialization of the map.

const map = L.map("map", {
  center: [53.88846844884609, -1.0712029994629912],
  zoom: 12,
  maxBounds: [
    [53.798481938354676, -1.27790911393705],
    [54.06396352393666, -0.8849346020719624],
  ],
  layers: [osm],
});

const baseMaps = {
  "Open Street Map": osm,
};
//Creating a set (list without duplicates), to later collect the unique point-groups in the data file
let pointSet = new Set();

const modal = document.getElementById("interpretModal");
let interImg = document.getElementById("interpretImg");

let points = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return checkIcon(feature, latlng);
  },
  onEachFeature: onEachPoint,
});

let layer = omnivore
  .csv(
    "data/mapping.csv",
    { latfield: "latitude", lonfield: "longitude", delimiter: ";" },
    points
  )
  .on("ready", function () {
    clusterizeMarkers();
  });

function onEachPoint(feature, layer) {
  pointSet.add(feature.properties.type);
  if (
    feature.properties.type == "Info_board" &&
    feature.properties.image.length != 0 &&
    document.body.clientWidth > 500
  ) {
    layer.on("click", function (e) {
      map.closePopup();
      interImg.src = feature.properties.image;
      modal.style.display = "block";
      if (feature.properties.url.length != 0) {
        document.getElementById("interpretLink").innerHTML =
          "More information: <a href=" +
          feature.properties.url +
          " style='color: white;' target='_blank'>Click here to visit our website!</a>";
      } else {
        document.getElementById("interpretLink").innerHTML = " ";
      }
    });
  } else {
    let popupContent =
      '<span id="popupTitle" style="font-size:20"> ' +
      feature.properties.name +
      "</span>" +
      "<br> <br>";
    if (feature.properties.text.length != 0) {
      let popupText = feature.properties.text + "<br><br>";
      popupContent = popupContent + popupText;
    }
    if (feature.properties.image.length != 0) {
      let img =
        '<img id="popupImg" style="display:block;margin-left: auto; margin-right: auto;" src=' +
        feature.properties.image +
        ' height="200px" width="200px"/><br>';
      popupContent = popupContent + img;
    }
    if (feature.properties.url.length != 0) {
      let url =
        "<a href=" +
        feature.properties.url +
        ' target="_blank">More information</a>';
      popupContent = popupContent + url;
    }
    layer.bindPopup(popupContent);
  }
}

// Layer grouping for toggle

var clusters;
var groups;
var solarwayLine;
var parentGroup = L.markerClusterGroup().addTo(map);

function clusterizeMarkers() {
  groups = [...pointSet];
  clusters = [];

  for (i in groups) {
    let classGroup = "cluster " + groups[i];
    clusters[i] = new L.featureGroup.subGroup(parentGroup, {
      iconCreateFunction: function (cluster) {
        let childCount = cluster.getAllChildMarkers().length;
        if (cluster.getAllChildMarkers().length != 0) {
          var classGroup =
            "cluster " +
            cluster.getAllChildMarkers()[0].feature.properties.type;
        }
      },
    });
    clusters[i].type = groups[i];
    for (y in Object.keys(points._layers)) {
      if (
        points._layers[Object.keys(points._layers)[y]].feature.properties
          .type == clusters[i].type
      ) {
        clusters[i].addLayer(points._layers[Object.keys(points._layers)[y]]);
      }
    }
    map.addLayer(clusters[i]);
  }
  solarwayLine = L.geoJson(solarway, {
    style: function () {
      return {
        stroke: true,
        color: "red",
        weight: 5,
      };
    },
  });
  map.addLayer(solarwayLine);
  solarwayLine.bringToBack();

  let overlayMaps2 = { SolarWay: solarwayLine };
  for (let i = 0; i < clusters.length - 1; i++) {
    let elementToAdd;
    if (doesFileExist(`css/Images/${groups[i]}.svg`)) {
      elementToAdd = `<img src='css/Images/${
        groups[i]
      }.svg' height='20px' width='20px'> ${groups[i].replace("_", " ")}`;
    } else {
      elementToAdd = clusters[i].type;
    }
    overlayMaps2[elementToAdd] = clusters[i];
  }
  var collapsed = true;
  if (document.body.clientWidth > 500) collapsed = false;
  L.control
    .layers(null, overlayMaps2, {
      collapsed: collapsed,
    })
    .addTo(map);
}

// function to check if icon image exists, if not, default leaflet icon is used
function doesFileExist(urlToFile) {
  var xhr = new XMLHttpRequest();
  xhr.open("HEAD", urlToFile, false);
  xhr.send();

  if (xhr.status == "404") {
    return false;
  } else {
    return true;
  }
}

function checkIcon(feature, latlng) {
  let iconPath = "css/Images/" + feature.properties.icon;
  if (feature.properties.type == "Planet") {
    return L.circleMarker(latlng, {
      fillColor: "#8080ff",
      fillOpacity: 1,
    });
  } else if (doesFileExist(iconPath)) {
    let myIcon = L.icon({
      iconUrl: iconPath,
      iconSize: [30, 30],
    });
    return L.marker(latlng, {
      icon: myIcon,
    });
  } else {
    return L.marker(latlng);
  }
}

map.on("popupopen", function (e) {
  var px = map.project(e.target._popup._latlng); // find the pixel location on the map where the popup anchor is
  px.y -= e.target._popup._container.clientHeight / 2; // find the height of the popup container, divide by 2, subtract from the Y axis of marker location
  map.panTo(map.unproject(px), { animate: true }); // pan to new center
  closeControl();
});

function closeControl() {
  if (document.body.clientWidth < 500)
    document
      .getElementsByClassName("leaflet-control-layers")[0]
      .classList.remove("leaflet-control-layers-expanded");
}

// When the user clicks on <span> (x), close the modal
const closeButton = document.getElementById("closeButton");
closeButton.onclick = function () {
  modal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

document.getElementById("map").style.position = "";
