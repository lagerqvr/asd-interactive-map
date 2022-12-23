const geoFile = "https://raw.githubusercontent.com/sandravizz/Analytical-System-Design-D3.js/main/Datasets/world_countries_geojson.geojson";
const dataFile = "https://raw.githubusercontent.com/lagerqvr/asd-interactive-map/main/globalterrorismdb_0522dist%20-%202015-2020.csv";

// -------------------------------------- Color variables

var country_color = "#2C3E50";
var main_col = "green";
var white_col = "#ffffff";
var light_col = "#64DD17";
var moderate_col = "#64DD17";
var dark_col = "#af0259";
var border_color = "#2C3E50";
var back_color = "white";
var country_over_col = "#BDC3C7";
var tooltip_col = "white";
var blue_col = "#4242ff";
var button_over_col = "green";
var back_col = "white";

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

	'#e6194B', '#3cb44b', '#ffe119',
	'#4363d8', '#f58231', '#42d4f4',
	'#f032e6', '#fabed4', '#469990',
	'#dcbeff', '#9A6324', 'darkred'
];

// -------------------------------------- Main settings

const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) * 0.9
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * 0.9

// Margin
var margin = { top: 65, right: 50, bottom: 20, left: 50 },
	width = vw - margin.left - margin.right, // 2000
	height = vh + 200 - margin.top - margin.bottom; // 1040 / + 350

// Background
d3.select("body")
	.style("background", back_color)
	.attr("height", height);

// Time variables
var in_delay = 16;
var tot_delay = 5505 * in_delay;
var main_dots_time = 3000;
var contour_dots_time1 = 600;
var contour_dots_time2 = 1000;
var contour_dots_delay = 3;

// -------------------------------------- Div for svg

var div_main = d3.select("body")
	.append("div")
	.attr("id", "div_main")
	// .style("border", "10px solid white")
	.style("margin", "30px auto");

// -------------------------------------- SVG board

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
	.attr('width', 480) // 480
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

const btn = document.querySelector('#btn');
const radioButtons = document.querySelectorAll('input[name="year_val"]');
btn.addEventListener("click", () => {
	let selectedYear = "";
	for (const radioButton of radioButtons) {
		if (radioButton.checked) {
			selectedYear = radioButton.value;
			break;
		}
	}
	// Show the output:
	output.innerText = selectedYear ? `You selected ${selectedYear}` : `You haven't selected any year`;

	// Store global objects here
	var map = {};
	var dataset = {};
	Promise.all([

		d3.json(geoFile),
		d3.csv(dataFile, function (attack) {
			if (!isNaN(attack.latitude) && attack.iyear == selectedYear) {

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
			draw(map, dataset);

		});

});
const projection = d3.geoNaturalEarth1()
	.scale(170)
	.translate([(width / 2) - 140, (height / 2) - 140]); // + 10

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
	.range([0.1, 0.9]); // When using colors the scale has to start at 0.4

// Projection Color Scale
var projColorScale = d3.scaleLinear()
	.domain([0, 300])
	.range(["gray", white_col]);

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

function draw(map, dataset) {
	d3.select("svg").remove();

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

	// -------------------------------------- Dots tooltip

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

	// Move
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

	}

	// Leave
	var mouseleave = function (d) {

		tooltip
			.transition()
			.duration(2000)
			.style("opacity", 0);

	}

	// Call the tooltip
	d3.selectAll("circle.contour_circles")
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave);

	// -------------------------------------- Country tooltip

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

	// Move
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
			.style("stroke", "green");

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
		.attr("transform", "translate(1000,200)"); // 1820, 350

	// Speed button
	var legendTitle = controller.append("g")
		.attr("transform", "translate(17,-70)");

	// Speed text
	legendTitle.append("text")
		.attr("x", 0)
		.attr("y", -80)
		.html("Controls & Legend")
		.style("fill", main_col)
		.style("font-size", "10px")
		.style("font-weight", "700")
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


	// Draw legend
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

			d3.select(this)
				.append("text")
				.attr("y", i * 15)
				.attr("x", 5)
				.text(d)
				.style("font-size", "8px")
				.style("fill", main_col)
				.style("alignment-baseline", "middle")
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

	// -------------------------------------- Timeline

	// Draw the Axies
	svg.append("g").classed("axe", true)
		.attr("transform", "translate(0, 705)") // Move the axis to the bottom / 0, 910
		.call(timeAxis);

	// Axis formatting

	// Format the domain
	d3.selectAll("g.axe .domain, g.axe g.tick line")
		.style("stroke", main_col)
		.style("opacity", 0.2);

	// Make centered ticks
	d3.selectAll("g.axe g.tick line")
		.attr("y1", -3)
		.attr("y2", 4)
		.style("opacity", 0.8)
		.style("stroke", main_col);

	// Adjust font size and opacity
	d3.selectAll("g.axe g.tick text")
		.style("font-size", "8px")
		.style("color", main_col)
		.style("opacity", 1);

	// -------------------------------------- Circles on timeline

	// Draw the circles on timeline
	svg.selectAll("circle.time_circles")
		.data(dataset)
		.enter().append("circle")
		.classed("time_circles", true)
		.attr("cx", d => timeScale(d.date))
		.attr("cy", d => 665 + ((d.random) * 80)) // 870
		.attr("r", d => areaScale(d.victims))
		.attr("stroke-width", 0.4)
		.style("stroke-opacity", d => opacityScale(d.victims) + 0.1)
		.style("fill-opacity", d => opacityScale(d.victims))
		.style("fill", d => colorScale(d.victims))
		.style("stroke", d => colorScale(d.victims));

	// -------------------------------------- Projections on timeline

	// Draw the projections on timeline

	var proj_stroke = "0.00px";

	svg.selectAll("line.time_lines")
		.data(dataset)
		.enter().append("line")
		.classed("time_lines", true)
		.attr("x1", d => timeScale(d.date))
		.attr("y1", d => 870 + ((d.random) * 80))
		.attr("x2", function (d) { return projection(d.coord)[0]; })
		.attr("y2", function (d) { return projection(d.coord)[1]; })
		.style("stroke", d => projColorScale(d.victims))
		.style("stroke-opacity", d => projOpacScale(d.victims))
		.style("stroke-width", proj_stroke)

	// -------------------------------------- Play function

	// Play function

	var play = function (d) {

		// Hide button while playing
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

		// Play projection lines
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

		// Play main circles
		d3.selectAll("circle.main_circles")
			.attr("r", 0)
			.each(function (d, i) {
				d3.select(this)
					.transition()
					.duration(main_dots_time)
					.delay(i * in_delay)
					.attr("r", d => areaScale(d.victims))

			});

		// Play countour circles
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

		// Play time circles
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

	// Over function
	var over = function (d) {
		d3.select(this)
			.style("fill", main_col)
	};

	// Move function
	var move = function (d) {
		d3.select(this)
			.style("fill", main_col)
	};

	// Leave function	
	var leave = function (d) {
		d3.select(this)
			.style("fill", white_col)
	};

	// -------------------------------- Speed Buttons Functions

	// 1x
	// Down functions
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

		in_delay = 16;
		tot_delay = 5505 * in_delay;

		p1 = p1_1;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)
	};

	// 2x
	// Down functions
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

		in_delay = 8;
		tot_delay = 5505 * in_delay;

		p1 = p1_2;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)
	};

	// 4x
	// Down functions
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

		in_delay = 4;
		tot_delay = 5505 * in_delay;

		p1 = p1_3;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)
	};

	// -------------------------------- on/off Projection Functions

	// On Projection
	// Down functions
	var onProj = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "0.05px")
			.style("stroke-opacity", 0.8);

		d3.select("circle.off_proj")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "0.05px")
			.style("stroke-opacity", 0.15);


		p2 = p2_1;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)

		proj_stroke = "0.1px";
		d3.selectAll("line.time_lines")
			.style("stroke-width", proj_stroke)

	};

	// Off Projection
	// Down functions
	var offProj = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.select("circle.on_proj")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);

		proj_stroke = "0px";

		d3.selectAll("line.time_lines")
			.style("stroke-width", proj_stroke)
			.style("stroke-opacity", d => projOpacScale(d.victims));

		p2 = p2_2;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1)

	};

	// -------------------------------- on/off Categories Buttons Functions

	// On
	// Down functions
	var onDown = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.select("circle.off_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "0.05px")
			.style("stroke-opacity", 0.15);

		regionLegend
			.transition()
			.duration(1000)
			.delay(600)
			.style("opacity", 1)

		catButton
			.transition()
			.duration(1000)
			.style("opacity", 1)

		d3.select(".region_button")
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.select(".cause_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col);

		d3.selectAll("circle.main_circles")
			.style("stroke", d => regionScale(d.regions))
			.style("fill", d => regionScale(d.regions));

		d3.selectAll("circle.time_circles")
			.style("stroke", d => regionScale(d.regions))
			.style("fill", d => regionScale(d.regions));

		p3 = p3_1;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1);

		p4 = p4_1;

		array2 = p3 + p4 + p5 + p6;

		joinLines2
			.transition()
			.duration(500)
			.delay(500)
			.attr("points", array2)
			.style("opacity", 1);

		d3.selectAll("line.time_lines")
			.style("stroke", d => regionScale(d.regions))

		regionLegend.raise();

	};

	// Off
	// Down functions
	var offDown = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.select("circle.on_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);

		d3.selectAll(".join_line")
			.transition()
			.duration(500)
			.style("opacity", 0);

		catButton
			.transition()
			.duration(1000)
			.style("opacity", 0);

		d3.select(".region_button")
			.transition()
			.duration(1000)
			.style("fill", back_col);

		regionLegend
			.transition()
			.duration(1000)
			.style("opacity", 0);

		d3.selectAll("circle.main_circles")
			.style("stroke", d => colorScale(d.victims))
			.style("fill", d => colorScale(d.victims));


		d3.selectAll("circle.time_circles")
			.style("stroke", d => colorScale(d.victims))
			.style("fill", d => colorScale(d.victims));

		p3 = p3_2;

		array1 = p1 + p2 + p3;

		joinLines1
			.transition()
			.duration(500)
			.attr("points", array1);

		joinLines2
			.transition()
			.duration(200)
			.style("opacity", 0)

		d3.selectAll("line.time_lines")
			.style("stroke", d => projColorScale(d.victims))

	};

	// -------------------------------- Region / Cause Buttons Functions

	// Region
	// Down functions
	var regionDown = function (d) {
		d3.select(this)
			.transition()
			.duration(1000)
			.style("fill", button_over_col)
			.style("stroke", white_col)
			.style("stroke-width", "2px")
			.style("stroke-opacity", 0.8);

		d3.select(".cause_button")
			.transition()
			.duration(1000)
			.style("fill", back_col)
			.style("stroke", moderate_col)
			.style("stroke-width", "1px")
			.style("stroke-opacity", 1);

		regionLegend
			.transition()
			.duration(1000)
			.delay(500)
			.style("opacity", 1)

		d3.selectAll("circle.main_circles")
			.style("stroke", d => regionScale(d.regions))
			.style("fill", d => regionScale(d.regions));

		d3.selectAll("circle.time_circles")
			.style("stroke", d => regionScale(d.regions))
			.style("fill", d => regionScale(d.regions));

		p4 = p4_1;

		array2 = p3 + p4 + p5 + p6;

		joinLines2
			.transition()
			.duration(500)
			.attr("points", array2);

		d3.selectAll("line.time_lines")
			.style("stroke", d => regionScale(d.regions))
		regionLegend.raise();

	};

	// -------------------------------- on/off Categories Buttons Functions

	// Add G element button
	var startButton = svg.append("g")
		.classed("start", true)
		.attr("transform", "translate(-4, 700)"); // -4, 904.5

	// Start circle
	startButton.append("circle")
		.classed("start_circle", true)
		.attr("cx", 4.5)
		.attr("cy", 6)
		.attr("r", 10)
		.style("stroke", blue_col)
		.attr("stroke-width", 0.7)
		.style("fill", white_col)
		.style("fill-opacity", 0);

	// Start button
	startButton.append("polygon")
		.classed("start_polygon", true)
		.attr("points", "0,0 12,6 0,12")
		.attr("stroke-width", 0.7)
		.style("fill", "black")
		.style("opacity", 1)
		.attr("transform", "translate(0,0)")
		.on("mousedown", play)
		.on("mouseover", over)
		.on("mouseleave", leave)
		.on("mousemove", move);

	// Start text
	startButton.append("text")
		.classed("start_text", true)
		.attr("x", -4)
		.attr("y", -7)
		.text("Timelapse ")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(0,-40)");

	// -------------------------------------- End circle

	// End circle
	svg.append("circle")
		.classed("end_circle", true)
		.attr("cx", timeScale(parseTime("26-Jun-2019")))
		.attr("cy", 610)
		.attr("r", 2)
		.style("stroke", blue_col)
		.style("fill", white_col);

	// -------------------------------------- Speed button

	// Speed button
	var speedButton = controller.append("g")
		.classed("speed_button", true)
		.attr("transform", "translate(17,-70)");

	// Speed text
	speedButton.append("text")
		.classed("start_text", true)
		.attr("x", 0)
		.attr("y", 0)
		.text("Timelapse :")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-20,3)");

	speedButton.append("text")
		.classed("start_text", true)
		.attr("x", 62)
		.attr("y", 0)
		.text("1X")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-20,3)");


	speedButton.append("text")
		.classed("start_text", true)
		.attr("x", 92)
		.attr("y", 0)
		.text("2X")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-20,3)");

	speedButton.append("text")
		.classed("start_text", true)
		.attr("x", 122)
		.attr("y", 0)
		.text("4X")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-20,3)");

	// Speed circles
	// Low
	speedButton.append("circle")
		.classed("low_button", true)
		.attr("cx", 34.5)
		.attr("cy", 0)
		.attr("r", 5)
		.style("stroke", white_col)
		.style("stroke-width", "2px")
		.style("fill", button_over_col)
		.style("fill-opacity", 1)
		.style("stroke-opacity", 0.8)
		.on("mousedown", speedDownLow);
	// Medium
	speedButton.append("circle")
		.classed("medium_button", true)
		.attr("cx", 64)
		.attr("cy", 0)
		.attr("r", 5)
		.style("fill", back_col)
		.style("fill-opacity", 1)
		.style("stroke", moderate_col)
		.attr("stroke-width", 0.7)
		.style("stroke-opacity", 1)
		.on("mousedown", speedDownMedium);

	// High
	speedButton.append("circle")
		.classed("high_button", true)
		.attr("cx", 94)
		.attr("cy", 0)
		.attr("r", 5)
		.style("stroke", moderate_col)
		.attr("stroke-width", 0.7)
		.style("fill", back_col)
		.style("fill-opacity", 1)
		.on("mousedown", speedDownHigh);

	// -------------------------------------- projections ON / OFF Button
	// Projection button
	var projectionButton = controller.append("g")
		.classed("proj_button", true)
		.attr("transform", "translate(0,-30)");

	// Title
	projectionButton.append("text")
		.classed("proj_text", true)
		.attr("x", 0)
		.attr("y", -8)
		.text("Projections :")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	projectionButton.append("text")
		.classed("proj_text", true)
		.attr("x", 118)
		.attr("y", -8)
		.text("OFF")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	projectionButton.append("text")
		.classed("proj_text", true)
		.attr("x", 75)
		.attr("y", -8)
		.text("ON")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	// Switch circles
	// ON
	projectionButton.append("circle")
		.classed("on_proj", true)
		.attr("cx", 61)
		.attr("cy", -11)
		.attr("r", 6)
		.style("stroke", white_col)
		.style("stroke-width", "0.0005px")
		.style("stroke-opacity", 0.8)
		.style("fill", back_col)
		.style("fill-opacity", 1)
		.on("mousedown", onProj);

	// OFF
	projectionButton.append("circle")
		.classed("off_proj", true)
		.attr("cx", 105)
		.attr("cy", -11)
		.attr("r", 6)
		.style("fill", button_over_col)
		.style("fill-opacity", 1)
		.style("stroke", moderate_col)
		.style("stroke-width", 1)
		.style("stroke-opacity", 0.8)
		.on("mousedown", offProj);

	// -------------------------------------- Switch ON / OFF Button
	// Switch button
	var switchButton = controller.append("g")
		.classed("cat_button", true)
		.attr("transform", "translate(0,0)");

	// Title
	switchButton.append("text")
		.classed("cat_text", true)
		.attr("x", 0)
		.attr("y", -8)
		.html("Categories :")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	switchButton.append("text")
		.classed("cat_text", true)
		.attr("x", 74)
		.attr("y", -8)
		.html("ON")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	switchButton.append("text")
		.classed("cat_text", true)
		.attr("x", 116)
		.attr("y", -8)
		.html("OFF")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	// Switch circles
	// ON
	switchButton.append("circle")
		.classed("on_button", true)
		.attr("cx", 59)
		.attr("cy", -11)
		.attr("r", 7)
		.style("stroke", moderate_col)
		.attr("stroke-width", "1px")
		.attr("stroke-opacity", 1)
		.style("fill", back_col)
		.style("fill-opacity", 1)
		.on("mousedown", onDown);

	// OFF
	switchButton.append("circle")
		.classed("off_button", true)
		.attr("cx", 102)
		.attr("cy", -11)
		.attr("r", 7)
		.style("fill", button_over_col)
		.style("fill-opacity", 1)
		.style("stroke", white_col)
		.style("stroke-width", 2)
		.style("stroke-opacity", 0.8)
		.on("mousedown", offDown);

	// -------------------------------------- by Region / Cause switch button
	// Categories button
	var catButton = controller.append("g")
		.classed("switch_button", true)
		.attr("transform", "translate(0,30)");

	// Cause text
	catButton.append("text")
		.classed("region_cause_text", true)
		.attr("x", 51)
		.attr("y", -8)
		.text("Region")
		.style("fill", main_col)
		.style("font-size", "8px")
		.attr("transform", "translate(-2,0)");

	// Region circle
	catButton.append("circle")
		.classed("region_button", true)
		.attr("cx", 38)
		.attr("cy", -11)
		.attr("r", 6)
		.style("stroke", white_col)
		.style("stroke-width", "2px")
		.style("stroke-opacity", 0.8)
		.style("fill", back_col)
		.style("fill-opacity", 1)
		.on("mousedown", regionDown);
	// -------------------------------------- Join lines

	// Join lines array
	var p1_1 = "51.5,-70 ";
	var p1_2 = "81,-70 ";
	var p1_3 = "111,-70 ";
	var p2_1 = "62,-41 ";
	var p2_2 = "105,-41 ";
	var p3_1 = "59,-11 ";
	var p3_2 = "102,-11 ";
	var p4_1 = "39,19 ";
	var p4_2 = "94,19 ";
	var p5 = "10,55 ";
	var p6 = "10,190";

	var p1 = p1_1;
	var p2 = p2_2;
	var p3 = p3_2;
	var p4 = p4_1;

	var array1 = p1 + p2 + p3;
	var array2 = p3_2 + p4 + p5 + p6;

	// Polyline1
	var joinLines1 = controller
		.append("polyline")
		.classed("join_line", true)
		.attr("points", array1)
		.style("fill", "none")
		.style("stroke", white_col)
		.style("stroke-width", 0.5)
		.lower()
		.attr("transform", "translate(0,0)");

	// Polyline1
	var joinLines2 = controller
		.append("polyline")
		.classed("join_line", true)
		.attr("points", array2)
		.style("fill", "none")
		.style("stroke", white_col)
		.style("stroke-width", 0.5)
		.lower()
		.attr("transform", "translate(0,0)");

	catButton
		.style("opacity", 0);
	regionLegend
		.style("opacity", 0);
	joinLines2
		.style("opacity", 0);

	// Filters for the regions

	// ---------- Filter 1

	var checked_1 = 1;

	var regionFilter1 = function (d) {
		if (checked_1 == 1) {

			checked_1 = 0
			d3.select("circle.region_circle0")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[0])
				.style("visibility", "hidden");

		}

		else {
			checked_1 = 1;
			d3.select("circle.region_circle0")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[0])
				.style("visibility", "visible");

		}

	}; // --------- End of filter 1

	// ---------- Filter 2

	var checked_2 = 1;

	var regionFilter2 = function (d) {
		if (checked_2 == 1) {

			checked_2 = 0
			d3.select("circle.region_circle1")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[1])
				.style("visibility", "hidden");
		}

		else {
			checked_2 = 1;
			d3.select("circle.region_circle1")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[1])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 2

	// ---------- Filter 3

	var checked_3 = 1;

	var regionFilter3 = function (d) {
		if (checked_3 == 1) {

			checked_3 = 0
			d3.select("circle.region_circle2")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[2])
				.style("visibility", "hidden");
		}

		else {
			checked_3 = 1;
			d3.select("circle.region_circle2")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[2])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 3

	// ---------- Filter 4

	var checked_4 = 1;

	var regionFilter4 = function (d) {
		if (checked_4 == 1) {

			checked_4 = 0
			d3.select("circle.region_circle3")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[3])
				.style("visibility", "hidden");
		}

		else {
			checked_4 = 1;
			d3.select("circle.region_circle3")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[3])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 4

	// ---------- Filter 5

	var checked_5 = 1;

	var regionFilter5 = function (d) {
		if (checked_5 == 1) {

			checked_5 = 0
			d3.select("circle.region_circle4")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[4])
				.style("visibility", "hidden");
		}

		else {
			checked_5 = 1;
			d3.select("circle.region_circle4")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[4])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 5

	// ---------- Filter 6

	var checked_6 = 1;

	var regionFilter6 = function (d) {
		if (checked_6 == 1) {

			checked_6 = 0
			d3.select("circle.region_circle5")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[5])
				.style("visibility", "hidden");
		}

		else {
			checked_6 = 1;
			d3.select("circle.region_circle5")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[5])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 6

	// ---------- Filter 7

	var checked_7 = 1;

	var regionFilter7 = function (d) {
		if (checked_7 == 1) {

			checked_7 = 0
			d3.select("circle.region_circle6")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[6])
				.style("visibility", "hidden");
		}

		else {
			checked_7 = 1;
			d3.select("circle.region_circle6")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[6])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 7

	// ---------- Filter 8

	var checked_8 = 1;

	var regionFilter8 = function (d) {
		if (checked_8 == 1) {

			checked_8 = 0
			d3.select("circle.region_circle7")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[7])
				.style("visibility", "hidden");
		}

		else {
			checked_8 = 1;
			d3.select("circle.region_circle7")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[7])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 8

	// ---------- Filter 9

	var checked_9 = 1;

	var regionFilter9 = function (d) {
		if (checked_9 == 1) {

			checked_9 = 0
			d3.select("circle.region_circle8")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[8])
				.style("visibility", "hidden");
		}

		else {
			checked_9 = 1;
			d3.select("circle.region_circle8")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[8])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 9

	// ---------- Filter 10

	var checked_10 = 1;

	var regionFilter10 = function (d) {
		if (checked_10 == 1) {

			checked_10 = 0
			d3.select("circle.region_circle9")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[9])
				.style("visibility", "hidden");
		}

		else {
			checked_10 = 1;
			d3.select("circle.region_circle9")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[9])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 10

	// ---------- Filter 11

	var checked_11 = 1;

	var regionFilter11 = function (d) {
		if (checked_11 == 1) {

			checked_11 = 0
			d3.select("circle.region_circle10")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[10])
				.style("visibility", "hidden");
		}

		else {
			checked_11 = 1;
			d3.select("circle.region_circle10")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[10])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 11

	// ---------- Filter 10

	var checked_12 = 1;

	var regionFilter12 = function (d) {
		if (checked_12 == 1) {

			checked_12 = 0
			d3.select("circle.region_circle11")
				.transition()
				.duration(200)
				.attr("r", 5)
				.style("fill", back_col);

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[11])
				.style("visibility", "hidden");
		}

		else {
			checked_12 = 1;
			d3.select("circle.region_circle11")
				.transition()
				.duration(200)
				.attr("r", 6)
				.style("fill", d => regionScale(d))

			d3.selectAll("circle.main_circles, circle.contour_circles, circle.time_circles, line.time_lines")
				.filter(d => d.regions == regions_name[11])
				.style("visibility", "visible");
		}

	}; // --------- End of filter 10

	// Assign filter functions to region circles

	d3.select("circle.region_circle0")
		.on("mousedown", regionFilter1);
	d3.select("circle.region_circle1")
		.on("mousedown", regionFilter2);
	d3.select("circle.region_circle2")
		.on("mousedown", regionFilter3);
	d3.select("circle.region_circle3")
		.on("mousedown", regionFilter4);
	d3.select("circle.region_circle4")
		.on("mousedown", regionFilter5);
	d3.select("circle.region_circle5")
		.on("mousedown", regionFilter6);
	d3.select("circle.region_circle6")
		.on("mousedown", regionFilter7);
	d3.select("circle.region_circle7")
		.on("mousedown", regionFilter8);
	d3.select("circle.region_circle8")
		.on("mousedown", regionFilter9);
	d3.select("circle.region_circle9")
		.on("mousedown", regionFilter10);
	d3.select("circle.region_circle10")
		.on("mousedown", regionFilter11);
	d3.select("circle.region_circle11")
		.on("mousedown", regionFilter12);
}