const geoFile = "https://raw.githubusercontent.com/sandravizz/Analytical-System-Design-D3.js/main/Datasets/world_countries_geojson.geojson";
const dataFile = "https://raw.githubusercontent.com/mohamadwaked/classico/master/p0017_dataset.csv";

var back_color = "gray";
var country_color = "green";
var border_color = "black";
var tooltip_col = "#e0e0e0";
var black_col = "#210612";
var country_over_col = "#2d0b1f";
var moderate_col = "#ff0066";


// Background
d3.select("body")
	.style("background", back_color)
	.style("font-family", "Verdana, Geneva, sans-serif")
	.attr("height", "700px");

// Margin
var margin = { top: 65, right: 50, bottom: 20, left: 50 },
	width = 1550 - margin.left - margin.right,
	height = 800 - margin.top - margin.bottom;

// -------------------------------------- div for svg

var div_main = d3.select("body")
	.append("div")
	.attr("id", "div_main")
	// .style("border", "10px solid white")
	.style("margin", "50px auto");

// -------------------------------------- svg board

var svg = div_main.append('svg')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.style("display", "block")
	.style("margin", "0px auto")
	// .style("border", "2px solid grey") 
	.style("background", back_color)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// store global objects here
var map = {};
var dataset = {};

Promise.all([

	d3.json(geoFile),


])
	.then(function ([shapes, data]) {
		map.features = shapes.features;
		dataset = data;
		/*	
				console.log(dataset)
				console.log(map.features)
				console.log(map.features[10].properties.name)
		*/
		// Call the draw function 
		draw();

	});

const projection = d3.geoNaturalEarth1() //d3.geoNaturalEarth1() d3.geoMercator()
	.scale(200)
	.translate([(width / 2) - 140, (height / 2) + 10]);

// Path generator 
const geoPath = d3.geoPath()
	.projection(projection);

function draw() {

	console.log(map.features[0])
	// country path 
	svg.selectAll("path.country")
		.data(map.features)
		.enter().append("path")
		.attr("class", "country")
		.attr("d", geoPath)
		.style("fill", country_color)
		.style("stroke", border_color)
		.style("stroke-width", "0.4");

	var country_tooltip = div_main.append("div")
		.attr("class", "country_tooltip")
		.style("opacity", 0)
		.style("pointer-events", "none")
		.style("position", "absolute")
		.style("text-align", "center")
		.style("width", "120px")
		.style("height", "30px")
		.style("font", "11px Tahoma")
		.style("color", tooltip_col)
		.style("background-color", "none")
		.style("border-radius", "9px")
		.style("padding", "4px")
		.style("line-height", "2")
		.style("display", "inline");

	// move
	var country_mousemove = function (event, d) {
		console.log(event)
		country_tooltip
			.transition()
			.duration(100)
			.style("opacity", 1);

		country_tooltip
			.html("<b> " + d.properties.name + "</b>")
			.style('left', (event.pageX) + 'px')
			.style('top', (event.pageY) + 'px');

		d3.select("div.country_tooltip b")
			.style("font-size", "10px")
			.style("color", tooltip_col)
			.style("background-color", "rgba(1, 12, 22, 0.5)")
			.style("padding", "5px");

		d3.select("div.tooltip span")
			.style("font-size", "5px")
			.style("color", "grey");

		d3.select(this)
			.style("fill", country_over_col)
			.style("fill-opacity", 0.6)
			.style("stroke-opacity", 1)
			.style("stroke", moderate_col);

	}

	// leave
	var country_mouseleave = function (d) {
		console.log("off")
		country_tooltip.transition()
			.delay(2000)
			.duration(200)
			.style("opacity", 0);

		d3.select(this)
			.style("fill", country_color)
			.style("fill-opacity", 0.4)
			.style("stroke-opacity", 0.8)
			.style("stroke", border_color);

	}

	// call the tooltip
	d3.selectAll("path.country")
		.on("mousemove", country_mousemove)
		.on("mouseout", country_mouseleave);
}