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

THREE.MarkedArrowHelper = ( function () {


	return function MarkedArrowHelper( dir, origin, length, color, headLength, headWidth, marksNeeded ) {
		
		this.color = color;
		this.distance = DISTANCES_OF_MARKS_ON_ARROWS; // in mm/s 
		this.markGroup = new THREE.Group();
		
	
		THREE.ArrowHelper.call( this, dir, origin, length, 0x000000, headLength, headWidth );
		this.add(this.markGroup);
		var material = new THREE.MeshBasicMaterial( { color: this.color } ); 
		var geometry = new THREE.SphereGeometry( 4, 4, 4 );  

		for (var i = this.distance; i <= length; i=i+this.distance) {
		
			var sphere = new THREE.Mesh( geometry, material ); 
			sphere.position.set( 0, i, 0 );
			this.markGroup.add( sphere );
		}
		
		this.addMarks();
		
		if (!marksNeeded) {
			
			this.addOrRemoveColorscaleMarks();
		}
		

	};

}() );

THREE.MarkedArrowHelper.prototype = Object.create( THREE.ArrowHelper.prototype );
THREE.MarkedArrowHelper.prototype.constructor = THREE.MarkedArrowHelper;

THREE.MarkedArrowHelper.prototype.removeMarks = function () {
	
	for (var i = 0; i < this.markGroup.length; i++) {
		
		this.remove(markGroup.getChildren[i]);	 
	} 
	
}

THREE.MarkedArrowHelper.prototype.addMarks = function () {
	
	for (var i = 0; i < this.markGroup.length; i++) {
		
		this.add(markGroup.getChildren[i]);	 
	}
	
}

 
THREE.MarkedArrowHelper.prototype.writeOn = function (textGeo, pos) {

	var xDistance = -40;
	
	textGeo.computeBoundingBox();
	var centerOffset = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

	var textMaterial = new THREE.MeshBasicMaterial( {color:0x000000} );

	var numMesh = new THREE.Mesh( textGeo, textMaterial );
	
	this.add(numMesh);
	var boxForGettingLength = new THREE.Box3().setFromObject( numMesh );
	numMesh.position.set( xDistance, pos-boxForGettingLength.size().y/2, 0 );  
	numMesh.rotation.z = Math.PI/2;  
	 
}

 

THREE.MarkedArrowHelper.prototype.addOrRemoveColorscaleMarks = function ( checked ) {
	
	this.removeMarks();	
	
	for (var i = 0; i < this.markGroup.children.length; i++) {
		
		
		if ( checked ) {
			
			
			this.markGroup.children[i].material = new THREE.MeshBasicMaterial({color:this.color});
			
		}
		
		else {
			  
			this.markGroup.children[i].material = new THREE.MeshBasicMaterial({color:0xff0000});
			
		}
	 
		
	}
	
	this.addMarks();	
}

 

 
 