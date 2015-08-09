Draft blog post and example project.

# On Scalable Interactive Mapping: Recent Favorites Tricks

I spent some time thinking up some coding patterns that made my recent interactive mapping code less bulky, more modular, and all in all more fun to write and maintain. Finally, I extracted and collected them into this blog post. For those of you looking to see live, breathing code, this [demo project](https://github.com/pickled-plugins/scaling-tricks-for-geo) sums things up in a somewhat unpolished nutshell.

Some topics I touch on:
* a focused look at interactive data visualizations within larger front-end architectures.
* a smarter flavor of geodata that reintroduces featureful data models inside interactive map views.
* a scetch of a visualization lifecycle that works the same way for various forms of displayable data, whether they need additional shape files loaded or not.
* a word on visualization.

The technology stack: [d3.js](http://d3js.org/) render using [Backbone.js](http://backbonejs.org/) data models, carried over into [GeoJSON](http://geojson.org/) format. That said, the ideas and code samples from this post may work well with other MV* frameworks or in [React](http://facebook.github.io/react/) apps, and especially as lightweight helpers if you don't use a framework at all. In fact, the [project](http://atlas.newamerica.org) that first used patterns from this blog post is in transition to React, so there is a good chance I may follow up with specifics.

All that put aside for a split second, though, I just want to say that I am really excited to do a technical blog for the very first time. I hope you enjoy!

## Interactive GeoData Visualizations within Client-side Apps

On the combined use of ``Backbone.js``, a minimalistic MV* framework and ``d3.js``, the most popular data visualization library, Shirley Wu said the following: "Yup, I totally agree, it's really not that difficult. But what I do think is challenging (and interesting), is to use them together well". I resonated not only with her statement, but with her code examples she presented [on Backbone Conf III 2014](https://www.youtube.com/watch?v=TqXD0_tGPv8&list=PLlgxAbM67lYIGw8DnANC7VgREbzJRQged&index=7). I think they did a really good job ironing out the differences in which object-oriented Backbone views and functional d3 rendering workflows can be blended together. In an ever-so-slightly different flavor, these ideas found their way into my work as well.

Things got yet more interesting when I turned to using ``d3`` for geomapping applications within a larger MV* app. The prominent data structure for mapping, GeoJSON (or TopoJson, which becomes GeoJSON inside the app anyway), looks quite a bit different than a Backbone model or collection. It has custom [format](http://geojson.org/), may weight hundreds of kilobytes, and tends to not be available with uploaded spreadsheet data that I was mapping, requiring an additional ajax call and further joining/processing. Working with it took some time to get accustomed to, and here is an approach that worked well for me.

## The Data Side: GeoJSON, Enriched

### A Short-lived Misconception of Rigid Geodata

In several MV* frameworks, models are available in the views with all their convenience methods. ``this.model.getSummary()``, ``@resource.aggregate()`` show up in view code across languages and frameworks for our enjoyment and convenience. When I started out rendering GeoJSON-based data, I thought I had to abandon this luxury for seemingly rigid, static constructs like the following:

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

Seeing my data buried into a set data structure, lacking model instance methods or template helpers I've been using extensively made me think that I had to say goodbye to the [Rails-like, playful comfort](https://signalvnoise.com/posts/3873-programming-with-toys-and-magic-should-be-relished-not-scorned) of my prior MV* work. But this really does not have to happen.

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

To facilitate smuggling, or more formally, injecting model references into a GeoJSON object, I wrote a constructor that generates GeoJSON-like objects directly passable to d3 for rendering, along with some mixins and convenience methods for building, extending or converting static data into the above format. I named this constructor ``stg.RichGeoJSON()`` (mind the ``stg``, or scaling tricks for geo namespace), referenced in the test project and in the post from this point on.

I was very excited to find that ``d3`` is so welcoming to smarter objects like this, so I went ahead and enhanced them some more. Could a build-in event system be useful? Anything else? Let's find out.

### The Self-sufficient GeoModel

Let's think through the process of mapping some datasets with some ``new stg.RichGeoJSON()``'s. First up:

	collectionData = [
		{ name: 'pin one', size: 2, latitude: 37, longitude: 78 },
		{ name: 'pin two', size: 1, latitude: 37.1, longitude: 77 },
		{ name: 'pin three', size: 6, latitude: 37.3, longitude: 72 }
	];

I would personally make the inner objects into Backbone models, squeeze the latitudes/longitudes into arrays to populate each GeoJSON feature's ``geometry`` field, add a model reference to the feature under the ``_model`` key, build all features up into a GeoJSON, and ship it off to ``d3`` for rendering (scroll down for more on that). The ``stg.RichGeoJSON`` constructor even provides a method to do this automatically with some room for customization:

	// stg.Pins extends from Backbone.Collection
	collection = new stg.Pins(collectionData);

	richGeoJson = new stg.RichGeoJSON();
	// the second argument provides possible keys where geodata may be found
	richGeoJson.buildFromLatLongCollection(collection, {
		latKeys: [ 'lat', 'latitude', 'Lat' ],
		longKeys: [ 'long', 'longitude', 'Long' ]
	});
	// proceed to rendering

As a bonus feature, I added support for messy, inconsistent data that may contain latitude and longitude values under different keys. This allowed me to work with data that has inconsistent format without the need to reconfigure parsing methods each time.

Leaving it at that for now, our next dataset looks like this:

	// 2013 population data taken from Wikipedia for demonstration purposes.
	statesData = [
		{ name: 'Nebraska', population: 1868516, region: 'Midwest' },
		{ name: 'Arizona', population: 6626624, region: 'Southwest' }
	];

After we've made this into a Backbone Collection and realized we're dealing with states (a check my collection does with a typechecker module, not discussed in this post), we can load in our trusted ``us-states.geo.json`` with ``jQuery``'s or ``d3``'s ajax helpers, make it into RichGeoJSON instance, use its helpers to blend in the models of our collection into the features, and our data is ready for rendering once more:
	
	// stg.States extends from Backbone.Collection
	states = new stg.States(states);

	$.get('data/us-states.geo.json', function(data) {
		var richGeoJson = new stg.RichGeoJSON(data);
		// join by name
		richGeoJson.injectCollection(states, 'name', injectOptions);
		// proceed to rendering
	});

The ``injectOptions`` specifies additional options that can be used to match models with GeoJSON features. It is not currently implemented in the example, but it is definitely something I'd like to explore in detail in a later discussion. Some features it could include:
* case-sensitivity.
* the number of characters that can be extra or off (a collection item with ``name: 'new\tjerseyx'`` could still be matched with a feature with ``name: 'New Jersey'``).
* backup join keys. If there is no name field match, maybe there is a ``'state'``, or we can try our luck with an ``'id'``.
* an entirely custom, project-specific join function, taking a model and a feature as parameters, and returning a boolean telling us whether they match.

``#injectCollections()`` would then return join statistics such as how many collection items could be injected, if there were several that could have been injected into the same GeoJSON feature, and so on (feature not yet implemented in the test project). Join options, back up keys and join strictness could then be refined based on the feedback from any previous attempt, even to a certain degree of automation. This workflow is sketched out in comments for now, and I welcome further ideas and code contribution to finish it up.

This approach works well for apps where multiple data formats need to be supported (inconsistent data, user input). An alternate approach would be to format the data to make the join logic more universal. After [Tom MacWright](http://www.macwright.org/about/) kindly devoted some of his time to review this post, he suggested the following syntax:

	statesData = [
		{ 
			name: 'Nebraska', 
			population: 1868516, 
			region: 'Midwest',
			geometry: {
				type: 'Join',
				id: 'Nebraska',
				collection: 'states'
			}
		},
		{ 
			name: 'Arizona', 
			population: 6626624, 
			region: 'Southwest',
			geometry: {
				type: 'Join',
				id: 'Arizona',
				collection: 'states'
			}
		}
	];

By formatting data this way, either the ``#injectCollections()`` method becomes much simpler to facilitate building a separate ``RichGeoJson`` instance, or, since this is already starting to look like a GeoFeature, shape data may end up right inside the collection data.

### Sync and Async GeoJSON in the Same App

The above implementations for the US states visualization and the map pins one look a bit different. The latter is synchronous and yields ``richGeoJSON`` immediately, while the former may keep a spinner icon waiting through a two-second server lag before it retrieves the shape data and carries on with the rendering. I am not very happy keeping these different implementations in mind, adding rendering logic in different places, one roaming free and the other buried inside an ajax callback. I settled with writing asynchronous(-looking) code whether I needed it or not, as follows:

	var richGeoJson = new stg.RichGeoJSON();
	// set callback to execute when object is ready
	richGeoJson.onReady(function() {
		// call rendering module with rich data
	});
	// construct richGeoJson here, whether through build-from-lat-long or ajax-fetch-and-inject
	// onReady called automatically when things are ready.

The ``richGeoJson`` instance will remember to execute its ``onReady`` method after either a build or an inject is complete, at which point we have all we need to send our logic-packed shapes over to rendering. I found this code to be more readable and uniform, making my app behave the same for whatever data that rolled in. In the end, I managed to share a fair amount of code between rendering ready-available latitude-longitude points or shape files. Rendering 

## The View Side

The data- and model-related implementations above centered around polymorphism, and view-related ones did the same. From my very first experiences tinkering with d3 code, I had a hard time keeping my code clean, and generally felt sceptical that most d3 code examples available online, with all their nesting and lack of high-level clarity, could scale (in saying so, I do not mean to imply that these insightful pieces of code failed at their intended purpose).

At this point, I really got used to Backbone views, and so, inspired by Shirley's code examples, I ended up splitting up my d3 code into methods of a custom view object - methods that copy a Backbone view's API and thus behave like any other view my app uses.

	/* 
	 *  Extend from Marionette.js' Object constructor to have access to an event system
	 *  and an initialize method.
	 */ 
	stg.GeoView = Marionette.Object.extend({

		/*
	     * Backbone's initializer called when an instance is created.
	     * Sets container and data.
	     */ 
		initialize: function(options) {},

		/*
	     * Render visualization, set attributes and event listeners.
	     * Called only when the data changes.
	     */ 
		render: function() {},

		/*
	     * Render the visualizations svg container and an inside group. 
	     * Store these on the instance.
	     */ 
		renderSvgContainer: function() {},

		/*
	     * Set or update attributes. Called within render, and as a lightweight update method
	     *   when the data doesn't change, but its presentation does (e.g. when a map is recolored).
	     */
		setAttributes: function() {},

		/*
	     * Get class name for a feature. 
	     * Use _model references to have access to attributes and instance methods.
	     */
		getFeatureClass: function(feature) {},

		/*
	     * Destroys view by unbinding event listeners and removing dom elements.
	     */
		destroy: function() {}

	});

For those of you familiar with the [BackboneD3View](https://github.com/akre54/Backbone.D3View) project, you may notice the many similarities. This time, I simply opted for a more simplistic solution, lightly built from scratch.

## All Together

Putting all the pieces together, here is how a map pin visualization could look like:

	(function(data) {

		var mapItems = new Backbone.Collection(data);

		var richGeoJson = new stg.RichGeoJson();

		richGeoJson.onReady(function() {
			new stg.GeoView({ 
				el: '.viz', 
				richGeoJson: richGeoJson 
			}).render();
		});

		richGeoJson.buildFromLatLongCollection(mapItems);

	}());

Note that this is by no means polished code. On actual applications, I moved all logic generating ``richGeoJson`` into an instance method on the collection. Generating the view ended up in a controller module. The API changed a little bit to conform to make things more consistent across a larger codebase. My goal was not presenting a library, perhaps just a few ideas on how one could be created, if a formalized version makes sense for your project. In this example, extending the view from a handy, well-documented base class would undoubtedly make things a bit more clear. This could become an open-source miniproject, and if you're interested in having it around, please let me know.

## So, Worth it?

I think so. From personal experience, these tricks do give some organizational and semantic clarity, more code reuse and more flexibility to implement new features. What do you think? Care to do me a favor and head over to [GitHub](https://github.com/pickled-plugins/scaling-tricks-for-geo/issues) and write down some thoughts?

Otherwise, or until then, happy mapping!