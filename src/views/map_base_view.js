/*
 * Extending from Marionette.Object provides an event system to view instances.
 */
var stg.MapItemsView = Marionette.Object.extend({

    initialize: function(options) {
        this.el = options.selector;
        this.$el = $(this.el);
        this.richGeoJson = options.richGeoJson;
    },

    render: function() {

    },

    renderSvgContainer: function() {

    },

    update: function() {

    },

    destroy: function() {

    }

});