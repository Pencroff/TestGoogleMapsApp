/**
 * Created with JetBrains WebStorm by Pencroff for TestGoogleMapsApp.
 * Date: 05.07.2013
 * Time: 12:59
 */
/*global define:true, $:true, google:true*/
define([
    'jquery',
    'common',
    'async!http://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry&sensor=false'
], function ($, common) {
    'use strict';
    var gmaps = {
        keyStorage: 'history-points-storage',
        map: null,
        geocoder: null,
        curentLatLng: null,
        currentMarker: null,
        selectedMarker: null,
        addresses: [],
        initialize: function () {
            var me = this,
                mapOptions = { zoom: 15,
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
            if (me.hasLocalStorage() && me.hasCache()) {
                me.addresses = me.loadHistory();
            }
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
                        clickPos = data.latLng,
                        pos,
                        infowindow;
                    pos = me.getAddressByPos(clickPos);
                    if (pos) {
                        infowindow = new google.maps.InfoWindow({
                            content: me.formatInfo(pos.info)
                        });
                        infowindow.open(me.map, marker);
                    }
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
        storeAddress: function (item) {
            var me = this,
                maxHistoryLenght = 100,
                addr = common.getAddressByItem(me.addresses, item);
            if (addr) {
                return;
            }
            if (me.addresses.length > maxHistoryLenght) {
                me.addresses.shift();
            }
            me.addresses.push(item);
        },
        setAddress: function (latlng) {
            var me = this,
                result = {},
                addr,
                mDistance = google.maps.geometry.spherical.computeDistanceBetween(me.curentLatLng, latlng),
                distance = Math.round(mDistance) / 1000,
                callback = function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        result.pos = latlng;
                        result.info = me.makeInfo(results, distance);
                        me.storeAddress(result);
                    } else {
                        console.warn('Geocode was not successful for the following reason: ' + status);
                    }
                };
            if (latlng) {
                addr = common.getAddressByPos(me.addresses, latlng);
                if (!addr) {
                    me.geocoder.geocode({'location': latlng}, callback);
                }
            }
        },
        getAddressFromGeocoder: function (query, context, callback) {
            var me = this,
                result = {},
                resultArray = [],
                mDistance,
                distance,
                callbackGeocoder = function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        result.pos = results[0].geometry.location;
                        mDistance = google.maps.geometry.spherical.computeDistanceBetween(me.curentLatLng, result.pos);
                        distance = Math.round(mDistance) / 1000;
                        result.info = me.makeInfo(results, distance);
                        me.storeAddress(result);
                        resultArray.push(result);
                        if (callback) {
                            callback.call(context, resultArray);
                        }
                    } else {
                        console.warn('Geocode was not successful for the following reason: ' + status);
                    }
                };
            me.geocoder.geocode({'address': query}, callbackGeocoder);
        },
        getAddressByPos: function (pos) {
            var me = this,
                result;
            if (pos) {
                result = common.getAddressByPos(me.addresses, pos);
            }
            return result;
        },
        getAddressByLatLng: function (lat, lng) {
            var me = this,
                result;
            if ($.isNumeric(lat) && $.isNumeric(lng)) {
                result = common.getAddressByLatLng(me.addresses, lat, lng);
            }
            return result;
        },
        getAdressList : function (context, callback) {
            var me = this;
            if (callback) {
                callback.call(context, me.addresses);
            }
        },
        getAdressListByStr : function (query, context, callback) {
            var me = this,
                resultArray = [];
            $.each(me.addresses, function (index, value) {
                if (value.info.full.indexOf(query) !== -1) {
                    resultArray.push(value);
                }
            });
            if (resultArray.length === 0) {
                me.getAddressFromGeocoder(query, context, callback);
            } else {
                if (callback) {
                    callback.call(context, resultArray);
                }
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
            result.distance = distance;
            result.full = full;
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
        // local storage
        hasLocalStorage: function () {
            var me = this,
                keyTst = 'testLocalStorage';
            try {
                localStorage.setItem(keyTst, keyTst);
                localStorage.removeItem(keyTst);
                return true;
            } catch (e) {
                return false;
            }
        },
        hasCache: function () {
            var me = this,
                value = localStorage.getItem(me.keyStorage),
                result = false;
            if (value) {
                result = true;
            }
            return result;
        },
        loadHistory: function () {
            var me = this,
                value = localStorage.getItem(me.keyStorage),
                array = JSON.parse(value);
            $.each(array, function (index, value) {
                var posArray = $.map(value.pos, function (value, key) { return value; });
                value.pos = me.makeLatLnd(posArray[0], posArray[1]);
            });
            return array;
        },
        saveHistory: function () {
            var me = this;
            localStorage.setItem(me.keyStorage, JSON.stringify(me.addresses));
        },
        clearCache: function () {
            var me = this;
            localStorage.removeItem(me.keyStorage);
        }
    };
    return gmaps;
});