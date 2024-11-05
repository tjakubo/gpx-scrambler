function ReadInputFile(callback) {
    var file = document.getElementById('input-file').files[0];
    if (!file) {
      alert("No file selected");
      return;
    }

    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function(evt) {
      var parser = new DOMParser();
      var document = parser.parseFromString(evt.target.result, "application/xml");
      const error = document.querySelector("parsererror");
      if (error) {
        alert("Error parsing input file");
      	return;
      }
      callback(document);
    }
    reader.onerror = function(evt) {
      alert("Error reading input file");
    }
}

function OnReadStartTimeFromInputClicked() {
    ReadInputFile((gpx) => { 
      var time = gpx.querySelector('gpx > trk > trkseg > trkpt > time');
      document.getElementById('start-time').valueAsDate = new Date(time.textContent);
    });
}

function DownloadTextFile(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function DateToXmlFormat(date) {
    return date.toISOString().slice(0,-5)+"Z";
}

function RandomFromRange(min, max) {
    return Math.random() * (max - min) + min;
}

function OnProcessClicked() {
   ReadInputFile((gpx) => { 
      var startTime = document.getElementById('start-time').valueAsDate;
      if (!startTime)
      {
      	alert("Start time not provided or incomplete");
        return;
      }
      console.log("Start time: " + startTime.toString());
      
      var metadata = gpx.querySelector("gpx > metadata");
      if (metadata && document.getElementById('remove-metadata').checked)
      {
      	metadata.parentNode.removeChild(metadata);
      }
      
      var removeExtensions = document.getElementById('remove-extensions').checked;
			
      var point = gpx.querySelector("gpx > trk > trkseg > trkpt");
      var firstPointTime = new Date(point.querySelector("time").textContent);
      console.log("First point time: " + firstPointTime.toString());
      
      var maxDeviation = parseFloat(document.getElementById('max-deviation-degrees').value);
      
      while (point) {
        console.log("Processing next point");
      	var pointTimeNode = point.querySelector("time");
      	var pointTime = new Date(pointTimeNode.textContent);
      	console.log("Original point time: " + pointTime.toString());
        
      	var offset = pointTime - firstPointTime;
      	console.log("Offset: " + offset);
      	
        var newTime = new Date(startTime.getTime() + offset);
        console.log("New point time: " + newTime.toString());
        pointTimeNode.textContent = DateToXmlFormat(newTime);
        
        var lat = parseFloat(point.getAttribute("lat"));
        var lon = parseFloat(point.getAttribute("lon"));
        console.log("Original coords: " + lat.toString() + ", " + lon.toString());
        if (maxDeviation > 0) {
            lat = (lat + RandomFromRange(-maxDeviation, maxDeviation)).toFixed(6);
            lon = (lon + RandomFromRange(-maxDeviation, maxDeviation)).toFixed(6);
            point.setAttribute("lat", lat);
            point.setAttribute("lon", lon);
            console.log("New coords: " + lat.toString() + ", " + lon.toString());    
        }
        
        var extensionsNode = point.querySelector("extensions");
        if (extensionsNode && removeExtensions) {
        	point.removeChild(extensionsNode);
        }
        point = point.nextElementSibling;
      }
      
      DownloadTextFile(
      	"scrambled_" + document.getElementById('input-file').files[0].name,
      	new XMLSerializer().serializeToString(gpx.documentElement)
 	  );
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('process').addEventListener("click", OnProcessClicked);
    document.getElementById('read-start-time-from-input').addEventListener("click", OnReadStartTimeFromInputClicked);
});