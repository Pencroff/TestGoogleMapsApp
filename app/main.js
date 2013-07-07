/**
 * Created with JetBrains WebStorm by Pencroff for TestGoogleMapsApp.
 * Date: 05.07.2013
 * Time: 11:49
 */

/*global require:true*/

require.config({
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    //urlArgs: 'cb=' + Math.random(),
    //urlArgs: 'ver=' + 3,
    shim: {
    },
    paths: {
        async: '/js/async',
        jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min'
    }
});

require([
    'gmaps',
    'history',
    'jquery'
], function (gmaps, history) {
    "use strict";
    gmaps.initialize();
    gmaps.makeCurrentPositionMarker();
    history.initialize(gmaps);
});