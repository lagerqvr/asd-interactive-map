const geoFile = "https://raw.githubusercontent.com/sandravizz/Analytical-System-Design-D3.js/main/Datasets/world_countries_geojson.geojson";
const dataFile = "https://raw.githubusercontent.com/mohamadwaked/classico/master/p0017_dataset.csv";

var back_color = "#ECF0F1";
var country_color = "#2C3E50";
var border_color = "#2C3E50";
var tooltip_col = "white";
var black_col = "#210612";
var country_over_col = "#BDC3C7";
var moderate_col = "#2C3E50";


// Background
d3.select("body")
	.style("background", back_color)
	/* .style("font-family", "Arial, Geneva, sans-serif") */
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


// Title
var story = svg
	.append('image')
	.attr('xlink:href', "https://user-images.githubusercontent.com/5682399/207156647-5ad0cabf-72b9-4a50-86b2-4b374039a078.png")
	.attr('width', 480)
	.attr('height', 80)
	.style("opacity", 1)
	.attr("transform", "translate(-20,-80)");

// Sub-Title
svg.append('text')
	.text('“How do you defeat terrorism? Don’t be terrorized.” - Salman Rushdie')
	.attr("x", -14)
	.attr("y", -5)
	.style("font", "14px Times New Roman")
	.style("opacity", 0.9);

var story = svg
	.append('image')
	.attr('width', 1160)
	.attr('height', 170)
	.style("opacity", 1)
	.attr("transform", "translate(-20,-110)");

// Store global objects here
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
		.style("font", "11px Arial")
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
			.style("padding", "5px")
			.style("border-radius", "5px");

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