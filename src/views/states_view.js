/*
 * Extending from Marionette.Object provides an event system to view instances.
 */
stg.StatesView = Backbone.View.extend({

    // Custom initializer.
    initialize: function(options) {

        // Set container
        if (this.el != null) {
            this.el = options.el;
            this.$el = $(this.el);
        } else {
            this.$el = options.$el;
        }

        // Set data object.
        this.richGeoJson = options.richGeoJson;

    },

    // Render svg content.
    render: function() {
        this._renderSvgContainer();
        this.g.selectAll('path')
            .data(this.richGeoJson.features)
            .enter()
            .append('path');
        // Initial call to update attributes. This method may be used later as an inexpensive rerender 
        //   if the data doesn't change but its display does.
        this.updateAttributes();
        this.attachFeatureEventListeners();
    },

    // Render the visualizations svg container and an inside group. Store these on the instance.
    _renderSvgContainer: function() {
        this.svg = d3.select(this.el).append('svg');
        this.g = this.svg.append('g');
    },

    // Feature event listener.
    onFeatureMouseEnter: function(feature) {
        var model = feature._model;
        this.trigger('summary:change', model.getSummary());
    },

    // Feature event listener.
    onFeatureMouseLeave: function(feature) {
        var model = feature._model;
        this.trigger('summary:change', '');
    },

    // Attach all feature event listener.
    attachFeatureEventListeners: function() {
        this.g.selectAll('path')
            .on('mouseenter', this.onFeatureMouseEnter.bind(this))
            .on('mouseleave', this.onFeatureMouseLeave.bind(this));
    },

    // Remove all feature event listener.
    removeFeatureEventListeners: function() {
        this.g.selectAll('path')
            .off('mouseenter')
            .off('mouseleave');
    },

    // Update attributes. Called within render, and as a lightweight update method
    //   when the data doesn't change, but its presentation does (e.g. when a map is recolored).
    updateAttributes: function() {
        projection = d3.geo.albersUsa(),
        path = d3.geo.path().projection(projection);
        this.g.selectAll('path')
            .attr({
                d: path,
                class: function(feature) {
                    var model = feature._model;
                    if (model != null) {
                        return model.isRealBig() ? 'active' : 'inactive';
                    }
                }
            });
    },

    // Destroy view.
    destroy: function() {
        this.stopListening();
        this.selectAll('path').remove();
        this.g.remove();
        this.svg.remove();
    }

});