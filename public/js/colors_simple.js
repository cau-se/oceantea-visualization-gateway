
var plotColors = [
	"steelblue",
	"orange",
	"maroon",
	"green",
	"indigo",
	"gold",
	"indianred",
	"darkcyan",
	"darkkhaki",
	"blueviolet",
	"lightsalmon",
	"olive",
	"seagreen",
	"slategray",
	"crimson",
	"lime"
];
var nextColorToAssign = 0;
var colorRegistry = {};


function resetColorRegistry() {
	nextColorToAssign = 0;
	colorRegistry = {};
}
function getPlotColor(region, station, type, depth) {
	var plotID = (groupBy == "type" ? station : region+"-"+type) + "-" + depth;
	if(colorRegistry.hasOwnProperty(plotID)) {
		return colorRegistry[plotID];
	}
	else {
		var color = plotColors[nextColorToAssign];
		nextColorToAssign = (nextColorToAssign+1)%plotColors.length;
		colorRegistry[plotID] = color;
		return color;
	}
}
