/**
 * Created with JetBrains WebStorm by Pencroff for TestGoogleMapsApp.
 * Date: 05.07.2013
 * Time: 23:20
 */

/*global define:true, $:true, google:true*/
define([
    'jquery',
    'common'
], function ($, common) {
    'use strict';
    var history = {
        gmaps: null,
        resultBlock: null,
        resultTable: null,
        inputDesktop: null,
        inputPhone: null,
        initialize: function (gmaps) {
            var me = this,
                resultBlock = $('#search-result'),
                resultTable = $('#search-result-table'),
                saveBtn = $('#save-history'),
                clearBtn = $('#clear-cache'),
                desktopInput = $('#notPhoneInput'),
                phoneInput = $('#phoneInput');
            me.gmaps = gmaps;
            me.resultBlock = resultBlock;
            me.resultTable = resultTable;
            me.inputDesktop = desktopInput;
            me.inputPhone = phoneInput;
            $('form').submit(me, me.search);
            saveBtn.click(me, me.saveHistory);
            clearBtn.click(me, me.clearCache);
            desktopInput.change(me, me.copyDataBetweenInputs);
            phoneInput.change(me, me.copyDataBetweenInputs);
            resultBlock.hide();
            if (me.gmaps.hasLocalStorage()) {
                if (!me.gmaps.hasCache()) {
                    clearBtn.addClass('disabled');
                }
            } else {
                saveBtn.hide();
                clearBtn.hide();
            }
        },
        search: function (event) {
            var me = event.data,
                fieldValue = $('#notPhoneInput').val();
            event.preventDefault();
            if (!fieldValue) {
                me.gmaps.getAdressList(me, me.fillSearchResult);
            } else {
                me.gmaps.getAdressListByStr(fieldValue, me, me.fillSearchResult);
            }
        },
        fillSearchResult : function (list) {
            var me = this,
                tbl = me.resultTable,
                tbody = tbl.find('tbody'),
                tableStr = '';
            me.removeAllRows(tbl);
            me.resultBlock.show();
            $.each(list, function (index, value) {
                tableStr += me.itemToHtml(value);
            });
            tbody.html(tableStr);
            $('#search-result-table tbody tr').bind('click', me, me.rowClick);
        },
        saveHistory: function (event) {
            var me = event.data;
            me.gmaps.saveHistory();
            $('#clear-cache').removeClass('disabled');
        },
        clearCache: function (event) {
            var me = event.data;
            me.gmaps.clearCache();
            $('#clear-cache').addClass('disabled');
        },
        rowClick: function (event) {
            var me = event.data,
                val = $(this).attr('data-pos'),
                array = val.split(','),
                lat = parseFloat(array[0]),
                lng = parseFloat(array[1]),
                gmaps = me.gmaps,
                addr;
            addr = gmaps.getAddressByLatLng(lat, lng);
            if (addr) {
                gmaps.showMarker.call(gmaps, addr);
            }
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
                info = item.info;
            if (pos) {
                result += '<td>(' + lat.toFixed(5) + ', ' + lng.toFixed(5) + ')</td>';
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
        },
        copyDataBetweenInputs: function (event) {
            var me = event.data,
                id = event.currentTarget.id,
                value = event.currentTarget.value;
            if (id === 'notPhoneInput') {
                me.inputPhone.val(value);
            } else {
                me.inputDesktop.val(value);
            }
        }
    };
    return history;
});
