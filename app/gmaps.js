/**
 * Created with JetBrains WebStorm by Pencroff for TestGoogleMapsApp.
 * Date: 05.07.2013
 * Time: 12:59
 */
/*global define:true, $:true, google:true*/
define([
    'jquery',
    'async!http://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry&sensor=false'
], function ($) {
    'use strict';
    var gmaps = {
        map: null,
        geocoder: null,
        curentLatLng: null,
        currentMarker: null,
        selectedMarker: null,
        addresses: [],
        initialize: function () {
            var me = this,
                mapOptions = { zoom: 12,
                    center: new google.maps.LatLng(41.9, 12.5),
                    mapTypeId: google.maps.MapTypeId.ROADMAP };
            me.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            me.geocoder = new google.maps.Geocoder();
            google.maps.event.addListener(me.map, 'click', function (e) {
                var latlng = e.latLng,
                    marker = me.makeMarker(latlng, 'Selected position');
                me.setMarker(marker);
                me.storeMarker(marker);
            });
        },
        makeLatLnd: function (latitude, longitude) {
            var latlng = new google.maps.LatLng(latitude, longitude);
            return latlng;
        },
        makeMarker: function (latlng, title) {
            var me = this,
                marker = new google.maps.Marker({
                    position: latlng,
                    title: title
                }),
                callback = function (data) {
                    var marker = this,
                        addresses = me.addresses,
                        pos = data.latLng,
                        infowindow;
                    $.each(addresses, function (index, value) {
                        if (value.pos === pos) {
                            infowindow = new google.maps.InfoWindow({
                                content: me.formatInfo(value.info)
                            });
                            infowindow.open(me.map, marker);
                        }
                    });
                };
            google.maps.event.addListener(marker, 'click', callback);
            me.setAddress(latlng);
            return marker;
        },
        showMarker: function (item) {
            var me = this,
                marker = new google.maps.Marker({
                    position: item.pos,
                    title: 'Selected position'
                }),
                callback = function (data) {
                    var marker = this,
                        infowindow = new google.maps.InfoWindow({
                            content: me.formatInfo(item.info)
                        });
                    infowindow.open(me.map, marker);
                };
            google.maps.event.addListener(marker, 'click', callback);
            me.setMarker(marker);
            me.storeMarker(marker);
        },
        setAddress: function (latlng) {
            var me = this,
                maxHistoryLenght = 100,
                result = {},
                mDistance = google.maps.geometry.spherical.computeDistanceBetween(me.curentLatLng, latlng),
                distance = Math.round(mDistance) / 1000,
                callback = function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        result.pos = latlng;
                        result.info = me.makeInfo(results, distance);
                        if (me.addresses.length > maxHistoryLenght) {
                            me.addresses.shift();
                        }
                        me.addresses.push(result);
                    } else {
                        console.warn('Geocode was not successful for the following reason: ' + status);
                    }
                };
            if (latlng) {
                me.geocoder.geocode({'location': latlng}, callback);
            }
        },
        setMarker: function (marker) {
            var me = this;
            if (marker) {
                marker.setMap(me.map);
            }
        },
        storeMarker : function (marker) {
            var me = this,
                oldMarker;
            if (me.selectedMarker) {
                oldMarker = me.selectedMarker;
                oldMarker.setMap(null);
                google.maps.event.clearInstanceListeners(oldMarker);
            }
            me.selectedMarker = marker;
        },
        makeCurrentPositionMarker: function () {
            var me = this,
                callback = function (pos) {
                    var marker;
                    if (pos) {
                        me.curentLatLng = me.makeLatLnd(pos.coords.latitude, pos.coords.longitude);
                        me.map.setCenter(me.curentLatLng);
                        marker = me.makeMarker(me.curentLatLng, 'Current position');
                        me.setMarker(marker);
                        me.currentMarker = marker;
                    }
                },
                errors = function (error) {
                    console.warn('ERROR(' + error.code + '): ' + error.message);
                };
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(callback, errors);
            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        },
        makeInfo: function (address, distance) {
            var result = {},
                full = '';
            result.distance = distance;
            $.each(address, function (addrIndex, addrValue) {
                var flag = false,
                    value;
                $.each(addrValue.types, function (index, value) {
                    if (value === 'street_address') {
                        value = addrValue.formatted_address;
                        result.address = value;
                        full += value + ' ';
                    }
                    if (value === 'administrative_area_level_3') {
                        value = addrValue.address_components[0].long_name;
                        result.area = value;
                        full += value + ' ';
                    }
                    if (value === 'locality') {
                        value = addrValue.formatted_address;
                        result.location = value;
                        full += value + ' ';
                    }
                });
            });
            return result;
        },
        formatInfo: function (info) {
            var result = '';
            if (info.address) {
                result += 'Address: ' + info.address + '<br>';
            }
            if (info.area) {
                result += 'Admin area: ' + info.area + '<br>';
            }
            if (info.location) {
                result += 'Location: ' + info.location + '<br>';
            }
            if (info.distance) {
                result += 'Distance from current position: ' + info.distance + ' km';
            }
            return result;
        },
        getAdresses : function () {
            var me = this;
            return me.addresses;
        }
    };
    return gmaps;
});