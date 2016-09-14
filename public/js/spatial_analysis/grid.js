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


function calculateGridDistancesAndAddGrid( differenceBetweenMinAndMaxX, differenceBetweenMinAndMaxY ) {
	
	var smallestDifferenceBetweenMinAndMax;
	var calculatedGridDistance;
	var zerosDirectlyAfterDot;
	var predecimal, decimal;
	
	if ( differenceBetweenMinAndMaxX <= differenceBetweenMinAndMaxY ) {
		smallestDifferenceBetweenMinAndMax = differenceBetweenMinAndMaxX;
	}
	else {
		smallestDifferenceBetweenMinAndMax = differenceBetweenMinAndMaxY;
		
	}
	console.log ("Smallest difference for grid: "+smallestDifferenceBetweenMinAndMax);
	
	//Math.floor always rounds downward to nearest integer
	predecimal = Math.floor(smallestDifferenceBetweenMinAndMax);
	decimal = smallestDifferenceBetweenMinAndMax - predecimal;
	
	//console.log(predecimal+" "+decimal);
	//TEST: predecimal = 3344;
	if (predecimal > 0) {
		
		console.log( "calculatedGridDistance: "+Math.pow(10, predecimal.toString().length) / 100 );
		calculatedGridDistance = Math.pow(10, predecimal.toString().length) / 100; 
		zerosDirectlyAfterDot = 0;
	}
	else {
		
		var decimalWithoutDot = decimal.toString().split(".")[1];
		//TEST decimalWithoutDot = "000003234";
		console.log("decimalWithoutDot: "+decimalWithoutDot);
		
		var leftmostChar = decimalWithoutDot.substring(0,1);
		var zeroCounter = 0;
		while (leftmostChar == "0") {
			
			zeroCounter++;
			leftmostChar = decimalWithoutDot.substring(zeroCounter,zeroCounter+1);
			
		}
		
		zerosDirectlyAfterDot = zeroCounter;
		console.log("zerosDirectlyAfterDot: "+ zerosDirectlyAfterDot);
		
		var gridDistanceString = "0.";
		
		for (var i = 0; i < zerosDirectlyAfterDot; i++) {
			
			gridDistanceString = gridDistanceString + "0";
			
		}
		
		gridDistanceString = gridDistanceString + "1";
		calculatedGridDistance = parseFloat(gridDistanceString);
		
		console.log ("calculatedGridDistance: "+calculatedGridDistance);
	}
	
	 
	addGrid( calculatedGridDistance, minheight, smallestx - zerox, biggestx - zerox, smallesty - zeroy, biggesty - zeroy, zerox, zeroy );
 
}




function addGrid( distance, height, xStart, xEnd, yStart, yEnd, zerox, zeroy ) {
	
	
	var pinlength = distance / 2;

	//because the grid shall start at a multiple of the distance-variable -- calculated from
	//the start of the world's-coordiate-system (x=0; y=0)
	//on the x-axis it can start a little bit more left as it would be needed for the oceanGroundMesh
	//on the y-axis the start can be a little bit deeper than needed 
	if (floatSafeRemainder(xStart, distance) > 0.0) {
		xStart = xStart - floatSafeRemainder(xStart, distance);
	}
	if (floatSafeRemainder(yStart, distance) > 0.0) {
		yStart = yStart - floatSafeRemainder(yStart, distance);
	}
	if (floatSafeRemainder(xEnd, distance) > 0.0) {
		xEnd = xEnd + distance - floatSafeRemainder(xEnd, distance);
	}
	if (floatSafeRemainder(yEnd, distance) > 0.0) {
		yEnd = yEnd + distance - floatSafeRemainder(yEnd, distance);
	}
	
	xStart = round(xStart, 3); //TODO
	yStart = round(yStart, 3); //TODO
	xEnd = round(xEnd, 3); //TODO
	yEnd = round(yEnd, 3); //TODO
	
	
	//makes the white plane
	//there are two white triangle-shaped faces that build the rectangle-shaped plane 
	var planeMaterial = new THREE.MeshBasicMaterial({color:0xffffff });	
	var planeGeometry = new THREE.Geometry;
	planeGeometry.vertices.push(new THREE.Vector3(xStart, yStart, height));
	planeGeometry.vertices.push(new THREE.Vector3(xEnd, yStart, height));
	planeGeometry.vertices.push(new THREE.Vector3(xEnd, yEnd, height));
	planeGeometry.vertices.push(new THREE.Vector3(xStart, yEnd, height));
	
	planeGeometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
	planeGeometry.faces.push( new THREE.Face3( 0, 2, 3 ) );
	
	plane = new THREE.Mesh( planeGeometry, planeMaterial);
	scene.add(plane);
	  
	plane.scale.set(SCALE_VALUE,SCALE_VALUE,1);
 
	
	//draws the lines on the plane
	var lineBorderMaterial = new THREE.LineBasicMaterial({color:0x000000 });
	
	//needed for drawing the last square (the distance is added here, so it matches with xEnd / yEnd)
	var newXEnd = xEnd - distance;
	var newYEnd = yEnd - distance;
	newXEnd = round (newXEnd,5); //TODO
	newYEnd = round (newYEnd,5); //TODO
	
	yStart = round (yStart, 5);
	xStart = round (xStart, 5);
	  
	for(var i = xStart; i <= newXEnd; i = round(i + distance,5)) {
	
		for (var j = yStart;  j  <= newYEnd; j = round(j+distance,5)) {
		
			i = round(i,5);//TODO
			j = round(j,5);//TODO
			
			var iDis = round(i+distance,5);
			var jDis = round(j+distance,5);
			
			var borderGeometry = new THREE.Geometry();
			
			//draws the single squares
			borderGeometry.vertices.push(new THREE.Vector3(i, j, height)); 
			borderGeometry.vertices.push(new THREE.Vector3(iDis , j, height));		 
			borderGeometry.vertices.push(new THREE.Vector3(iDis , jDis, height));
			borderGeometry.vertices.push(new THREE.Vector3(i, jDis, height));
			borderGeometry.vertices.push(new THREE.Vector3(i, j, height));
			
			var borderLine = new THREE.Line( borderGeometry, lineBorderMaterial );
			lineGroup.add(borderLine);
			borderLine.scale.set(SCALE_VALUE,SCALE_VALUE,1);
			
			//draws the pins
			 	
			var binYGeometry = new THREE.Geometry();
			
			binYGeometry.vertices.push( new THREE.Vector3(xStart, j, height) );
			binYGeometry.vertices.push( new THREE.Vector3(xStart-pinlength, j, height) );
			
			var yLine = new THREE.Line( binYGeometry, lineBorderMaterial);
			lineGroup.add( yLine );
			yLine.scale.set( SCALE_VALUE, SCALE_VALUE, 1 );
			
			 
		}
		
		//draws the pins
		 
		
		var binXGeometry = new THREE.Geometry();
		
		binXGeometry.vertices.push( new THREE.Vector3(i, yStart, height) );
		binXGeometry.vertices.push( new THREE.Vector3(i, yStart-pinlength, height) );
		
		var xLine = new THREE.Line( binXGeometry, lineBorderMaterial);
		lineGroup.add( xLine );
		xLine.scale.set( SCALE_VALUE, SCALE_VALUE, 1 );
	 
	}
	
	//the last pins
	var binXGeometry = new THREE.Geometry();
		
	binXGeometry.vertices.push( new THREE.Vector3(xEnd, yStart, height) );
	binXGeometry.vertices.push( new THREE.Vector3(xEnd, yStart-pinlength, height) );
	
	var xLine = new THREE.Line( binXGeometry, lineBorderMaterial);
	lineGroup.add( xLine );
	xLine.scale.set( SCALE_VALUE, SCALE_VALUE, 1 );
	
	var binYGeometry = new THREE.Geometry();
			
	binYGeometry.vertices.push( new THREE.Vector3(xStart, yEnd, height) );
	binYGeometry.vertices.push( new THREE.Vector3(xStart-pinlength, yEnd, height) );
	
	var yLine = new THREE.Line( binYGeometry, lineBorderMaterial);
	lineGroup.add( yLine );
	yLine.scale.set( SCALE_VALUE, SCALE_VALUE, 1 );
	
	
	//draws two arrows to show the direction of the scales
	var dir = new THREE.Vector3( 1, 0, 0  );
	var origin = new THREE.Vector3( xEnd * SCALE_VALUE, yStart * SCALE_VALUE, minheight );
	var arrow = new THREE.ArrowHelper( dir, origin, 500, 0x000000, 50, 50 );
	labelingGroup.add(arrow);
	
	var dir2 = new THREE.Vector3( 0, 1, 0  );
	var origin2 = new THREE.Vector3( xStart * SCALE_VALUE, yEnd * SCALE_VALUE, minheight );
	var arrow2 = new THREE.ArrowHelper( dir2, origin2, 500, 0x000000, 50, 50 );
	labelingGroup.add(arrow2);

	
	
	//lable the axes
	makeText("lon", xEnd, yStart, minheight, 150, "name");
	makeText("lat", xStart, yEnd, minheight, 150, "name");
	lableAxis( distance * 2000, zerox, zeroy, minheight, pinlength, distance, xStart, xEnd, yStart, yEnd); 
	 
}

function lableAxis( size, zerox, zeroy, minheight, pinlength, distance, xStart, xEnd, yStart, yEnd){
	
	
	//lables for the x-axis / lon-axis
	for (var i = xStart; i <= xEnd; i = round(i+distance, 5)) {  
		
		makeText(round(zerox + i, 2), i, yStart-pinlength, minheight, size, "setX");  
		//TODO: Round abhängig von ...
		
	}
	
	//lables for the y-axis / lat-axis
	for (var i = yStart; i <= yEnd; i = round(i+distance, 5)) {  
		
		makeText(round(zeroy + i, 2), xStart -pinlength, i, minheight, size, "setY"); 
		//TODO: Round abhängig von ...
		
	}
	 
}


function makeText( content, xPos, yPos, zPos, size, movement ) {
	
  
	var loader = new THREE.FontLoader();
	loader.load( 'lib/threejs/helvetiker/helvetiker_bold.typeface.json', function ( font ) {

		var textGeo = new THREE.TextGeometry( content, {

			font: font,
			size: size,
			height: 1 
		 
	});

	textGeo.computeBoundingBox();
	var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

	var textMaterial = new THREE.MeshBasicMaterial( {color:0x000000} );

	var mesh = new THREE.Mesh( textGeo, textMaterial );
	
	
	//to center the position
	//the boxs helps to get the size of the single label 
	var box = new THREE.Box3().setFromObject( mesh );
	//console.log( box.min, box.max, box.size() );
	
	
	//set the position of the labels
	if (movement == "setX") {
		
		//the "- box.size().x / 2" puts the label in the middle
		//of the pin 
		mesh.position.x = xPos * SCALE_VALUE - box.size().x / 2;
		mesh.position.y = yPos * SCALE_VALUE - box.size().y ;;
		mesh.position.z = zPos;
		
	}
	
	if (movement == "setY") {
			
		mesh.position.x = xPos * SCALE_VALUE - box.size().x;
		mesh.position.y = yPos * SCALE_VALUE - box.size().y / 2;
		mesh.position.z = zPos;
		
	}
	
	if (movement == "name") {

		mesh.position.x = xPos * SCALE_VALUE;
		mesh.position.y = yPos * SCALE_VALUE;
		mesh.position.z = zPos;
	
	}
	 

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	labelingGroup.add( mesh );

	} );
 
}

function floatSafeRemainder(val, step){
	
	if (val == 0) {
		
		return step;
		
	}
	
	else {
		var valDecCount = (val.toString().split('.')[1] || '').length;
		var stepDecCount = (step.toString().split('.')[1] || '').length;
		var decCount = valDecCount > stepDecCount? valDecCount : stepDecCount;
		var valInt = parseInt(val.toFixed(decCount).replace('.',''));
		var stepInt = parseInt(step.toFixed(decCount).replace('.',''));
		return (valInt % stepInt) / Math.pow(10, decCount);
	}
}
