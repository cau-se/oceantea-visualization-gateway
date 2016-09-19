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

function colorGradientOnArrowsCheck() {
	
	for( var i = 0; i < stationsOfCurrentRegionList.length; i++ ) {
			
		stationsOfCurrentRegionList[i].colorizeMarks( document.getElementById( 'colorGradientOnArrowsCheckbox' ).checked );
			 
	}
}

function arrowsVisibleCheck() {
	
	for( var i = 0; i < stationsOfCurrentRegionList.length; i++ ) {
			
		stationsOfCurrentRegionList[i].showOrHideArrows(document.getElementById( 'arrowsVisibleCheckbox' ).checked);
		
	}
	
	if (document.getElementById( 'arrowsVisibleCheckbox' ).checked) {
		
		lutArrow.visible = true;
	}
	
	else {
		
		lutArrow.visible = false;
		
	}
	   
}

function oceanFloorVisibleCheck() {
	
	if (document.getElementById( 'oceanFloorVisibleCheckbox' ).checked) {
		
		oceanFloorMesh.visible = true;
	}
	
	else {
		
		oceanFloorMesh.visible = false;
		
	}
	hideOrShowLut();
 
}
 

function stationsVisibleCheck() {
	
	if (document.getElementById( 'stationsVisibleCheckbox' ).checked) {
		
		for( var i = 0; i < stationsOfCurrentRegionList.length; i++ ) {
			
			stationsOfCurrentRegionList[i].makeVisible(); 
		}
		
		 
	}
	
	else {
		
		for( var i = 0; i < stationsOfCurrentRegionList.length; i++ ) {
			
			stationsOfCurrentRegionList[i].makeTransparent();
			 
		}
				
	}
	
	
}