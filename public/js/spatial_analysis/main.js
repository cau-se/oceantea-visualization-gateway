// Copyright 2016 Patricia Beier
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
 

//vars for the important data of the loaded region 
var smallestx, smallesty, biggestx, biggesty, minheight, maxheight;
var zerox, zeroy; 
//vertices and faces for the ocean floor
var vertices = [];
var faces = [];

//ocean-floor-mesh
var oceanFloorMesh;

//for the Orbit-controls
var controls;
var clock;
 
//holds the lat- and lon-data we get from the server 
var lat = [];
var lon = [];

//for testing the placement of the stations
//var mouse_x, mouse_y, vector;
//var coorData, tube;
//var showRay = true;
//var raycaster;

//grid
var plane;
  
//groups
var lineGroup;
var stationsGroup;
var labelingGroup;

var camera=null, scene, renderer;
 
 
var SCALE_VALUE = 10000;
var LENGTH_OF_LUT_ARROW = 545;
var BOX_SIZE = 30;
var BIN_SIZE = BOX_SIZE/100;
  
//init load of all regions 
var regions = [];
var regionNames;

//the region that we see in the scene 
var region;

//for the LUT
var lutScene;
var lutCamera, lutRenderer;
var lut, labels, legend;
 

//for the lookup-arrow
var arrowScene;
var arrowCamera, arrowRenderer;
var lutArrow;

  
//for the slider
var timeValue, speedValue;
var changeTimeSlider, changeSpeedSlider;
 

//data of the stations
var stations = [];
var stationsOfCurrentRegionList = [];
var listOfAllTimestamps = [];
var numberOfStationDirections;
 
  		
//How to disable web security in chrome 
// .\chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security 

function getCanvasSize() {
 	var paddingMaincontainerTopBottom = 6;
 	var paddingMaincontainerLeftRight = 15;
 	return [window.innerWidth-2*paddingMaincontainerLeftRight, 
 		window.innerHeight - 2*paddingMaincontainerTopBottom - $("#rowNavBar").height()];
}
 
function init() { 

	//testFloatSaveRemainder();
	//printDates();
	
	//disable the checkboxes as long as the related components haven't load 
	document.getElementById( 'oceanFloorVisibleCheckbox' ).disabled = true;
	document.getElementById( 'stationsVisibleCheckbox' ).disabled = true;
	document.getElementById( 'colorGradientOnArrowsCheckbox' ).disabled = true;
	document.getElementById( 'arrowsVisibleCheckbox' ).disabled = true;
  
	clock = new THREE.Clock();
 	
	scene = new THREE.Scene();
	
	//set the renderer 
	renderer = new THREE.WebGLRenderer();		
	var rendererSize = getCanvasSize();
	renderer.setSize( rendererSize[0], rendererSize[1] );	
	renderer.setClearColor( 0x6C7A8D );
	renderer.setPixelRatio( window.devicePixelRatio );
	$("#WebGL-output").append(renderer.domElement);
	$(window).resize(function() {
		var rendererSize = getCanvasSize();
		if(camera) {
			camera.aspect = rendererSize[0] / rendererSize[1];
			camera.updateProjectionMatrix();
		}
		renderer.setSize( rendererSize[0], rendererSize[1] );
	});
	
	loadSlider();
	
	
	  
	//load data which is relevant for all regions 
	$.when(
		 
		$.ajax({
			url: "/timeseries/adcp",
			success: function(data) {
			
				stations = data.timeseries;
				 
			}
		}),
		$.ajax({
			url: "/bathymetries",
			success: function(data) {
			
				regions = data.regions;
				
				if (regions.length > 0) {
					region = regions[0]; 
				}
				
				else {
					
					//alert("No regions!!");
					
				}
				 
			}
		}),		
		$.ajax({
			url: "/regions",
			success: function(data) {
			
				regionNames = data;
				 
			}
		})
		
	).then( function(){
		loadFirstRegion();
	});
	 
   
};

 
function loadFirstRegion( ) {
	
	$.when(
		$.ajax({
			url: "/bathymetries/"+region,
			success: function(data) {

				smallesty = data.lat_min;
				smallestx = data.lon_min;
				biggesty = data.lat_max;
				biggestx = data.lon_max;
				minheight = data.elevation_min;
				maxheight = data.elevation_max;
				vertices = data.vertices;
				faces = data.faces;
				lat = data.lat;
				lon = data.lon;
			}
		}) 
		 
		
	).then( function(){
		//alert("data loaded");
		
		testMainValues(region);
	  
		createGui();
		show();
		render();
	});
	
	
}
 

function deleteDoubleEntries(array) {
	
    var doubleEntries = {};
    var array2 = [];
    for (var i = 0; i < array.length; i++) {
		
        if (!(array[i] in doubleEntries)) {
            array2.push(array[i]);
            doubleEntries[array[i]] = true;
        }
    }
	
    return array2;

}



 

function createButtons() {
	
	AutoplayNS.createPlayButton();
	
	//The Info-Button -- shows how to navigate in the scene 
	var infoButton = document.getElementById( 'infoButton' );
	infoButton.onclick = function() {
		
		alert("ORBIT - left mouse /// touchpad: one finger move"+
			"\nZOOM - middle mouse or mousewheel /// touchpad: two finger spread or squish"+
			"\nPAN - right mouse or arrow keys /// touchpad: three finger swipe"
		 
		);
	 	
	}
	
	 
	var resetButton = document.getElementById( 'resetButton' );
	resetButton.onclick = function() {
		
		controls.reset();
	  
	}
	
	
	
	
}

function createLookupHelpers() {
	
	//the lut gets an own scene
	//that's because it is an 3-D-object and has to be excluded from the navigation to look 2-dimensional 
	var container = document.getElementById( 'lut-container' );

	lutScene = new THREE.Scene();
	lutCamera = new THREE.PerspectiveCamera( 75, 1, 0.1, 10 );
	lutRenderer = new THREE.WebGLRenderer({ alpha: true });
	lutRenderer.setSize( 250, 300 );
	 
	container.appendChild( lutRenderer.domElement );
	
	
	//for the lut-arrow
	var acontainer = document.getElementById( 'arrow-container' );

	arrowScene = new THREE.Scene();
	arrowCamera = new THREE.PerspectiveCamera( 110, 1, 8/3, 2000 ); //first var sets the size 
	arrowCamera.position.z = 0.2;
	arrowRenderer = new THREE.WebGLRenderer( {  alpha: true } );
	arrowRenderer.setSize( 800, 300 );
	 
	acontainer.appendChild( arrowRenderer.domElement ); 
	
	var dir = new THREE.Vector3( 1, 0 ,0)
	var origin = new THREE.Vector3( -300, 350, -350 ); //0 is in the middle
	
	lutArrow = new THREE.MarkedArrowHelper( dir, origin, LENGTH_OF_LUT_ARROW, 0xff0000, 25, 25, true);
	writeOnArrow(lutArrow.distance, lutArrow.distance);
	arrowScene.add(lutArrow);	
	
	var arrowRender = function () {
	  requestAnimationFrame( arrowRender );
	   
	  arrowRenderer.render( arrowScene, arrowCamera );
	};
	
	arrowRender();
	
	
}

function createRegionButtons() {
	
		
	//Every region has an own button to load it into the scene 
	var customContainer = document.getElementById('gui-placement');
	 
	for(var i = 0; i < regions.length; i++) {  
	
		var button = document.createElement("BUTTON"); 
		var name =  regions[i];
		
		for (var key in regionNames) {
			if(key == regions[i]) {
				name = regionNames[key].printName;
			}  	   
		}
		
		button.textContent = name; //TODO: The textContent property is not supported in Internet Explorer 8 and earlier  
		button.className = "btn btn-primary oceanteaSelectionBtn buttoncell";
		button.id = regions[i];
		button.onclick=function(){
			
			document.getElementById( 'oceanFloorVisibleCheckbox' ).checked = true;
			document.getElementById( 'stationsVisibleCheckbox' ).checked = true;
			document.getElementById( 'colorGradientOnArrowsCheckbox' ).checked = true;
			document.getElementById( 'arrowsVisibleCheckbox' ).checked = true;
			
			if (!oceanFloorMesh.visible) {
				
				hideOrShowLut();
			}
			
			lutArrow.visible = true;	
			oceanFloorMesh.visible = true;
			 
			//for testing the new creation 
			//alert (stationsGroup.children[0]); 
			//alert (labelingGroup.children[0]); 
			//alert (lineGroup.children[0]);  
			
			//removing because we want new ones 
			//new ones are given in the show-function
			scene.remove(oceanFloorMesh); 
			scene.remove(lineGroup); 
			scene.remove(plane);  
			scene.remove(stationsGroup);
			scene.remove(labelingGroup);
			lutScene.remove(legend);
			lutScene.remove(labels['title'] );
			
			 
			playButton.className = "btn btn-primary oceanteaSelectionBtn";
			AutoplayNS.clearPlay();
			
	 
			
			for ( var i = 0; i < Object.keys( labels[ 'ticks' ] ).length; i++ ) {

				lutScene.remove ( labels[ 'ticks' ][ i ] );
				lutScene.remove ( labels[ 'lines' ][ i ] );
				 

			}
			document.getElementById( 'oceanFloorVisibleCheckbox' ).disabled = true;
			document.getElementById( 'stationsVisibleCheckbox' ).disabled = true;
			document.getElementById( 'colorGradientOnArrowsCheckbox' ).disabled = true;
			document.getElementById( 'arrowsVisibleCheckbox' ).disabled = true;
			
			var inputs = document.getElementsByTagName('BUTTON');
			for (var i = 0; i < inputs.length; i++) {
				inputs[i].disabled = true;
			}

			//alert("loading data, please wait!");
			
			$.when(
				$.ajax({
					url: "/bathymetries/"+button.id,
					success: function(data) {

						smallesty = data.lat_min;
						smallestx = data.lon_min;
						biggesty = data.lat_max;
						biggestx = data.lon_max;
						minheight = data.elevation_min;
						maxheight = data.elevation_max;
						vertices = data.vertices;
						faces = data.faces;
						lat = data.lat;
						lon = data.lon;
						
						region = button.id;
						 
					}
				}) 
			).then( function(){
				//alert( "data loaded" );
				testMainValues(button.id); 
				show();
			});
			
		};
		customContainer.appendChild(button);
	
	}
	
	
	
}
 

function createGui() {
	
	createButtons();
	createLookupHelpers();
	createRegionButtons();
	 
}
 
//Moves the arrows (up- and down-direction) of a single station with the data from server 
function moveArrows(station, uniTime, arrowCounter) {
	
	//var sendDate = (new Date()).getTime(); Test time till serveranswer
	document.getElementById( 'arrowsVisibleCheckbox' ).disabled = true;
	
	var upLoad, downLoad;
	var d = new Date(station.t_reference);
	var stationTime =  (uniTime - d.getTime()) / 1000; //TODO 
				  

	if (station.nUpBins > 0) {
		upLoad = $.ajax({
			url: "/timeseries/adcp/"+station.station+"/dirmag/"+station.depth+"/up/"+stationTime,
			async: true,
			success:function(data){
			
				station.moveUpArrows( data.magnitudes, data.directions, document.getElementById( 'colorGradientOnArrowsCheckbox' ).checked);
				//var receiveDate = (new Date()).getTime(); Test time till serveranswer
				//var responseTimeMs = receiveDate - sendDate; Test time till serveranswer
				//alert(responseTimeMs / 1000 + " seconds till server answered"); Test time till serveranswer
				console.log ("Zeit: "+station.station+" up "+stationTime); 
				
		}});
	}
	if (station.nDownBins > 0) {
		downLoad = $.ajax({
			url: "/timeseries/adcp/"+station.station+"/dirmag/"+station.depth+"/down/"+stationTime,
			async: true,
			success: function(data) {
			
				station.moveDownArrows( data.magnitudes, data.directions, document.getElementById( 'colorGradientOnArrowsCheckbox' ).checked);
				console.log ("Zeit: "+station.station+" down "+stationTime);  
			}
		});
		
	}
	
	$.when(
		upLoad,
		downLoad
	 			
	).then( function(){
		
		arrowCounter++;
		
		//here both directions (if existent) have moved
		if (station.nDownBins > 0) {
			AutoplayNS.incNumberOfMovedArrowDirections();
		}
		if (station.nUpBins > 0) {
			AutoplayNS.incNumberOfMovedArrowDirections();
		}
		
		if (arrowCounter < stationsOfCurrentRegionList.length) {
			
			moveArrows(stationsOfCurrentRegionList[arrowCounter], uniTime, arrowCounter);
		}
		
		if (arrowCounter >= stationsOfCurrentRegionList.length){
			
			document.getElementById( 'arrowsVisibleCheckbox' ).disabled = false;
		}
			
		}
	);
	
 	
}

//This function is called at the initial loading and after every button-click
	 
function show() {
	
	var differenceBetweenMinAndMaxX = biggestx - smallestx;
	var differenceBetweenMinAndMaxY = biggesty - smallesty;
	var biggestxToNextThousand, biggestyToNextThousand;
	var firstStationIndex = 0;
	var bb = new THREE.Box3();
	var inputs = document.getElementsByTagName('BUTTON');
	
	AutoplayNS.resetNumberOfMovedArrowDirections();
	numberOfStationDirections = 0;

	stationsGroup = new THREE.Group(); 
	 
	labelingGroup = new THREE.Group();
	 
	lineGroup = new THREE.Group();
	  
	getMinAndMaxForSliderAndTimestamps(stations[firstStationIndex], firstStationIndex, [], []);
	
	//empty the stationsOfCurrentRegionList  
	stationsOfCurrentRegionList = [];
	 
	scene.add( lineGroup );
	scene.add( stationsGroup );
	scene.add( labelingGroup );

	//for the position of the coordinate system
	zerox = Math.floor( smallestx );
	zeroy = Math.floor( smallesty );
	
	//for the size of the camera
	biggestxToNextThousand =  Math.ceil( ( differenceBetweenMinAndMaxX ) * SCALE_VALUE/1000 )*1000;  
	biggestyToNextThousand =  Math.ceil( ( differenceBetweenMinAndMaxY ) * SCALE_VALUE/1000 )*1000;
	
	//camerasize needs to depend on the size of the coordinate system 
	if ( biggestxToNextThousand < 3000 && biggestyToNextThousand < 3000 ) {
		camera = new THREE.PerspectiveCamera( 60, window.innerWidth /window.innerHeight, 1.0, 10000 ); 
	}
	else {
	
		if ( biggestxToNextThousand < biggestyToNextThousand ) {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth /window.innerHeight, 1.0, biggestyToNextThousand+7000 );
		}
		
		else {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth /window.innerHeight, 1.0, biggestxToNextThousand+7000 );
		
		}
		
	}
	camera.up.set( 0, 0, 1);
		 
	loadLut();
	
 
	controls = new THREE.OrbitControls( camera );
	 
	// smallestx and smallesty are the smallest values where we have data for the ocean-floor
	// zerox and zeroy are the floor-rounded min-values
	// they represent the zero-values on the x- and the y-axis in the scene itself
	// the grid starts when it is needed - at (smallestx - zerox) on the x-axis
	// and (smallesty - zeroy) on the y-axis
	
	//the size of the squares needs to depend from the size of the ocean-floor
	calculateGridDistancesAndAddGrid( differenceBetweenMinAndMaxX, differenceBetweenMinAndMaxY );
 	
	placeNewStations();
    
	createOceanFloorMesh();
  
	//to calculate the position of the camera
	//the ocean-floor has to be in the middle of the scene 
	
	bb.setFromObject( oceanFloorMesh );
	bb.center( camera.position );
	
	camera.position.z = 3000;
	bb.center( controls.target );
	
	controls.target0 = controls.target.clone();
	controls.position0 = controls.object.position.clone();
	controls.zoom0 = controls.object.zoom;
  
	//Eventlistener
	window.addEventListener( 'resize', onWindowResize, false );
	
	//For testing 
	//window.addEventListener( "keydown", showOceanFloorPosition, true);
	//window.addEventListener( "mousedown", testOceanFloorPosition, true);
	   
	//render(); -> Double rendering BUG!
	  
	document.getElementById( 'colorGradientOnArrowsCheckbox' ).disabled = false;
	document.getElementById( 'arrowsVisibleCheckbox').disabled = false;
	
	//enable the GUI-elements after loading 
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].disabled = false;
	}
	
	//disable only the button that belongs to the showed region (no second load of a loaded region!)
	
	var regionButton = document.getElementById( region );
	regionButton.disabled = true;  
	 
}

function placeNewStations(){
	
	for( var i = 0; i < stations.length; i++ ) {
		
		if ( region == stations[i].region ) {
		
			var cubeAlreadyPlaced = false;
			
			for ( var j = 0; j < stationsOfCurrentRegionList.length; j++ ) {
				
				if (stations[i].station == stationsOfCurrentRegionList[j].station) {
					
					cubeAlreadyPlaced = true;
					
					if (stations[i].adcpDirection == "up") {
						
						stationsOfCurrentRegionList[j].addUpBins(stations[i].nBins, stations[i].adcpFirstBinHeight, stations[i].adcpBinHeight);
						numberOfStationDirections++;
						
					}
					if (stations[i].adcpDirection == "down") {
						
						stationsOfCurrentRegionList[j].addDownBins(stations[i].nBins, stations[i].adcpFirstBinHeight, stations[i].adcpBinHeight);
						numberOfStationDirections++;
					}
					
					 
				}
				
			}
			
			if (!cubeAlreadyPlaced) {
				
				var cube = new MeasuringStation ( stations[i].lon, stations[i].nBins, stations[i].device, 
				stations[i].lat, stations[i].adcpBinHeight, stations[i].region, 
					stations[i].station, stations[i].t_reference, stations[i].adcpDirection, 
						stations[i].depth, stations[i].adcpFirstBinHeight ); 
				 
				stationsGroup.add(cube.cube);
			 	stationsOfCurrentRegionList.push(cube);
				numberOfStationDirections++;
					
			}
		
		}
	 	
		
	}
 
	
	writeNamesOnStations(0);
	
}



function writeOnArrow(distance, num) {
	
	var fontLoader = new THREE.FontLoader();
	
	fontLoader.load( 'lib/threejs/helvetiker/helvetiker_bold.typeface.json', function ( font ) {
			
		var textGeo = new THREE.TextGeometry( num, {

			font: font,
			size: 16,
			height: 1 

		} );
		
		lutArrow.writeOn(textGeo, num);
		
		num = num + distance; 
		
		if ( num <= LENGTH_OF_LUT_ARROW   ) {   
			
			writeOnArrow( distance, num );
			
		}
		
		else {
			
			var textGeo = new THREE.TextGeometry( "mm/s", {

			font: font,
			size: 28,
			height: 1 

			} );
			
			lutArrow.writeOn(textGeo, 600);
			
			
		}
	
	});
	
	
}


function writeNamesOnStations(num){
	 
	var fontLoader = new THREE.FontLoader();
	var fontSize = BOX_SIZE/stationsOfCurrentRegionList[num].device.length;

	fontLoader.load( 'lib/threejs/helvetiker/helvetiker_bold.typeface.json', function ( font ) {
		
		var textGeo = new THREE.TextGeometry( stationsOfCurrentRegionList[num].device, {

			font: font,
			size: fontSize,
			height: 1 

		} );
		
		stationsOfCurrentRegionList[num].makeNames(textGeo);
		num++;
		if ( num < stationsOfCurrentRegionList.length ) {
			
			writeNamesOnStations(num);
			
		}
		
		else {
			document.getElementById( 'stationsVisibleCheckbox' ).disabled = false;
			
		}
	
	});
	 
}
 
  
function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	 

}
  
  

function render() {
	
	var delta = clock.getDelta();

	controls.update( delta );
     
	requestAnimationFrame( render );
	renderer.render( scene, camera );
	 
}

function round(value, decimals) {
	return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

 

function roundHeightsUp( height) {

	if (height < 0) {
	
		height = height * -1;
		height = Math.ceil(height/100)*100;
		height = height * -1;
		return height; 

	
	}
	
	else {
	
		return Math.ceil(height/100)*100;
	}

}

function roundHeightsDown( height) {

	if (height < 0) {
	
		height = height * -1;
		height = Math.floor(height/100)*100;
		height = height * -1;
		return height; 

	
	}
	
	else {
	
		return Math.floor(height/100)*100;
	}

}


 
window.onload = init;