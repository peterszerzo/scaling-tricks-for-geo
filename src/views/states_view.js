/* 
 *  Extend from Marionette.js' Object constructor to have access to an event system
 *  and an initialize method.
 */ 
stg.StatesView = Marionette.Object.extend({

    /*
     * Backbone's initializer called when an instance is created.
     * Sets container and data.
     */ 
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

    /*
     * Render visualization, set attributes and event listeners.
     * Called only when the data changes.
     */ 
    render: function() {
        this.renderSvgContainer();
        this.g.selectAll('path')
            .data(this.richGeoJson.features)
            .enter()
            .append('path');
        // Initial call to update attributes. This method may be used later as an inexpensive rerender 
        //   if the data doesn't change but its display does.
        this.setAttributes();
        this.attachFeatureEventListeners();
    },

    /*
     * Render the visualizations svg container and an inside group. 
     * Store these on the instance.
     */ 
    renderSvgContainer: function() {
        this.svg = d3.select(this.el).append('svg');
        this.g = this.svg.append('g');
    },


    /*
     * Set or update attributes. Called within render, and as a lightweight update method
     *   when the data doesn't change, but its presentation does (e.g. when a map is recolored).
     */
    setAttributes: function() {
        this.g.selectAll('path')
            .attr({
                d: this.getD3Path(),
                class: this.getFeatureClass.bind(this)
            });
    },

    /*
     * Return d3 path projection function.
     * Further optimization: cache for performance
     */
    getD3Path: function() {
        var projection = d3.geo.albersUsa(),
            path = d3.geo.path().projection(projection);
        return path;
    },

    /*
     * Get class name for a feature. 
     * Use _model references to have access to attributes and instance methods.
     */
    getFeatureClass: function(feature) {
        var model = feature._model,
            cls = (model != null && model.isRealBig()) ? 'active' : 'inactive';
        return cls;
    },

    /*
     * Feature event listener on mouse enter.
     *
     */
    onFeatureMouseEnter: function(feature) {
        var model = feature._model;
        this.trigger('summary:change', model.getSummary());
    },

    /*
     * Feature event listener on mouse leave.
     *
     */
    onFeatureMouseLeave: function(feature) {
        var model = feature._model;
        this.trigger('summary:change', '');
    },

    /*
     * Attach all feature event listeners.
     *
     */
    attachFeatureEventListeners: function() {
        this.g.selectAll('path')
            .on('mouseenter', this.onFeatureMouseEnter.bind(this))
            .on('mouseleave', this.onFeatureMouseLeave.bind(this));
    },

    /*
     * Remove all feature event listeners.
     */
    removeFeatureEventListeners: function() {
        this.g.selectAll('path')
            .off('mouseenter')
            .off('mouseleave');
    },

    /*
     * Destroys view by unbinding event listeners and removing dom elements.
     */
    destroy: function() {
        this.stopListening();
        this.selectAll('path').remove();
        this.g.remove();
        this.svg.remove();
    }

});