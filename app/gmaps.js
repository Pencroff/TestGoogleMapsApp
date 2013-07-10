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
        drivingPath: null,
        directionsService: null,
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
            me.drivingPath = new google.maps.Polyline({
                strokeColor: '#2F96B4',
                strokeOpacity: 0.8,
                strokeWeight: 4
            });
            me.directionsService = new google.maps.DirectionsService();
            me.drivingPath.setMap(me.map);
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
            $(me).trigger('update-history');
        },
        setAddress: function (marker) {
            var me = this,
                latlng = marker.getPosition(),
                result = {pos: {}, info: {}},
                addr,
                mDistance = google.maps.geometry.spherical.computeDistanceBetween(me.curentLatLng, latlng),
                distance = Math.round(mDistance) / 1000,
                callback = function (results, status) {
                    var dirRequest = {
                            origin: me.curentLatLng,
                            destination: latlng,
                            travelMode: google.maps.DirectionsTravelMode.DRIVING
                        },
                        dirCallback = function (response, status) {
                            if (status === google.maps.DirectionsStatus.OK) {
                                //directionsDisplay.setDirections(response);
                                result.info.route = response.routes[0].overview_path;
                                result.info.drivingDistance = common.getDrivingDistance(response.routes[0]);
                                me.storeAddress(result);
                                me.drivingPath.setVisible(true);
                                me.drivingPath.setPath(result.info.route);
                            }
                        };
                    if (status === google.maps.GeocoderStatus.OK) {
                        result.pos = latlng;
                        result.info = me.makeInfo(results, distance);
                        if (!me.curentLatLng.equals(latlng)) {
                            me.directionsService.route(dirRequest, dirCallback);
                        }
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
                result = {pos: {}, info: {}},
                resultArray = [],
                mDistance,
                distance,
                callbackGeocoder = function (results, status) {
                    var dirRequest = {
                            origin: me.curentLatLng,
                            destination: null,
                            travelMode: google.maps.DirectionsTravelMode.DRIVING
                        },
                        dirCallback = function (response, status) {
                            if (status === google.maps.DirectionsStatus.OK) {
                                //directionsDisplay.setDirections(response);
                                result.info.route = response.routes[0].overview_path;
                                result.info.drivingDistance = common.getDrivingDistance(response.routes[0]);
                                me.drivingPath.setVisible(true);
                                me.drivingPath.setPath(result.info.route);
                                if (callback) {
                                    callback.call(context, resultArray);
                                }
                            }
                        };
                    if (status === google.maps.GeocoderStatus.OK) {
                        result.pos = results[0].geometry.location;
                        mDistance = google.maps.geometry.spherical.computeDistanceBetween(me.curentLatLng, result.pos);
                        distance = Math.round(mDistance) / 1000;
                        result.info = me.makeInfo(results, distance);
                        me.storeAddress(result);
                        resultArray.push(result);
                        dirRequest.destination = result.pos;
                        me.directionsService.route(dirRequest, dirCallback);
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
                if (value.info.full.indexOf(query.toLowerCase()) !== -1) {
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
        makeMarker: function (latlng, title) {
            var me = this,
                marker = new google.maps.Marker({
                    position: latlng,
                    title: title
                }),
                callback = function (data) {
                    var marker = this,
                        clickPos = data.latLng,
                        addr;
                    addr = me.getAddressByPos(clickPos);
                    if (addr) {
                        me.showInfoWindow(addr, marker, me);
                    }
                };
            google.maps.event.addListener(marker, 'click', callback);
            me.setAddress(marker);
            return marker;
        },
        showMarker: function (item) {
            var me = this,
                marker = new google.maps.Marker({
                    position: item.pos,
                    title: 'Selected position'
                }),
                callback = function (data) {
                    me.showInfoWindow(item, marker, me);
                };
            google.maps.event.addListener(marker, 'click', callback);
            me.setMarker(marker);
            me.showInfoWindow(item, marker, me);
            me.storeMarker(marker);
            if (item.info.route) {
                me.drivingPath.setVisible(true);
                me.drivingPath.setPath(item.info.route);
            } else {
                me.drivingPath.setVisible(false);
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
            me.fitMap();
        },
        fitMap: function () {
            var me = this,
                bounds = new google.maps.LatLngBounds();
            bounds.extend(me.curentLatLng);
            bounds.extend(me.selectedMarker.getPosition());
            me.map.fitBounds(bounds);
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
        showInfoWindow: function (addr, marker, context) {
            var infowindow = new google.maps.InfoWindow({
                    content: context.formatInfo(addr.info)
                });
            infowindow.open(context.map, marker);
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
            result.full = full.toLowerCase();
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
                result += 'Distance from current position: ' + info.distance + ' km' + '<br>';
            }
            if (info.drivingDistance) {
                result += 'Distance by car: ' + info.drivingDistance + ' km';
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
                array = JSON.parse(value),
                convertToLatLng = function (item) {
                    var posArray = $.map(item, function (value, key) { return value; });
                    return me.makeLatLnd(posArray[0], posArray[1]);
                };
            $.each(array, function (index, value) {
                value.pos = convertToLatLng(value.pos);
                if (value.info.route) {
                    value.info.route = $.map(value.info.route, function (value, index) {
                        return convertToLatLng(value);
                    });
                }
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