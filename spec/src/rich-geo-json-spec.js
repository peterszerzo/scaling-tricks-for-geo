describe('stg.RichGeoJson', function() {

	// cache shorthand
	var RGJ = stg.RichGeoJson;


	describe('initialize', function() {

		it('creates GeoJson object with empty features array if no parameters are passed', function() {
			var rgj = new RGJ();
			rgj.type.should.equal('FeatureCollection');
			rgj.features.should.eql([]);
		});

		it('set GeoJson object set as parameter', function() {
			var rgj = new RGJ({ type: 'FeatureCollection', features: [ 1, 2, 3 ] });
			rgj.type.should.equal('FeatureCollection');
			rgj.features.should.eql([ 1, 2, 3 ]);
		});

		it('has an event system', function() {
			var rgj = new RGJ(),
				isListening = false;
			rgj.on('test:event', function() {
				isListening = true;
			});
			rgj.trigger('test:event');
			isListening.should.equal(true);
		});

	});


	describe('getValue', function() {

		it('gets value', function() {
			var rgj = new RGJ(),
				model = new Backbone.Model({ latitude: 110 });
			rgj.getValue(model, ['lat', 'lats', 'latitude', 'latx']).should.equal(110);
		});

	});


	describe('addFeature', function() {

		it('adds feature', function() {
			var rgj = new RGJ();
			rgj.addFeature({ a: 'b' });
			rgj.features.should.eql([ { a: 'b' } ]);
		});

	});


	describe('injectCollection', function() {

		it('injects collection by a single, strictly matching id key', function() {

			var rgj = new RGJ({
				type: 'FeatureCollection',
				features: [
					{ id: 1, type: 'Feature' },
					{ id: 2, type: 'Feature' },
					{ id: 4, type: 'Feature' }
				]
			}),
				coll = new Backbone.Collection([
					{ id: 1, name: 'one' },
					{ id: 4, name: 'four' }
				]);

			rgj.injectCollection(coll, 'id');
			rgj.features.should.eql([
				{ type: 'Feature', id: 1, _model: coll.models[0] },
				{ type: 'Feature', id: 2 },
				{ type: 'Feature', id: 4, _model: coll.models[1] }
			]);

		});

		it('injects collection by a single, strictly matching key in the properties hash', function() {

			var rgj = new RGJ({
				type: 'FeatureCollection',
				features: [
					{ id: 1, type: 'Feature', properties: { name: 'Peter' } },
					{ id: 2, type: 'Feature', properties: { name: 'Paul' }  },
					{ id: 4, type: 'Feature', properties: { name: 'Umm' }  }
				]
			}),
				coll = new Backbone.Collection([
					{ name: 'Paul' },
					{ name: 'Peter' }
				]);

			rgj.injectCollection(coll, 'name');
			rgj.features.should.eql([
				{ id: 1, type: 'Feature', properties: { name: 'Peter' }, _model: coll.models[1] },
				{ id: 2, type: 'Feature', properties: { name: 'Paul' }, _model: coll.models[0] },
				{ id: 4, type: 'Feature', properties: { name: 'Umm' }  }
			]);

		});

	});

});