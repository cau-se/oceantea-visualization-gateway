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


//a recursive function to find the min and max for the slider
function getMinAndMaxForSliderAndTimestamps(station, stationCounter, sliderMins, sliderMaxs) {
	
	var treference = new Date(station.t_reference); 
	
	$.when(
	
		$.ajax({
			url: "/timeseries/adcp/"+station.station+"/dirmag/"+station.depth+"/"+station.adcpDirection+"/timestamps",
			async: true,
			success:function(data){
				stationCounter++;
				var d = new Date(station.t_reference);
				var d2 = new Date(station.t_reference);
				var minD = d.setSeconds(d.getSeconds() + data.timestamps[0]); //the smallest time-value -- calculated with the offset
				var maxD = d2.setSeconds(d2.getSeconds() + data.timestamps[data.timestamps.length-1]); //the highest val
				sliderMins.push(minD);
				sliderMaxs.push(maxD);
				
				
				//listOfAllTimestamps needed for autoplay 
				for (var i = 0; i < data.timestamps.length; i++) {
					
					var d3 = new Date(station.t_reference);
					var timeWithOffsetFromStation = d3.setSeconds(d3.getSeconds() + data.timestamps[i]);
					listOfAllTimestamps.push(timeWithOffsetFromStation);
					 
				}
				
			}
		}) 
	).then( function(){
		
		
		if (stationCounter < stations.length) {
			getMinAndMaxForSliderAndTimestamps(stations[stationCounter], stationCounter, sliderMins, sliderMaxs);
		} 
		else {
					
			//sorts the list with the timestamps in ascending order 
			listOfAllTimestamps.sort(function(a, b){return a-b});
			
			//remove duplicates 
			listOfAllTimestamps = deleteDoubleEntries(listOfAllTimestamps);
		 
			//set min and max of slider 
			var sliderMin = sliderMins[0];
			var sliderMax = sliderMaxs[0]
			
			for (var i = 1; i < sliderMins.length; i++) {
	
				if(sliderMins[i] < sliderMin) {
					sliderMin = sliderMins[i];
				
				}
				if(sliderMaxs[i] > sliderMax) {
				
					sliderMax = sliderMaxs[i];
				}
	
			}
			
			
			//sliderMax = new Date(sliderMax);
			//sliderMin = new Date(sliderMin);
			
			
			//slider with loaded min & max 
			//the value are the ms //TODO
			changeTimeSlider = $('#timeSlider').slider({
				formatter: function(value) {
					var val = new Date(value);
					var valUtc = new Date(value).toISOString();
					
					//at every movement of slider the arrows get visible if hided before 
					document.getElementById( 'arrowsVisibleCheckbox' ).checked = true;
					lutArrow.visible = true;
					
					return valUtc; //TODO: Check calc (UTC)
				},
				
				tooltip: "always"
				 
			});
			
			$("#timeSlider").slider('setAttribute', 'max', sliderMax);
			$("#timeSlider").slider('setAttribute', 'min', sliderMin);
			
			$("#timeSlider").slider('refresh');
			 
			changeTimeSlider.data('slider').setValue(sliderMin); 
			moveArrows(stationsOfCurrentRegionList[0], sliderMin, 0);
			
					
		}
		}
	);
	
	
	
}

function MSInS(valInMS) {
	
	return valInMS/1000;
}

function loadSlider() {
	
	 
	var minSpeedSlider = 500;
	var maxSpeedSlider = 10000;
	var initValSpeedSlider = 3000;
	
	
	//init slider
	changeTimeSlider = $('#timeSlider').slider({
		formatter: function(value) {
		  
			return value;
		},
		
				 
	});
	
	changeSpeedSlider = $('#speedSlider').slider({
		formatter: function(value) {
			
			return MSInS(value)+" seconds";
			 
		},
		
				 
	});
	
	//the speedSlider is the same for all regions -> init its values in this function 
	$("#speedSlider").slider('setAttribute', 'max', maxSpeedSlider); 
	$("#speedSlider").slider('setAttribute', 'min', minSpeedSlider); 
	$("#speedSlider").slider('setAttribute', 'step', minSpeedSlider); 
	$("#speedSlider").slider('refresh');
	
	changeSpeedSlider.data('slider').setValue(initValSpeedSlider);
	
	whatTheChangeTimeSliderDoes();
	whatTheChangeSpeedSliderDoes();
	
	
	 
}
function whatTheChangeTimeSliderDoes() {
	
	var originalTimeVal;
	
	changeTimeSlider.slider().on('slideStart', function(ev){
		originalTimeVal = changeTimeSlider.data('slider').getValue();
	});

	changeTimeSlider.on('slideStop', function(ev){
		var timeValue = changeTimeSlider.data('slider').getValue();
		if(originalTimeVal != timeValue   ) {
			console.log (timeValue);
 
			moveArrows(stationsOfCurrentRegionList[0], timeValue,0);
			 
			//TODO: reload still needed??
			
		}
	
	});
	
	
}

function whatTheChangeSpeedSliderDoes() {
	
	var originalSpeedVal;
	
	changeSpeedSlider.slider().on('slideStart', function(ev){
		originalSpeedVal = changeSpeedSlider.data('slider').getValue();
	});

	changeSpeedSlider.on('slideStop', function(ev){
		var speedValue = changeSpeedSlider.data('slider').getValue();
		if(originalSpeedVal != speedValue ) {
			 
			var timeIntervalTillAutoplayMovement = speedValue; 
			console.log(timeIntervalTillAutoplayMovement+" neu")
		  
			AutoplayNS.resetPlay(timeIntervalTillAutoplayMovement);
			 
	 
		}
	});
	
	
}

//Autoplay-Namespace
var AutoplayNS = AutoplayNS|| {};
AutoplayNS.autoplayIndex = 0;
AutoplayNS.autoplay = false;
AutoplayNS.playButtonActivated;
AutoplayNS.numberOfMovedArrowDirections;
AutoplayNS.clearPlay = function ( ) {
	clearInterval(AutoplayNS.playButtonActivated);
	AutoplayNS.autoplay = false;
}

AutoplayNS.resetPlay = function (timeIntervalTillAutoplayMovement) {
	
	if (AutoplayNS.autoplay) {
		clearInterval(AutoplayNS.playButtonActivated);
		AutoplayNS.playButtonActivated = setInterval(AutoplayNS.play, timeIntervalTillAutoplayMovement);	
		console.log(timeIntervalTillAutoplayMovement+" gesetzt");
	}
}

AutoplayNS.incNumberOfMovedArrowDirections = function(){
	
	AutoplayNS.numberOfMovedArrowDirections++;
	
}

AutoplayNS.resetNumberOfMovedArrowDirections = function (){
	
	AutoplayNS.numberOfMovedArrowDirections=0;
	
}

AutoplayNS.play = function () {
			
	var arrowCounter = 0;
	var firstStation = stationsOfCurrentRegionList[0];
	  
	var currentValue =  changeTimeSlider.slider( 'getValue' );
	
	console.log(numberOfStationDirections);
	console.log(AutoplayNS.numberOfMovedArrowDirections+" numberOfMovedArrowDirections");
		
	//no reset of the slider 
	while (currentValue >= listOfAllTimestamps[AutoplayNS.autoplayIndex]) {
		
		AutoplayNS.autoplayIndex++;
	}
	
	if ( AutoplayNS.numberOfMovedArrowDirections >= numberOfStationDirections && AutoplayNS.autoplayIndex < listOfAllTimestamps.length) {
		
		AutoplayNS.autoplayIndex++;
		var value = listOfAllTimestamps[AutoplayNS.autoplayIndex];
		changeTimeSlider.slider( 'setValue', value);
		
		console.log(value);
			
		moveArrows(firstStation, value, arrowCounter);
		 
		AutoplayNS.numberOfMovedArrowDirections = 0;
	
	}
	  
}

AutoplayNS.resetIndex = function () {
	
	AutoplayNS.autoplayIndex = 0;
	 
}

AutoplayNS.createPlayButton = function () {
	 
	var playButton = document.getElementById( 'playButton' );
	playButton.onclick = function() {
		
		AutoplayNS.resetIndex();	
		AutoplayNS.autoplay = !AutoplayNS.autoplay;
		console.log("autoplay: "+AutoplayNS.autoplay);
		
		//set at active state and back (so user can see if autoplay is activated)
		if (AutoplayNS.autoplay) {
			var timeIntervalTillAutoplayMovement = changeSpeedSlider.data('slider').getValue();
			playButton.className = "btn btn-primary oceanteaSelectionBtn active";
			AutoplayNS.playButtonActivated = setInterval(AutoplayNS.play, timeIntervalTillAutoplayMovement);
			console.log(timeIntervalTillAutoplayMovement+ "Zeit bei Autoplaystart")
		}
		
		else {
			
			playButton.className = "btn btn-primary oceanteaSelectionBtn";
			clearInterval(AutoplayNS.playButtonActivated);
			 
		}
	  	
		
	}
	
	
}