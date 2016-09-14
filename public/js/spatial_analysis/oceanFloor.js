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

  
function createOceanFloorMesh () {
	
	var oceanBaseGeometry = new THREE.Geometry();
	
	for (var i = 0; i < vertices.length; i++) {
		var v = new THREE.Vector3((lon[vertices[i][0]] - zerox), (lat[vertices[i][1]] - zeroy), vertices[i][2] );    
		oceanBaseGeometry.vertices.push(v);
	}
	
	for (var i = 0; i < faces.length; i++) {
		oceanBaseGeometry.faces.push( new THREE.Face3(faces[i][0],faces[i][1],faces[i][2]));
	}
	
	geometry = new THREE.BufferGeometry().fromGeometry( oceanBaseGeometry );
	oceanMeshMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors} );	
	
	oceanFloorMesh = new THREE.Mesh( geometry, oceanMeshMaterial );
	colorizeOceanFloorMesh();
	
	scene.add(oceanFloorMesh);
	oceanFloorMesh.scale.set(SCALE_VALUE,SCALE_VALUE,1);
	document.getElementById( 'oceanFloorVisibleCheckbox' ).disabled = false;
		
	 	
}
	
function colorizeOceanFloorMesh() {

	var lutColors = [];
	for ( var i = 0; i < faces.length; i++ ) { 
		var colorValue = vertices[faces[ i ][0]][2];
		color = lut.getColor( colorValue );
		if ( color == undefined ) {
			console.log( "ERROR: " + colorValue );
		} else {
			lutColors[ 9 * i     ] = color.r;
			lutColors[ 9 * i + 1 ] = color.g;
			lutColors[ 9 * i + 2 ] = color.b;
		}
		
		var colorValue = vertices[faces[ i ][1]][2];
		color = lut.getColor( colorValue );
		if ( color == undefined ) {
			console.log( "ERROR: " + colorValue );
		} else {
			lutColors[ 9 * i + 3  ] = color.r;
			lutColors[ 9 * i + 4 ] = color.g;
			lutColors[ 9 * i + 5 ] = color.b;
		}
		
		var colorValue = vertices[faces[ i ][2]][2];
		color = lut.getColor( colorValue );
		if ( color == undefined ) {
			console.log( "ERROR: " + colorValue );
		} else {
			lutColors[ 9 * i + 6 ] = color.r;
			lutColors[ 9 * i + 7 ] = color.g;
			lutColors[ 9 * i + 8 ] = color.b;
		}
	}
	oceanFloorMesh.geometry.addAttribute( 'color', new THREE.BufferAttribute( new Float32Array( lutColors ), 3 ) );
 
}