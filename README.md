+ +++ ++ + +++ + ++
Draft blog post and example project to demonstrate some tricks I've used to create well-scaling interactive mapping applications.
++ +++ ++ ++++ ++ +

# On Scalable Interactive Mapping: Recent Favorites Tricks

I spent some time thinking through interactive mapping strategies that allowed my recent mapping code be versatile, modular, dry and, best of all, fun to write and maintain. Enough, in fact, that I decided to share them in this post as well as extract them in a [simple project](https://github.com/pickled-plugins/scaling-tricks-for-geo) to provide realistic, living code examples.

Here are some highlights:
* a look at interactive data visualizations inside conventional MV* architectures.
* prototypes for smart data structures that play nicely with different rendering libraries.
* a versatile rendering workflow that elegantly works for map pins, counties, states and countries alike, whether they need additional shape files fetched or not.

The technologies I used: [d3.js](http://d3js.org/), [Leaflet.js](http://leafletjs.com/), [Backbone.js](http://backbonejs.org/), [Marionette.js](http://marionettejs.com/), [GeoJson](http://geojson.org/). I also suspect that some of these ideas may work really well with other frameworks such as [Angular](https://angularjs.org/), [Ember](http://emberjs.com/), and especially if you don't use a framework.

## Interactive Visualizations in an MV* Architecture

On Backbone Conf III 2014, Shirley Wu [said](https://www.youtube.com/watch?v=TqXD0_tGPv8&list=PLlgxAbM67lYIGw8DnANC7VgREbzJRQged&index=7) that it is not hard to use Backbone with D3, but it is hard to use them together well. Her code examples have been great inspiration and starting point throughout my thought process, and I implemented some of her ideas in my code.

In her example, the implementation of view rendering was different than in a traditional MV* app. For geomapping, though, one may find that both the view and the model looks different. GeoJson looks quite a bit different than a Backbone.Model instance. And so, looking for a solution that is lighter than [Backbone.Leaflet](https://github.com/LuizArmesto/backbone.leaflet), I set out to do my own experiments.

### On View Data. GeoJson, Enriched

#### A Short-lived Misconception

When I started doing interactive maps, the workflow of rendering geodata seemed very different from rendering data in conventional divs, lists and tables. Models in MV* frameworks are available to the views with all their convenience methods. On the other hand, the data structures prominent for interactive maps - Geo- and TopoJson - came off to me as static data stores, some coordinates, maybe an additional property or two. It is this very little that one has access to when any component of the rendering is drawn, clicked, hovered on. As a result, I felt tempted to have data logic get tangled inside these view rendering methods. But this really, really does not have to happen.

My initial take was to examine the feature object for an id or any other property I could use to link to an outside, comprehensive data model. But I knew I could do better. Turns out, if I passed a GeoJson file over to the rendering department of our app, its head of operations - d3.js - will be perfectly fine if we smuggled in rich, logic-packed Backbone model references, as such:

	GeoJson = {
		type: 'FeatureCollection',
		features: [
			{
				_model: /* A Backbone model instance */,
				type: 'Point',
				geometry: { /* geometry here */ }
			}
		]
	}

Now we can retrieve this references inside rendering and event handling code, a feature we are so used to from 'conventional' user interface engineering. The model is available right away, no resource-consuming searches and joins needed.

	d3.selectAll('path')
		.attr('class', function(feature) {
			var model = feature._model;
		})
		.on('click', function(feature) {
			var model = feature._model;
		});

To facilitate injecting these model references into the GeoJson file, I created a class that can be directly passed as GeoJson to d3, along with some nifty mixins and convenience methods that help enrich the bland, static shape files that I used to work with - and hence the construct new RichGeoJson().

Luckily, d3 is very welcoming to such smart data structures, so I went ahead and enhanced them some more. Could an event system be useful? Anything else?

#### A Self-sufficient Model

Let's map some datasets with new RichGeoJson() to see if we can figure out new applications. Our day is starting out jolly as we look at our first one:

	[
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 },
		{ name: '', size: 2, latitude: 37, longitude: 78 }
	]

Make them into Backbone models, squeeze the latitudes/longitudes into arrays, build up a GeoJson, smuggle in the _model references, and head for an early mid-morning snack. The RichGeoJson constructor that I implemented even provides a method to do this in a blink of an eye with some customization:

	rgj = new stg.RichGeoJson();
	rgj.buildFromLatLongCollection(collection, {
		latKeys: [ 'lat', 'latitude', 'Lat' ],
		longKeys: [ 'long', 'longitude', 'Long' ]
	});

Already, there is some support for messy, inconsistent data that encodes latitude and longitude values with different keys - and this idea can certainly be expanded in other parts of the app. Our second dataset looks a bit different:

	[
		{ name: 'Nebraska' },
		{ name: 'Arizona' }
		/* ... */
	]

No biggie - I'll just load in our trusted us-states.geo.json, do some joining with a RichGeoJson instance, and call it a day. 

Notice, though, that the implementations for the two apps are different. One is synchronous and yields richGeoJson immediately, the other one will linger throughout our 6-second internet lag and follows up. 

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

#### Other Features

Rich GeoJson can certainly do more. It could have a built-in event system. It could hook on to a geolocation service. It could try and try and try until the data comes alive.