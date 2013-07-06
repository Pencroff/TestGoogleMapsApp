/**
 * Created with JetBrains WebStorm by Pencroff for TestGoogleMapsApp.
 * Date: 06.07.2013
 * Time: 10:58
 */

/*global define:true, $:true, google:true*/
define([
], function () {
    'use strict';
    var common = {
        initialize: function () {
        },
        roundSign: function (val, sign) {
            var signRounding,
                newVal;
            if (!sign) {
                sign = 5;
            }
            signRounding = Math.pow(10, sign);
            newVal = val * signRounding;
            newVal = Math.round(newVal);
            return newVal / signRounding;
        },
        getAddressByItem: function (list, item) {
            var result;
            $.each(list, function (index, value) {
                if (value.pos.equals(item.pos) && value.info.full === item.info.full) {
                    result = value;
                    return false;
                }
            });
            return result;
        },
        getAddressByPos: function (list, pos) {
            var result;
            $.each(list, function (index, value) {
                if (value.pos.equals(pos)) {
                    result = value;
                    return false;
                }
            });
            return result;
        },
        getAddressByLatLng: function (list, lat, lng) {
            var result;
            $.each(list, function (index, value) {
                if (value.pos.lat() === lat && value.pos.lng() === lng) {
                    result = value;
                    return false;
                }
            });
            return result;
        },
        getDrivingDistance: function (route) {
            var result = 0;
            $.each(route.legs, function (index, value) {
                result += value.distance.value;
            });
            return Math.round(result) / 1000;
        }
    };
    return common;
});