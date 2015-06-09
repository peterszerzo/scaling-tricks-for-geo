(function() {

	var svg = d3.select('.viz').append('svg'),
		g = svg.append('g'),
		projection = d3.geo.albersUsa(),
		path = d3.geo.path().projection(projection);

	d3.json('data/us-states-10m.json', function(data) {
		g.selectAll('path')
			.data(topojson.feature(data, data.objects.states).features)
			.enter()
			.append('path')
			.attr({ d: path })
			.on('click', function(d) { console.log(d); });
	});

}());