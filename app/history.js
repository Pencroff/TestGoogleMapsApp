/**
 * Created with JetBrains WebStorm by Pencroff for TestGoogleMapsApp.
 * Date: 05.07.2013
 * Time: 23:20
 */

/*global define:true, $:true, google:true*/
define([
    'jquery'
], function ($) {
    'use strict';
    var history = {
        gmaps: null,
        resultBlock: null,
        resultTable: null,
        initialize: function (gmaps) {
            var me = this,
                resultBlock = $('#search-result'),
                resultTable = $('#search-result-table'),
                searchBtn = $('.search-btn');
            me.gmaps = gmaps;
            me.resultBlock = resultBlock;
            me.resultTable = resultTable;
            searchBtn.click(me, me.search);
            resultBlock.hide();
        },
        search: function (event) {
            var me = event.data,
                tbl = me.resultTable,
                tableStr = '',
                tbody = tbl.find('tbody'),
                addrs = me.gmaps.getAdresses();
            me.removeAllRows(tbl);
            me.resultBlock.show();
            $.each(addrs, function (index, value) {
                tableStr += me.itemToHtml(value);
            });
            tbody.html(tableStr);
            $('#search-result-table tbody tr').bind('click', me, me.rowClick);
        },
        rowClick: function (event) {
            var me = event.data,
                val = $(this).attr('data-pos'),
                array = val.split(','),
                lat = parseFloat(array[0]),
                lng = parseFloat(array[1]),
                gmaps = me.gmaps,
                addresses = gmaps.getAdresses();
            $.each(addresses, function (index, value) {
                if (value.pos.lat() === lat && value.pos.lng() === lng) {
                    gmaps.showMarker.call(gmaps, value);
                }
            });
        },
        removeAllRows: function () {
            var me = this,
                tbl = me.resultTable,
                tbody;
            $('#search-result-table tbody tr').unbind();
            tbl.find('tbody').empty();
        },
        itemToHtml: function (item) {
            var pos = item.pos,
                lat = pos.lat(),
                lng = pos.lng(),
                result = '<tr data-pos="' + lat + ',' + lng + '">',
                roundValue = function (val) {
                    var signRounding = 10000,
                        newVal = val * signRounding;
                    newVal = Math.round(newVal);
                    return newVal / signRounding;
                },
                info = item.info;
            if (pos) {
                result += '<td>(' + roundValue(lat) + ', ' + roundValue(lng) + ')</td>';
            } else {
                result += '<td></td>';
            }
            if (info.address) {
                result += '<td>' + info.address + '</td>';
            } else {
                result += '<td></td>';
            }
            if (info.location) {
                result += '<td>' + info.location + '</td>';
            } else {
                result += '<td></td>';
            }
            if (info.distance) {
                result += '<td>' + info.distance + ' km</td>';
            } else {
                result += '<td></td>';
            }
            result += '</tr>';
            return result;
        }
    };
    return history;
});