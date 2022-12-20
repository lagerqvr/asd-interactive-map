const geoFile = "https://raw.githubusercontent.com/sandravizz/Analytical-System-Design-D3.js/main/Datasets/world_countries_geojson.geojson";
const dataFile = "https://raw.githubusercontent.com/lagerqvr/asd-interactive-map/main/globalterrorismdb_0522dist%20-%202015-2020.csv";

// -------------------------------------- color variables

var country_color = "#2C3E50";
var main_col = "#64DD17";
var title_col = "#64DD17";
var subtitle_col = "#ffffff";
var white_col = "#ffffff";
var light_col = "#64DD17";
var moderate_col = "#64DD17";
var dark_col = "#af0259";
var border_color = "#2C3E50";
var back_color = "white";
var black_col = "#ECF0F1";
var country_over_col = "#BDC3C7";
var tooltip_col = "white";
var blue_col = "#4242ff";
var button_over_col = "#010c16";

var regions_name = [
	'Middle East & North Africa',
	'Western Europe',
	'South Asia',
	'Central America & Caribbean',
	'Southeast Asia',
	'Sub-Saharan Africa',
	'Eastern Europe',
	'North America',
	'Australasia & Oceania',
	'South America',
	'Central Asia',
	'East Asia'
];

var regions_cols = [
	/*
	"violet", //violet 1
	"blue", //blue 2
	"pink", //pink 3
	"yellow", //yellow 4
	"darkgreen", //darkgreen 5
	"orange", //orange 6  
	"green", //green 7
	"lightblue", //lightblue 8
	"grey", //grey 9
	"brown", //brown 10
	"red", // 11
	"black" // 12
	*/
	'#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#42d4f4', '#f032e6', '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8'
];

// -------------------------------------- Main settings

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
//console.log(vw, vh)

// Margin
var margin = { top: 65, right: 50, bottom: 20, left: 50 },
	width = vw - margin.left - margin.right,
	height = vh - margin.top - margin.bottom;

// Background
d3.select("body")
	.style("background", back_color)
	/* .style("font-family", "Arial, Geneva, sans-serif") */
	.attr("height", height);

// Time variables
var in_delay = 1;
var tot_delay = 5505 * in_delay;
var main_dots_time = 3000;
var contour_dots_time1 = 600;
var contour_dots_time2 = 1000;
var contour_dots_delay = 3;

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
		if (!isNaN(attack.latitude)) {

			return {
				regions: attack.region_txt,
				serial: +attack.eventid,
				country: attack.country_txt,
				attack_type: attack.attacktype1_txt,
				collap_cause: attack.collapsed_cause,
				coord: [+attack.longitude, +attack.latitude],
				victims: checkValue(attack.nkill + attack.nwound),
				date: parseTime(attack.imonth.toString() + "/" + attack.iday.toString() + "/" + attack.iyear.toString()),
				random: Math.random()
			}
		}

	})

])
	.then(function ([shapes, data]) {
		map.features = shapes.features;
		dataset = data;
		//console.log(dataset)
		draw();

	});
const projection = d3.geoNaturalEarth1()
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

// Projections Opacity Scale
var projOpacScale = d3.scaleLinear()
	.domain([0, 1000])
	.range([0.1, 0.9]); // when using colors the scale has to start at 0.4

// Projection Color Scale
var projColorScale = d3.scaleLinear()
	.domain([0, 300])
	.range(["grey", white_col]);

// Regions color scale	
var regionScale = d3.scaleOrdinal()
	.domain(regions_name)
	.range(regions_cols);

// Parse date
var parseTime = d3.timeParse("%m/%d/%Y");

// Formate date
var formatTime = d3.timeFormat("%e %b %y");

const checkValue = (val) => {
	if (!val == undefined || !val == null || !val == '0') {
		return val;
	} else {
		return '0';
	}
}

function draw() {
	// Axis scale
	var timeScale = d3.scaleTime()
		.domain([dataset[0].date, dataset[dataset.length - 1].date])
		.range([0, width - 150]);

	// Define axis
	var timeAxis = d3.axisBottom(timeScale)
		.ticks(7)
		.tickSizeInner(10)
		.tickSizeOuter(0)
		.tickPadding(35);

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

		//console.log(d3.select(this).attr('cx'), d3.select(this).attr('cy'));
		//console.log(d3.select(this).style('stroke-opacity'));

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
		.attr("transform", "translate(1820,350)");

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

	var regionLegend = controller.append("g")
		.attr("class", "region_legend")
		.attr("transform", "translate(10,55)");


	// draw legend
	regionLegend.selectAll("g.regions")
		.data(regions_name)
		.join("g")
		.attr("class", "regions")
		.each(function (d, i) {
			d3.select(this)
				.append("circle")
				.classed("region_circle" + i, true)
				.attr("cy", i * 15)
				.attr("cx", 0)
				.attr("r", 6)
				.style("fill", d => regionScale(d))
				.style("fill-opacity", 1)
				.style("stroke", white_col)
				.style("stroke-opacity", 0.8)
				.style("stroke-width", 1.5);
			//	.on("mouseover", overGeneral2)
			//	.on("mouseleave", leaveGeneral2);
			//.style("stroke-dasharray", "1 1");

			d3.select(this)
				.append("text")
				.attr("y", i * 15)
				.attr("x", 5)
				.text(d)
				.style("font-size", "8px")
				.style("fill", main_col)
				.style("alignment-baseline", "middle")
				//.style("text-align", "left")
				//.style("direction", "rtl")
				.attr("transform", `translate(11, 1)`);
		});

	// Call the tooltip
	d3.selectAll("path.country")
		.on("mousemove", country_mousemove)
		.on("mouseout", country_mouseleave);

	// (Arcada) Logo
	var myimage = controller
		.append("a")
		.attr("href", "https://github.com/lagerqvr/asd-interactive-map")
		.append('image')
		.attr('xlink:href', "https://upload.wikimedia.org/wikipedia/fi/8/8e/Arcada_logo.png")
		.attr('width', 200)
		.attr('height', 100)
		.style("opacity", 1)
		.attr("transform", "translate(-10,320)");

	// Cover the lower area with rect
	var rect = svg.append("rect")
		.attr("x", 0)
		.attr("y", 850)
		.attr("width", width - 200)
		.attr("height", 200)
		.style("fill", back_color)
		.style("opacity", 0.0);

	// -------------------------------------- timeline

	// Draw the Axies
	svg.append("g").classed("axe", true)
		.attr("transform", "translate(0 , 910)")
		.call(timeAxis);

	// axis formatting

	// format the domain
	d3.selectAll("g.axe .domain, g.axe g.tick line")
		.style("stroke", main_col)
		.style("opacity", 0.2);
	//.style("stroke-dasharray", "3 6");

	// make centered ticks
	d3.selectAll("g.axe g.tick line")
		.attr("y1", -3)
		.attr("y2", 4)
		.style("opacity", 0.8)
		.style("stroke", main_col);

	// adjust font size and opacity
	d3.selectAll("g.axe g.tick text")
		.style("font-size", "8px")
		.style("color", main_col)
		.style("opacity", 1);

	// -------------------------------------- circles on timeline

	// Draw the circles on timeline
	svg.selectAll("circle.time_circles")
		.data(dataset)  //.filter(d => d.tens == "1910-1920")
		.enter().append("circle")
		.classed("time_circles", true)
		.attr("cx", d => timeScale(d.date))
		.attr("cy", d => 870 + ((d.random) * 80))
		.attr("r", d => areaScale(d.victims))
		//.style("stroke", white_col)
		.attr("stroke-width", 0.4)
		.style("stroke-opacity", d => opacityScale(d.victims) + 0.1)
		//.style("fill", white_col)
		.style("fill-opacity", d => opacityScale(d.victims))
		.style("fill", d => colorScale(d.victims))
		.style("stroke", d => colorScale(d.victims));


	// -------------------------------------- projections on timeline

	// Draw the projections on timeline

	var proj_stroke = "0.05px";

	svg.selectAll("line.time_lines")
		.data(dataset)  //.filter(d => d.tens == "1910-1920")
		.enter().append("line")
		.classed("time_lines", true)
		.attr("x1", d => timeScale(d.date))
		.attr("y1", d => 870 + ((d.random) * 80))
		.attr("x2", function (d) { return projection(d.coord)[0]; })
		.attr("y2", function (d) { return projection(d.coord)[1]; })
		.style("stroke", d => projColorScale(d.victims))
		.style("stroke-opacity", d => projOpacScale(d.victims))
		.style("stroke-width", proj_stroke)

	// -------------------------------------- play function

	// play function

	var play = function (d) {

		// hide button while playing
		d3.select(this)
			.transition()
			.duration(2000)
			.style("opacity", 0)
			.transition()
			.duration(2000)
			.delay(tot_delay + 1000)
			.style("opacity", 1);

		d3.select(".start_circle")
			.transition()
			.duration(2000)
			.attr("r", 2)
			.attr("stroke-width", 1)
			.style("fill-opacity", 1)
			.transition()
			.duration(2000)
			.delay(tot_delay + 1000)
			.attr("r", 10)
			.attr("stroke-width", 0.7)
			.style("fill-opacity", 0);

		// play projection lines
		d3.selectAll("line.time_lines")
			.style("stroke-width", "0px")
			.style("stroke-opacity", d => projOpacScale(d.victims))
			.each(function (d, i) {
				d3.select(this)
					.transition()
					.duration(3000)
					.delay(i * in_delay)
					.style("stroke-width", proj_stroke)

			});

		// play main circles
		d3.selectAll("circle.main_circles")
			.attr("r", 0)
			.each(function (d, i) {
				d3.select(this)
					.transition()
					.duration(main_dots_time)
					.delay(i * in_delay)
					.attr("r", d => areaScale(d.victims))

			});

		// play countour circles
		d3.selectAll("circle.contour_circles")
			.attr("r", 0)
			.each(function (d, i) {
				d3.select(this)
					.transition()
					.duration(contour_dots_time1)
					.delay(i * in_delay)
					.style("stroke", white_col)
					.attr("stroke-width", 0.8)
					.style("stroke-opacity", 0.9)
					.style("fill-opacity", 0.7)
					.attr("r", d => areaScale(d.victims) + circleScale(0))
					.transition()
					.duration(contour_dots_time2)
					.delay(contour_dots_delay)
					.attr("r", d => areaScale(d.victims) + circleScale(5))
					.style("stroke-opacity", 0.085)
					.attr("stroke-width", 0.2)
					.style("fill-opacity", 0)
			});

		// play time circles
		d3.selectAll("circle.time_circles")
			.attr("r", d => Math.random())
			.attr("cx", d => timeScale(d.date))
			.attr("cy", d => 870 + (d.random * 80))
			.attr("stroke-width", 1)
			.style("stroke-opacity", 0)
			.style("fill-opacity", 0)
			.each(function (d, i) {
				d3.select(this)
					.transition()
					.duration(3000)
					.delay(i * in_delay)
					.attr("cx", d => timeScale(d.date))
					.attr("cy", d => 870 + (d.random * 80))
					.attr("r", d => areaScale(d.victims))
					.attr("stroke-width", 0.4)
					.style("stroke-opacity", d => opacityScale(d.victims) + 0.1)
					.style("fill-opacity", d => opacityScale(d.victims));
			});

	};

	//play();

	// -------------------------------------- Play Button Functions

	// over function
	var over = function (d) {
		d3.select(this)
			//.style("stroke", white_col)
			.style("fill", main_col)
	};

	// move function
	var move = function (d) {
		d3.select(this)
			//.style("stroke", white_col)
			.style("fill", main_col)
	};

	// leave function	
	var leave = function (d) {
		d3.select(this)
			.style("fill", white_col)
		//.style("stroke", main_col)
	};

	// -------------------------------- Speed Buttons Functions

	// 1x
	// down functions
	var speedDownLow = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);


		d3.selectAll("circle.medium_button, circle.high_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);

		in_delay = 4;
		tot_delay = 5505 * in_delay;

		p1 = p1_1;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)
	};

	// 2x
	// down functions
	var speedDownMedium = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.selectAll("circle.low_button, circle.high_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);

		in_delay = 2;
		tot_delay = 5505 * in_delay;

		p1 = p1_2;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)
	};

	// 4x
	// down functions
	var speedDownHigh = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.selectAll("circle.low_button, circle.medium_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);

		in_delay = 1;
		tot_delay = 5505 * in_delay;

		p1 = p1_3;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)
	};

	// add g element button
	var startButton = svg.append("g")
		.classed("start", true)
		.attr("transform", "translate(-4,904.5)");

	// start circle
	startButton.append("circle")
		.classed("start_circle", true)
		.attr("cx", 4.5)
		.attr("cy", 6)
		.attr("r", 10)
		.style("stroke", blue_col)
		.attr("stroke-width", 0.7)
		.style("fill", white_col)
		.style("fill-opacity", 0);

	// start button
	startButton.append("polygon")
		.classed("start_polygon", true)
		.attr("points", "0,0 12,6 0,12")
		//.style("stroke", blue_col)
		.attr("stroke-width", 0.7)
		.style("fill", white_col)
		.style("opacity", 1)
		.attr("transform", "translate(0,0)")
		.on("mousedown", play)
		.on("mouseover", over)
		.on("mouseleave", leave)
		.on("mousemove", move);

	// start text
	startButton.append("text")
		.classed("start_text", true)
		.attr("x", -4)
		.attr("y", -7)
		.text("Timelapse ")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(0,-40)");

	d3.selectAll("circle.main_circles")
		.style("stroke", d => regionScale(d.regions))
		.style("fill", d => regionScale(d.regions));

	d3.selectAll("circle.time_circles")
		.style("stroke", d => regionScale(d.regions))
		.style("fill", d => regionScale(d.regions));
}