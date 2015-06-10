# On Scalable Interactive Mapping: Recent Favorites Tricks

Draft blog post and example project to demonstrate the techniques I've used to create decently scaling interactive mapping applications.

Highlights:
* a look at interactive data visualizations inside conventional MV* architectures.
* prototypes for smart data structures that play nicely with different rendering libraries.

Technologies used: [d3.js](http://d3js.org/), [Leaflet.js](http://leafletjs.com/), [Backbone.js](http://backbonejs.org/), [Marionette.js](http://marionettejs.com/), [GeoJson](http://geojson.org/).

## Interactive Visualizations in an MV* Architecture

### On View Data. GeoJson, Enriched

#### A Short-lived Misconception

When I started doing interactive maps, rendering geodata seemed very different from rendering data in conventional divs, lists and tables. Models in MV* frameworks are available to the views with all their convenience methods. On the other hand, the data structures prominent for interactive maps - Geo- and TopoJson - came off to me as static data stores, some coordinates, maybe an additional property or two. It is this very little that one has access to when any component of the rendering is drawn, clicked, hovered on. As a result, I felt tempted to have data logic get tangled inside these view rendering methods. But this really, really does not have to happen.

My initial take was to embed a model id and made an outside reference to a more comprehensive data model every time I needed. But I knew I could do better. Turns out, if I passed a GeoJson file over to the rendering department of our app, its head of operations - d3.js - will be perfectly fine if we smuggled in rich, logic-packed Backbone model references, as such:

	GeoJson = {
		type: 'FeatureCollection',
		features: [
			{
				_model: 
			}
		]
	}

All of a sudden, we can retrieve this references inside rendering and event handling code, a feature we are so used to from 'conventional' user interface engineering.

And since d3 is so lenient, there is no doubt that I can also get away with mixing in an event system. And other things as I please. I named these boosted JS objects Rich GeoJsons, used in writing as well as in the example project. See example implementation in 

#### A Self-sufficient Model

Let's map some datasets with new RichGeoJson(). Our day is starting out jolly as we look at our first one:

	[
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 }
	]

Make them into Backbone models, squeeze the latitudes/longitudes into arrays, build up GeoJson, smuggle in the _model references, and head for an early mid-morning snack. The second one looks like this:

	[
		{ name: 'Nebraska' },
		{ name: 'Arizona' }
		/* ... */
	]

No biggie - we'll just load in our trusted us-states.geo.json, do some joining, and call it a day. The real thinking from my part began when I started devising ways to share code between these two kinds of visualizations. After all, I could never tell what was coming.

In the end, I settled with having type checkers and type-specific GeoJson builders do their thing inside the toGeoJson model. They figure out what the data type is, fetch appropriate shape files, inject model references, and return. What comes out of toGeoJson is works the same way in both cases. Almost.

#### Sync-async Polymorphism

The difference between these two methods is that if latitudes and longitudes are detected, a simple GeoJson file can be made on the fly, with no ajax dependencies and very little computing power. The second example, on the other hand may need hundreds of kilobytes of state boundary coordinates rolling in asynchronously. One returns immediately, and one that waits around. And like most of us, I sure didn't want them to behave differently.

My solution was to add an onReady() callback that is called when the geo view data is ready, whether that is instantaneous or after five more seconds of internet lag. I wrote asynchronous code whether I needed it or not.

### On View Rendering: Conventional, Interactive, Data-Driven

View data-related implementations centered around polymorphism, and view-related ones did the same thing. From my very first experiences tinkering with d3 code I had a hard time keeping my code clean, and generally felt sceptical that most d3 code examples available online, with all their nesting and lack of high-level clarity, could scale (not to imply that these insightful pieces of code failed in any expectations that they were intended to live up to). On the other hand, I really got used to Backbone views, so I ended up splitting up my d3 code into methods of a custom view object - methods that copy a Backbone view's API.

	View = Marionette.Object.extend({
		onRender: function() {},
		renderContainer: () {},
		render: function() {},
		update: function() {},
		destroy: function() {}
	});

