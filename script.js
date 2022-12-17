const geoFile = "https://raw.githubusercontent.com/sandravizz/Analytical-System-Design-D3.js/main/Datasets/world_countries_geojson.geojson";
const dataFile = "https://raw.githubusercontent.com/lagerqvr/asd-interactive-map/main/globalterrorismdb_0522dist%20-%202015-2020.csv";

var country_color = "#2C3E50";
var black_col = "#210612";
var moderate_col = "#2C3E50";

// -------------------------------------- color variables

var main_col = "#64DD17";
var title_col = "#64DD17";
var subtitle_col = "#ffffff";
var white_col = "#ffffff";
var light_col = "#64DD17";
var moderate_col = "#64DD17";
var dark_col = "#af0259";
var border_color = "#2C3E50";
var back_color = "gray";
var black_col = "#ECF0F1";
var country_over_col = "#BDC3C7";
var tooltip_col = "white";
var blue_col = "#4242ff";
var button_over_col = "#010c16";

// -------------------------------------- Main settings

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
console.log(vw, vh)

// Margin
var margin = { top: 65, right: 50, bottom: 20, left: 50 },
	width = vw - margin.left - margin.right,
	height = vh - margin.top - margin.bottom;

// Background
d3.select("body")
	.style("background", back_color)
	/* .style("font-family", "Arial, Geneva, sans-serif") */
	.attr("height", height);

// -------------------------------------- div for svg

var div_main = d3.select("body")
	.append("div")
	.attr("id", "div_main")
	// .style("border", "10px solid white")
	.style("margin", "30px auto");

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
	d3.csv(dataFile, function (attack) {
		if(!isNaN(attack.latitude)) {
			return {
				serial: +attack.eventid,
				region: attack.region_txt,
				attack_type: attack.attacktype1_txt,
				collap_cause: attack.collapsed_cause,
				coord: [+attack.longitude, +attack.latitude],
				victims: checkValue(attack.nkill + attack.nwound),
				date: parseTime(attack.imonth.toString() + "/" + attack.iday.toString() + "/" + attack.iyear.toString()),
				random: +attack.random
			}
		}
		
	})

])
	.then(function ([shapes, data]) {
		map.features = shapes.features;
		dataset = data;

		console.log(data)
		// console.log(map.features)
		// console.log(map.features[10].properties.name)

		// Call the draw function 
		draw();

	});
const projection = d3.geoNaturalEarth1() //d3.geoNaturalEarth1() d3.geoMercator()
	.scale(200)
	.translate([(width / 2) - 140, (height / 2) + 10]);

// Path generator 
const geoPath = d3.geoPath()
	.projection(projection);

// Area Scale
var areaScale = d3.scaleSqrt()
	.domain([0, 800])
	.range([0.6, 10]);

// Circle Scale
var circleScale = d3.scaleSqrt()
	.domain([0, 10])
	.range([0, 5]);

// Color Scale
var colorScale = d3.scaleLinear()
	.domain([0, 800])
	.range([moderate_col, light_col]);

// Opacity Scale
var opacityScale = d3.scaleLinear()
	.domain([0, 600])
	.range([0.2, 0.9]);

// Parse date
var parseTime = d3.timeParse("%m/%d/%Y");
console.log(parseTime("4/13/2015")); // test the formula

// Formate date
var formatTime = d3.timeFormat("%e %b %y");
// console.log(formatTime(new Date)); // test the formula

const checkValue = (val) => {
	if (!val == undefined || !val == null || !val == '0') {
		return val;
	} else {
		return '0';
	}
}

function draw() {

	console.log(map.features[0])
	// Country path 
	svg.selectAll("path.country")
		.data(map.features)
		.enter().append("path")
		.attr("class", "country")
		.attr("d", geoPath)
		.style("fill", country_color)
		.style("stroke", border_color)
		.style("stroke-width", "0.4");

	// Main circles
	svg.selectAll("circle.main_circles")
		.data(dataset)
		.enter().append("circle")
		.attr("class", "main_circles")
		.attr("cx", d => projection(d.coord)[0])
		.attr("cy", d => projection(d.coord)[1])
		.attr("r", d => areaScale(d.victims))
		.style("stroke", d => colorScale(d.victims))
		.style("fill", d => colorScale(d.victims))
		.attr("stroke-width", 0.4)
		.style("stroke-opacity", d => opacityScale(d.victims) + 0.1)
		.style("fill-opacity", d => opacityScale(d.victims) + 0.2);

	// Contour circles
	svg.selectAll("circle.contour_circles")
		.data(dataset)
		.enter().append("circle")
		.attr("class", "contour_circles")
		.attr("cx", d => projection(d.coord)[0])
		.attr("cy", d => projection(d.coord)[1])
		.attr("r", d => areaScale(d.victims) + circleScale(5))
		.style("stroke", white_col)
		.style("fill", white_col)
		.style("stroke-opacity", 0.085)
		.attr("stroke-width", 0.2)
		.style("fill-opacity", 0);

	// -------------------------------------- dots tooltip

	var tooltip = div_main.append("div")
		.attr("class", "tooltip")
		.style("opacity", 0)
		.style("pointer-events", "none")
		.style("position", "absolute")
		.style("text-align", "center")
		.style("width", "100px")
		.style("height", "50px")
		.style("font", "9px Tahoma")
		.style("color", tooltip_col)
		.style("background-color", "rgba(1, 12, 22, 0.5)")
		.style("border-radius", "9px")
		.style("padding", "4px")
		.style("line-height", "1")
		.style("display", "inline");

	// move
	var mousemove = function (event, d) {

		tooltip
			.transition()
			.duration(200)
			.style("opacity", 0.9);

		tooltip
			.html("<b>" + d.victims + " </b> Dead or Wounded <br/><span>-----------------------------</span></br> " + d.attack_type + "</br>" + formatTime(d.date))
			.style("left", (event.pageX - 0) + "px")
			.style("top", (event.pageY - 60) + "px");

		d3.select("div.tooltip b")
			.style("font-size", "10px")
			.style("color", white_col)

		d3.select("div.tooltip span")
			.style("font-size", "5px")
			.style("font-family", "Arial")
			.style("color", "grey");

		console.log(d3.select(this).attr('cx'), d3.select(this).attr('cy'));
		console.log(d3.select(this).style('stroke-opacity'));

	}

	// leave
	var mouseleave = function (d) {

		tooltip
			.transition()
			.duration(2000)
			.style("opacity", 0);

	}

	// call the tooltip
	d3.selectAll("circle.contour_circles")
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave);

	// -------------------------------------- country tooltip

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

	// Leave
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

	// Menu
	var controller = svg.append("g")
		.classed("controller", true)
		.attr("transform", "translate(1020,390)");

	// Speed button
	var legendTitle = controller.append("g")
		.attr("transform", "translate(17,-70)");

	// Speed text
	legendTitle.append("text")
		.attr("x", 0)
		.attr("y", -80)
		.html("Controls & Legend")
		.style("fill", white_col)
		.style("font-size", "10px")
		.style("opacity", 0.6)
		.attr("transform", "translate(-20,3)");


	// Add size-legend
	var sizeLegend = controller.append("g")
		.attr("class", "sizelegend")
		.attr("transform", `translate(${[0, 300]})`);


	// Draw legend
	sizeLegend.selectAll("g.sizeItem")
		.data([1, 10, 50, 100, 200, 500, 1000])
		.join("g")
		.attr("class", "sizeItem")
		.each(function (d, i) {
			d3.select(this)
				.append("circle")
				.attr("cx", (i * 11) + 1)
				.attr("cy", 0)
				.attr("r", d => areaScale(d))
				.style("fill", d => colorScale(d))
				.style("fill-opacity", d => opacityScale(d))
				.style("stroke", d => colorScale(d))
				.style("stroke-opacity", 1)
				.style("stroke-width", "0.4px");
		});

	sizeLegend
		.append("text")
		.attr("x", 0)
		.attr("y", 20)
		.text("0-1")
		.style("font-size", "6.5px")
		.style("font-family", "Arial")
		.style("fill", main_col)
		.style("alignment-baseline", "middle");

	sizeLegend
		.append("text")
		.attr("x", 28)
		.attr("y", 20)
		.text("100")
		.style("font-size", "6.5px")
		.style("font-family", "Arial")
		.style("fill", main_col)
		.style("alignment-baseline", "middle");

	sizeLegend
		.append("text")
		.attr("x", 58)
		.attr("y", 20)
		.text("1000")
		.style("font-size", "7px")
		.style("font-family", "Arial")
		.style("fill", main_col)
		.style("alignment-baseline", "middle");

	sizeLegend
		.append("text")
		.attr("x", 102)
		.attr("y", 20)
		.text("Hot Area")
		.style("font-size", "7px")
		.style("font-family", "Arial")
		.style("fill", main_col)
		.style("alignment-baseline", "middle");


	sizeLegend.append("circle")
		.attr("cx", 115)
		.attr("cy", 0)
		.attr("r", areaScale(700))
		.style("fill", "grey")
		.style("fill-opacity", 0)
		.style("stroke", "darkgrey")
		.style("stroke-opacity", 1)
		.style("stroke-width", "0.6px");


	sizeLegend.append("text")
		.attr("x", 0)
		.attr("y", -42)
		.style("font-size", "12px")
		.style("font-family", "Arial")
		.style("font-weight", "bold")
		.style("fill", main_col)
		.style("alignment-baseline", "middle")
		.text("Area of circle represents the total");

	sizeLegend.append("text")
		.attr("x", 0)
		.attr("y", -30)
		.style("font-size", "9px")
		.style("font-family", "Arial")
		.style("fill", main_col)
		.style("alignment-baseline", "middle")
		.text("number of dead/wounded per incident");


	// Call the tooltip
	d3.selectAll("path.country")
		.on("mousemove", country_mousemove)
		.on("mouseout", country_mouseleave);
			
}