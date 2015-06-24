Draft blog post and example project.

# On Scalable Interactive Mapping: Recent Favorites Tricks

I spent some time thinking up some strategies that made my recent interactive mapping code more versatile, modular, dry and, best of all, fun to write and maintain. Eventually, they found their way to this blog post. For those of you eager to jump right to live, working code, this [test project](https://github.com/pickled-plugins/scaling-tricks-for-geo) uses most of the tricks I talk about, touching on the following topics:
* a look at interactive data visualizations inside conventional MV* architectures.
* a smarter flavor of geodata that reintroduces featureful data models inside interactive map views.
* a versatile rendering workflow that aims to work the same way for rendering lat-long pins, counties, states and countries alike, whether they need additional shape files fetched or not.

The technology stack: [d3.js](http://d3js.org/) and [Leaflet.js](http://leafletjs.com/) (Leaflet coming soon) render data in [GeoJSON](http://geojson.org/) format, all within [Backbone.js](http://backbonejs.org/) and [Marionette.js](http://marionettejs.com/) apps. I also have a feeling that the ideas and code samples I talk about will work well with other frameworks such as [Angular](https://angularjs.org/), [Ember](http://emberjs.com/) or [React](http://facebook.github.io/react/), and especially as lightweight helpers if you don't use a framework at all. In a later post, I may touch on the implementation details that would make all this code framework-agnostic - after all, the mapping projects I am currently building are moving away from Backbone Views for React, and who knows what else in a month or two.

To run the test project, navigate to the root of the project folder in the command line and run a simple Python server such as ``python -m SimpleHTTPServer 1848``. Then, in the browser, navigate to ``localhost:1848``. The main rendering code is in ``src/simple.js``, important bits and pieces in the other files.

When you're back, or if you're still with me, let's dive in!

## Interactive Visualizations in an MV* Architecture

On the combined use of ``Backbone.js``, a minimalistic MV* framework and ``d3.js``, the most popular data visualization library, Shirley Wu said the following: "Yup, I totally agree, it's really not that difficult. But what I do think is challenging (and interesting), is to use them together well". I resonated not only with her statement, but with her code examples she presented [on Backbone Conf III 2014](https://www.youtube.com/watch?v=TqXD0_tGPv8&list=PLlgxAbM67lYIGw8DnANC7VgREbzJRQged&index=7). I think they did a really good job ironing out the differences in which object-oriented Backbone views and functional d3 rendering workflows can be blended together. In an ever-so-slightly different flavor, these ideas found their way into my work as well.

Things got yet more interesting when I turned to using ``d3`` for geomapping applications within a larger MV* app. The prominent data structure for mapping, GeoJSON (or TopoJson, which becomes GeoJSON inside the app anyway), looks quite a bit different than a Backbone model or collection. It has custom [format](http://geojson.org/), may weight hundreds of kilobytes, and tends to not be available with uploaded spreadsheet data that I was mapping, requiring an additional ajax call and further joining/processing. Working with it took some time to get accustomed to, and here is an approach that worked well for me.

### GeoJSON, Enriched

#### A Short-lived Misconception of Rigid Geodata

In several MV* frameworks, models are available in the views with all their convenience methods. ``this.model.getSummary()``, ``@resource.createdSince()`` show up in view code across languages and frameworks for our enjoyment and convenience. When I started out rendering GeoJSON-based data, I thought I had to abandon this luxury for seemingly rigid, static constructs like the following:

	geoJson = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Point',
				geometry: { /* geometry here */ },
				properties: { /* static data here. wait - static only? */ },
				id: 1 /* maybe I can join to models in outside collections every time I need to? */
			}
		]
	}

Seeing my data buried into a set data structure, lacking model instance methods or template helpers I've been using extensively made me think that I had to say goodbye to the Rails-like comfort of prior, in a way more traditional MV* applications. But this really does not have to happen.

My initial take was to examine the feature object for an ``id`` or any other property I could use to link to an outside, comprehensive data model, keeping my good old collection separate from the GeoJSON. But I knew I could swim against the current less. Turns out, if I passed a GeoJSON file over to a ``d3`` rendering module with rich, logic-packed Backbone models smuggled into its feature collection, I would get no complaints. Here is what I ended up with:

	features: [
		{
			_model: /* a freshly added, or injected, Backbone model instance */,
			type: 'Point',
			geometry: { /* geometry here */ },
			properties: { /* this we don't even need from this point on */ }
		}
	]

If we look at a sample rendering code, we see how easily we retrieve these references when setting properties and event handlers, a feature I was so used to and so reluctant to abandon.

	d3.selectAll('path')
		.data(geoJson.features)
		.enter()
		.append('path')
		.attr('class', function(feature) {
			var model = feature._model;
			/* Hello, model! */
		})
		.on('click', function(feature) {
			var model = feature._model;
			/* And hello again! */
		});

To facilitate smuggling, or more formally, injecting model references into a GeoJSON object, I wrote a constructor that generates GeoJSON-like objects directly passable to d3 for rendering, along with some mixins and convenience methods for building, extending or converting static data into the above format. I named this constructor ``stg.RichGeoJSON()`` (``stg`` being is the global namespace, acronym for scaling tricks for geo), referenced in the test project and in the post from this point on.

I was very excited to find that ``d3`` is so welcoming to smarter objects like this, so I went ahead and enhanced them some more. Could a build-in event system be useful? Anything else? Let's find out.

#### The Self-sufficient GeoModel

I invite you to think through mapping some datasets with some ``new stg.RichGeoJSON()``'s. Here is the first one:

	collectionData = [
		{ name: 'pin one', size: 2, latitude: 37, longitude: 78 },
		{ name: 'pin two', size: 1, latitude: 37.1, longitude: 77 },
		{ name: 'pin three', size: 6, latitude: 37.3, longitude: 72 }
	];

Make them into Backbone models, squeeze the latitudes/longitudes into arrays to populate each GeoJSON feature's ``geometry`` field, add the ``_model`` reference to the feature, build all features up to a GeoJSON, ship it off and done. The ``stg.RichGeoJSON`` constructor even provides a method to do this automatically with some room for customization:

	// stg.Pins extends from Backbone.Collection
	collection = new stg.Pins(collectionData);

	rgj = new stg.RichGeoJSON();
	// the second argument provides possible keys where geodata may be found
	rgj.buildFromLatLongCollection(collection, {
		latKeys: [ 'lat', 'latitude', 'Lat' ],
		longKeys: [ 'long', 'longitude', 'Long' ]
	});
	// proceed to rendering

To supplement this simple GeoJSON builder, I added support for messy, inconsistent data that may contain latitude and longitude values under different keys to work with data that has inconsistent format, or to avoid reconfiguring parsing methods to accommodate different datasets. Leaving it at that for the moment, though, onwards to the next data set, which looks like this:

	// 2013 population data taken from Wikipedia for demonstration purposes.
	statesData = [
		{ name: 'Nebraska', population: 1868516, region: 'Midwest' },
		{ name: 'Arizona', population: 6626624, region: 'Southwest' }
	];

After we've made this into a Backbone Collection and realized we're dealing with states (a check my collection does with a typechecker module, not discussed in this post), we can load in our trusted ``us-states.geo.json`` with ``jQuery``'s or ``d3``'s ajax helpers, make it into RichGeoJSON instance, use its helpers to blend in the models of our collection into the features, and our data is ready for rendering once more:
	
	// stg.States extends from Backbone.Collection
	states = new stg.States(states);

	$.get('data/us-states.geo.json', function(data) {
		var rgj = new stg.RichGeoJSON(data);
		// join by name
		rgj.injectCollection(states, 'name', injectOptions);
		// proceed to rendering
	});

The ``injectOptions`` specifies additional options that can be used to match models with GeoJSON features. It is not currently implemented in the example, but it is definitely something I'd like to explore in detail in a later discussion. Some features it could include:
* case-sensitivity.
* the number of characters that can be extra or off (a collection item with ``name: 'new\tjerseyx'`` could still be matched with a feature with ``name: 'New Jersey'``).
* backup join keys. If there is no name field match, maybe there is a ``'state'``, or we can try our luck with an ``'id'``.
* an entirely custom, project-specific join function, taking a model and a feature as parameters, and returning a boolean telling us whether they match.

``#injectCollections()`` would then return join statistics such as how many collection items could be injected, if there were several that could have been injected into the same GeoJSON feature, and so on (feature not yet implemented in the test project). Join options, back up keys and join strictness could then be refined based on the feedback from any previous attempt, even to a certain degree of automation. Messy data, you have got nothing on us.

#### Sync and Async GeoJSON in the Same App

I cut my daydreaming short when I noticed that the above implementations for the US states visualization and the map pins one look a bit different. The latter is synchronous and yields ``richGeoJSON`` immediately, while the former may keep a spinner icon waiting through a five-second server lag before it retrieves the shape data and carries on with the rendering. I am not very happy keeping these different implementations in mind, adding rendering logic in different places, one roaming free and the other buried inside an ajax callback. I settled with writing asynchronous(-looking) code whether I needed it or not, as follows:

	var rgj = new stg.RichGeoJSON();
	// set callback to execute when object is ready
	rgj.onReady(function() {
		// call rendering module with rich data
	});
	// construct rgj here, whether through build-from-lat-long or ajax-fetch-and-inject
	// onReady called automatically when things are ready.

I made ``rgj`` smart enough to execute ``onReady`` after either a build or an inject is complete, at which point we have all we need to send our logic-packed shapes over to rendering. I found this code to be more readable and uniform, making my app behave the same for whatever data that rolls in. I left out a fair amount of detail, and even so, I have no doubt that there is a lot of room here for refining and refactoring.

### On View Rendering: Conventional, Interactive, Data-Driven

Note: this section is in its very early stages of writing and is not yet covered in the test project. May break off to a follow-up blog post.

The data- and model-related implementations above centered around polymorphism, and view-related ones did the same. From my very first experiences tinkering with d3 code, I had a hard time keeping my code clean, and generally felt sceptical that most d3 code examples available online, with all their nesting and lack of high-level clarity, could scale (in saying so, I do not mean to imply that these insightful pieces of code failed at their intended purpose).

At this point, I really got used to Backbone views, and so, inspired by Shirley's code examples, I ended up splitting up my d3 code into methods of a custom view object - methods that copy a Backbone view's API and thus behave like any other view my app uses. The difference in my implementation was that I didn't extend from a ``Backbone.View``, but from a generic ``Marionette.Object`` - which, for those of you used to other frameworks, just an object that has an event system mixed into it, and calls ``initialize`` when instantiated so one doesn't need to touch the constructor.

	View = Marionette.Object.extend({
		initialize: function() {},
		onRender: function() {},
		renderContainer: ,
		render: function() {},
		update: function() {},
		destroy: function() {}
	});

## Conclusion

What do you think? I for sure had a nice time using some of these tricks, and I am having an equally nice one writing them out in this post. That said, I am sure things can be better - and I look forward to hearing suggestions on how to move around responsibilities, factor in, out and over. Until then, happy mapping!