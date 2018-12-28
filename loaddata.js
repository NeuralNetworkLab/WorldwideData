function draw_input() {
	d3.csv("data/data_definition.csv").then(function(data) {
		data.forEach(function(d) { //save value to hash
			features.push(d['Indicator Name']); //push attribute's name into features(Array)
		});

		var select = d3.select('#features')
			.on('change', onchange)
		var options = select
			.selectAll('option')
			.data(features).enter()
			.append('option')
			.attr("value", function(d, i) {
				return i;
			})
			.text(function(d) {
				return d;
			});

		function onchange() {
			selectValue = d3.select('#features').property('value'); //get int type
			config.feature = selectValue;
			display_data();
		};
		//drawCheckbox_features(features)
	});
	d3.csv("data/countries_1990_2015.csv").then(function(data) {
		var columns_val = d3.values(data)[0];
		Object.keys(columns_val).slice(4, 29).forEach(function(d) { //save value to hash
			years.push(d);
		});
		var select = d3.select('#times')
			.on('change', timechange)
		var options = select
			.selectAll('option')
			.data(years).enter()
			.append('option')
			.attr("value", function(d, i) {
				return i;
			})
			.text(function(d) {
				return d;
			});

		function timechange() {
			selectValue = d3.select('#times').property('value')
			config.time = years[selectValue];
			display_data();
		};
	});
	d3.select("#myCheckbox").on("change", update);
	var refreshIntervalId;

	function update() {
		if (d3.select("#myCheckbox").property("checked")) {
			var Index = 0;
			refreshIntervalId = setInterval(function() {
				if (Index >= years.length) {
					Index = 0;
				}
				config.time = years[Index]
				Index++;
				display_data();
			}, 700);

		} else {
			clearInterval(refreshIntervalId);
		}

	}
}

function display_data() {
	MAP_KEY = config.data0;
	MAP_VALUE = config.time;
	filname = "data/feature" + config.feature + ".csv";
	d3.csv(filname).then(function(data) {
		d3.select('#title_svg').text(features[config.feature]);
		d3.select('#attribute_name').text(features[config.feature]);
		display_radar();
		d3.select('#title_time').text(config.time);
		data.forEach(function(d) { //save value to hash
			valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
		});

		var quantize = d3.scaleQuantize() // input between domain() | output between range()
			.domain([d3.min(data, function(d) {
					return (+d[MAP_VALUE])
				}),
				d3.max(data, function(d) {
					return (+d[MAP_VALUE])
				})
			])
			.range(d3.range(COLOR_COUNTS).map(function(i) {
				return i
			}));


		d3.json("tool/world-topo-min.json").then(function(world) {
			var countries = topojson.feature(world, world.objects.countries).features;

			//     svg.append("path")
			//        .datum(graticule)
			//        .attr("class", "choropleth")
			//        .attr("d", path);

			var g = svg.append("g"); //group

			g.append("path")
				.datum({
					type: "LineString",
					coordinates: [
						[-180, 0],
						[-90, 0],
						[0, 0],
						[90, 0],
						[180, 0]
					]
				})
				.attr("class", "equator")
				.attr("d", path); //equator

			var country = g.selectAll(".country").data(countries);

			country.enter().insert("path")
				.attr("class", "country")
				.attr("d", path)
				.attr("id", function(d, i) {
					return d.id;
				})
				.attr("title", function(d) {
					return d.properties.name;
				})
				.style("fill", function(d) { //fill color
					if (valueHash[d.properties.name]) {
						var c = quantize((valueHash[d.properties.name]));
						var color = colors[c].getColors();
						return "rgb(" + color.r + "," + color.g +
							"," + color.b + ")";
					} else {
						return "#ccc";
					}
				})
				.on("mousemove", function(d) { //display one attribute
					var html = "";

					html += "<div class=\"tooltip_kv\">";
					html += "<span class=\"tooltip_key\">";
					html += features[config.feature]; //country name
					html += "  :<br>";
					html += d.properties.name + "</span>";
					html += "<span class=\"tooltip_value\">";
					html += (valueHash[d.properties.name] ? valueFormat(valueHash[d.properties.name]) : "");
					html += "";
					html += "</span>";
					html += "</div>";

					$("#tooltip-container").html(html);
					$(this).attr("fill-opacity", "0.8");
					$("#tooltip-container").show();

					var coordinates = d3.mouse(this);

					var map_width = $('svg')[0].getBoundingClientRect().width;
					if (d3.event.pageX < map_width / 2) {
						d3.select("#tooltip-container")
							.style("top", (d3.event.layerY + 15) + "px") //d3.event = mouse move in
							.style("left", (d3.event.layerX + 15) + "px");
					} else {
						var tooltip_width = $("#tooltip-container").width();
						d3.select("#tooltip-container")
							.style("top", (d3.event.layerY + 15) + "px")
							.style("left", (d3.event.layerX - tooltip_width - 30) + "px");
					}
				})
				.on("mouseout", function() {
					$(this).attr("fill-opacity", "1.0");
					$("#tooltip-container").hide();
				})
				.on("click", function(d) {
					//displaybytime(d.properties.name);
					//displayattibutes(d.properties.name, config.time);
					sortByAttr(d.properties.name);

					get_radar_data(d.properties.name, config.time);
					display_radar();
				});

			g.append("path")
				.datum(topojson.mesh(world, world.objects.countries, function(a, b) {
					return a !== b;
				}))
				.attr("class", "boundary")
				.attr("d", path);

			svg.attr("height", config.height * 2.2 / 3);
		});

		d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
	});
}

function sortByAttr(country_name) {
	var countryAttr = [];
	var count = 0;
	if (list.length != 0) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].indexOf(country_name) == -1) {
				count = count + 1;
			}
		}
	}
	if (count == list.length) {
		var temp;
		countryAttr.push(country_name);
		var filname = "data/feature" + config.feature + ".csv";
		d3.csv(filname).then(function(data) {
			for (var i = 0; i < data.length; i++) {
				if (data[i]["Country Name"] == country_name) {
					if (data[i][config.time] == '..') {
						temp = 0;
					} else {
						temp = parseFloat(data[i][config.time]);
					}
					countryAttr.push(temp);
				}
			}
			if (list.length < 5) {
				list.push(countryAttr);
				list.sort(function(x, y) {
					return y[1] - x[1];
				})
			}
			display_table();
		});
	}
}

function display_table() {
	//console.log(list.length);
	if (list.length > 0) {
		binding = d3.select('tbody')
			.selectAll('tr').data(list);
		console.log(list);
		divs = binding.enter().append('tr');
		binding = d3.select('tbody')
			.selectAll('tr').data(list);
		divs.append('td').attr("class", "attr_key");
		divs.append('td').attr("class", "attr_value");
		binding.select('.attr_key')
			.text(function(d, i) { //save value to hash
				console.log('0');
				return d[0];
			});
		binding.select('.attr_value')
			.text(function(d, i) { //save value to hash
				return d[1];
			});
		binding.exit().remove();
	} else {
		console.log('1');
		d3.select('tbody').remove();
		d3.select('table').append('tbody');
	}
	console.log('2');
}

function resetBtn() {
	list = [];
	radar_data = [];
	display_table();
	display_radar()
}

function displayattibutes(country_name, year) {
	d3.csv("data/countries/" + country_name + ".csv").then(function(data) {
		attrHash = {}
		data.forEach(function(d) { //save value to hash
			attrHash[d["Series Name"]] = +d[year];
		});
		//console.log(data);
		binding = d3.select('#r_middle_part').select('table')
			.selectAll('tr').data(data);
		divs = binding.enter().append('tr');
		divs.append('td').attr("class", "attr_key");
		divs.append('td').attr("class", "attr_value");
		binding.select('.attr_key')
			.text(function(d, i) { //save value to hash
				return d["Series Name"];
			});
		binding.select('.attr_value')
			.text(function(d, i) { //save value to hash
				return d[year];
			});
		binding.exit().remove();

	});
}
// 	var html = "";
// 	html += "<div class=\"tooltip_kv\">";
// 	html += "<span class=\"tooltip_key\">";
// 	html += features[config.feature]; //country name
// 	html += d.properties.name + "</span>";
// 	html += "<span class=\"tooltip_value\">";
// 	html += (valueHash[d.properties.name] ? valueFormat(valueHash[d.properties.name]) : "");
// 	html += "";
// 	html += "</span>";
// 	html += "</div>";
// 	$("#tr_middle_part").html(html);


function displaybytime(country_name) {

}
//获取雷达图数据
function get_radar_data(country_name, d_year) {
	var attrs = [];
	var temp;
	var dataset = {};
	filename = "data/countries/" + country_name + ".csv";
	d3.csv(filename).then(function(data) {
		for (var i = 0; i < data.length; i++) {
			if (data[i][d_year] == '..') {
				temp = 0;
			} else {
				temp = parseInt(data[i][d_year])
			}
			attrs.push(temp);
		}
	});
	dataset.value = attrs;
	dataset.name = country_name;
	radar_data.push(dataset);

	console.log(radar_data);
}
//显示雷达图数据
function display_radar() {
	var dom = document.getElementById("r_bottom_part");
	var myChart = echarts.init(dom);
	var app = {};

	var option = null;
	option = {
		tooltip: {},
		legend: {},
		radar: {
			// shape: 'circle',
			name: {
				textStyle: {
					color: '#fff',
					backgroundColor: '#999',
					borderRadius: 3,
					padding: [3, 5]
				}
			},
			indicator: [{
					name: 'Arable land (% of land area)',
					max: 50
				},
				{
					name: 'Armed forces personnel (% of total labor force)',
					max: 10
				},
				{
					name: 'GDP (current US$)',
					max: 16800000000000
				},
				{
					name: 'GDP growth (annual %)',
					max: 15
				},
				{
					name: 'GDP per capita (current US$)',
					max: 10000
				},
				{
					name: 'GDP per capita growth (annual %)',
					max: 10
				},
				{
					name: 'Internet users (per 100 people)',
					max: 2
				},
				{
					name: 'Labor force, female (% of total labor force)',
					max: 50
				},
				{
					name: 'Labor force, total',
					max: 13455537
				},
				{
					name: 'Population density (people per sq. km of land area)',
					max: 1000
				},
				{
					name: 'Population growth (annual %)',
					max: 5
				},
				{
					name: 'Population, female (% of total)',
					max: 100
				},
				{
					name: 'Population, total',
					max: 10239000
				},
				{
					name: 'Rural population',
					max: 12415909
				},
				{
					name: 'Surface area (sq. km)',
					max: 7741220
				},
				{
					name: 'Unemployment, female (% of female labor force) (modeled ILO estimate)',
					max: 50
				},
				{
					name: 'Unemployment, total (% of total labor force) (modeled ILO estimate)',
					max: 30
				}
			]
		},
		series: [{
			name: 'data comparison',
			type: 'radar',
			// areaStyle: {normal: {}},
			data: [{
					value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					name: 'A'
				},
				{
					value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					name: 'B'
				},
				{
					value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					name: 'C'
				},
				{
					value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					name: 'D'
				},
				{
					value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					name: 'E'
				}
			]
		}]
	};
	//console.log(radar_data_list);
	//console.log(option.series[0].data);
	//radar_data.value = [-10,200,30.7,400,500,600,-7000000000,10,20,30,40,50,60,70,10,20,30];
	for (var i = 0; i < 5; i++) {
		option.series[0].data[i] = radar_data[i];
	}
	//console.log(radar_data.value);
	//console.log(radar_data);
	//console.log(option.series[0].data)
	if (option && typeof option === "object") {
		myChart.setOption(option, true);
	}
}
