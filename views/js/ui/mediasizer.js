/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA;
 *
 */


/**
 * @author Dieter Raber <dieter@taotesting.com>
 * @requires jquery
 * @requires core/pluginifier
 *
 * @deprecated instead use ui/mediaEditor/mediaSizer
 */
define([
    'jquery',
    'lodash',
    'core/pluginifier',
    'tpl!ui/mediasizer/mediasizer',
    'nouislider',
    'ui/tooltip'
], function ($, _, Pluginifier, tpl) {
    'use strict';

    var ns = 'mediasizer';
    var dataNs = 'ui.' + ns;
    var MediaSizer;

    /**
     * default setup
     *
     * optional values are:
     * width | naturalWidth (alias)
     * height | naturalHeight (alias)
     * maxWidth
     * parentSelector
     *
     * @type {Object}
     */
    var defaults = {
        disableClass: 'disabled',
        applyToMedium: true,
        denyCustomRatio: true,
        responsive: true,
        showResponsiveToggle: true,
        showReset: true,
        showSync: true
    };


    /**
     * Round a decimal value to n digits
     *
     * @param {number} value
     * @param {int} precision
     * @returns {number}
     * @private
     */
    function _round(value, precision) {
        var factor = Math.pow(10, precision);
        return Math.round(value * factor) / factor;
    }


    /**
     * The MediaSizer component, that helps you to show/hide an element
     * @exports ui/toggler
     */
    MediaSizer = {

        /**
         * Returns width, height, target element and the reset button
         * It's meant to be used when triggering an event
         *
         * @param $elt
         * @param options
         * @returns {{}}
         * @private
         */
        _publicArgs: function ($elt, options) {
            var params = this._getValues($elt);
            params.$target = options.target || $();
            params.$resetBtn = options.$resetBtn;
            return params;
        },

        /**
         * Creates object that contains all size related data of the medium (= image, video, etc.)
         *
         * @param $elt
         * @returns {{px: {natural: {width: (number|*), height: (number|*)}, current: {width: *, height: *}}, %: {natural: {width: number, height: null}, current: {width: number, height: null}}, ratio: {natural: number, current: number}, containerWidth: , sliders: {%: {min: number, max: number, start: number}, px: {min: number, max: number, start: *}}, currentUnit: string}}
         * @private
         */
        _getSizeProps: function ($elt) {

            var options = $elt.data(dataNs),
                $medium,
                naturalWidth,
                naturalHeight,
                containerWidth,
                displaySize,
                minWidth = _.isNumber(options.minWidth) ? options.minWidth : 0,
                maxWidth;

            if(options.hasTarget) {
                $medium = options.target;
                displaySize = $medium[0].getBoundingClientRect();
                options.width = displaySize.width;
                options.height = displaySize.height;
                naturalWidth = $medium[0].naturalWidth || options.width;
                naturalHeight = $medium[0].naturalHeight || options.height;

                containerWidth = (function() {
                    var $parentContainer = options.parentSelector ?
                        $medium.parents(options.parentSelector) :
                        $medium.parent().parent(),
                        _maxWidth;

                    if(options.maxWidth){
                        return options.maxWidth;
                    }

                    _maxWidth = $parentContainer.css('max-width');

                    if(_maxWidth !== 'none'){
                        return parseInt(_maxWidth);
                    }
                    return $parentContainer.innerWidth();
                }());
            }
            else {
                // init() already makes sure width and height exist at this point
                naturalWidth = options.width;
                naturalHeight = options.height;
                containerWidth = options.maxWidth || options.width;
            }

            maxWidth = Math.max(containerWidth, naturalWidth);

            return {
                px: {
                    //original values for all media
                    natural: {
                        width: naturalWidth,
                        height: naturalHeight
                    },
                    current: {
                        width: options.width,
                        height: options.height
                    }
                },
                '%': {
                    natural: {
                        width: 100,
                        height: null
                    },
                    current: {
                        width: options.width * 100 / containerWidth,
                        height: null // height does not work on % - this is just in case you have to loop or something
                    }
                },
                ratio: {
                    natural: naturalWidth / naturalHeight,
                    current: options.width / options.height
                },
                containerWidth: containerWidth,
                sliders: {
                    '%': {
                        min: minWidth * 100 / maxWidth,
                        max: 100,
                        start: options.width * 100 / containerWidth
                    },
                    px: {
                        min: minWidth,
                        max: maxWidth,
                        start: +options.width
                    }
                },
                currentUnit: '%'
            };

        },

        /**
         * Toggle width/height synchronization
         *
         * @param $elt
         * @returns {*}
         * @private
         */
        _initSyncBtn: function ($elt) {
            var options = $elt.data(dataNs),
                $mediaSizer = $elt.find('.media-sizer'),
                self = this,
                $syncBtn = $elt.find('.media-sizer-sync');

            if(!options.showSync) {
                $syncBtn.hide();
                $mediaSizer.addClass('media-sizer-sync-off');
            }
            // this stays intact even if hidden in case it will be
            // displayed from somewhere else
            $syncBtn.on('click', function () {
                $mediaSizer.toggleClass('media-sizer-synced');
                options.syncDimensions = $mediaSizer.hasClass('media-sizer-synced');
                if (options.syncDimensions) {
                    self._sync($elt, options.$fields.px.width, 'blur');
                }
            });
            return $syncBtn;
        },


        /**
         * Button to reset the size to its original values
         *
         * @param $elt
         * @returns {*}
         * @private
         */
        _initResetBtn: function($elt) {
            var options = $elt.data(dataNs),
                $resetBtn = $elt.find('.media-sizer-reset');

            if(!options.showReset) {
                $elt.find('.media-sizer').addClass('media-sizer-reset-off');
            }

            // this stays intact even if hidden in case it will be
            // displayed from somewhere else
            $resetBtn.on('click', function() {
                // this will take care of all other size changes
                options.$fields.px.width.val(options.originalSizeProps.px.current.width).trigger('sliderchange');
            });
            return $resetBtn;
        },


        /**
         * Blocks are the two different parts of the form (either width|height or size)
         *
         * @param $elt
         * @returns {{}}
         * @private
         */
        _initBlocks: function ($elt) {
            var options = $elt.data(dataNs),
                _blocks = {},
                $responsiveToggleField = $elt.find('.media-mode-switch'),
                self = this,
                _checkMode = function () {
                    if ($responsiveToggleField.is(':checked')) {
                        _blocks.px.hide();
                        _blocks['%'].show();
                        options.sizeProps.currentUnit = '%';
                        if (options.$fields && options.$fields['%'].width.val() > options.sizeProps.sliders['%'].max) {
                            options.$fields['%'].width.val(options.sizeProps.sliders['%'].max);
                            self._sync($elt, options.$fields['%'].width, 'blur');
                        }
                    }
                    else {
                        _blocks['%'].hide();
                        _blocks.px.show();
                        options.sizeProps.currentUnit = 'px';
                    }
                };

            if(!options.showResponsiveToggle) {
                $elt.find('.media-sizer').addClass('media-sizer-responsivetoggle-off');
            }

            _(['px', '%']).forEach(function (unit) {
                _blocks[unit] = $elt.find('.media-sizer-' + (unit === 'px' ? 'pixel' : 'percent'));
                _blocks[unit].prop('unit', unit);
                _blocks[unit].find('input').data('unit', unit).after($('<span>', {
                    'class': 'unit-indicator',
                    text: unit
                }));
            });

            $responsiveToggleField.on('click', function () {
                _checkMode();
                $elt.trigger('responsiveswitch.' + ns, [$responsiveToggleField.is(':checked')]);
                $elt.trigger('sizechange.' + ns, self._publicArgs($elt, options));
            });

            //initialize it properly
            _checkMode();

            return _blocks;
        },


        /**
         * Initialize the two sliders, one based on pixels the other on percentage
         *
         * @param $elt
         * @returns {{}}
         * @private
         */
        _initSliders: function ($elt) {

            var options = $elt.data(dataNs),
                _sliders = {};

            _(options.$blocks).forOwn(function ($block, unit) {
                _sliders[unit] = $block.find('.media-sizer-slider');
                _sliders[unit].prop('unit', unit);
                _sliders[unit].noUiSlider({
                    start: options.sizeProps.sliders[unit].start,
                    range: {
                        'min': options.sizeProps.sliders[unit].min,
                        'max': options.sizeProps.sliders[unit].max
                    }
                })
                    .on('slide', function () {
                        var $slider = $(this),
                            _unit = $slider.prop('unit');

                        options.$fields[_unit].width.val(_round($slider.val(), 0)).trigger('sliderchange');
                    });
            });

            return _sliders;
        },

        /**
         * Synchronize all parameters
         *
         * @param $elt
         * @param $field
         * @param eventType
         * @private
         */
        _sync: function ($elt, $field, eventType) {
            var self = this;

            var options = $elt.data(dataNs),
                unit = $field.prop('unit'),
                dimension = $field.prop('dimension'),
                value = parseFloat($field.val()),
                heightValue,
                ratio,
                otherBlockUnit,
                otherBlockWidthValue,
                otherBlockHeightValue,
                currentValues;

            eventType = eventType === 'sliderchange' ? 'sliderEvent' : 'fieldEvent';

            // invalid entries
            if (isNaN(value)) {
                return;
            }

            // Re-calculate current ratio
            // change scenario: someone has typed height and width in pixels while syncing was off
            // whether current or natural ratio eventually will be used depends on options.denyCustomRatio
            if (options.sizeProps.px.current.width > 0 && options.sizeProps.px.current.height > 0) {
                options.sizeProps.ratio.current = options.sizeProps.px.current.width / options.sizeProps.px.current.height;
            }
            ratio = options.denyCustomRatio ? options.sizeProps.ratio.natural : options.sizeProps.ratio.current;
            ratio = ratio ? ratio : 1;

            // There is only one scenario where dimension != width: manual input of the height in px
            // this is treated here separately because then we just need to deal with widths below
            if (dimension === 'height' && unit === 'px') {
                options.sizeProps.px.current.height = value;
                if (options.syncDimensions) {
                    options.sizeProps.px.current.width = value * ratio;
                    options.sizeProps.ratio.current = options.sizeProps.px.current.width / options.sizeProps.px.current.height;
                    options.$fields.px.width.val(_round(options.sizeProps.px.current.width, 0));

                    // now all values can be set to the width since width entry is now the only scenario
                    value = parseFloat(options.$fields.px.width.val());
                }
                else {
                    options.sizeProps['%'].current.height = null;
                    // update medium
                    if (options.applyToMedium) {
                        currentValues = this._getValues($elt);
                        options.target.attr('width', currentValues.width);
                        options.target.attr('height', currentValues.height);
                    }
                    $elt.trigger('sizechange.' + ns, this._publicArgs($elt, options));
                    return;
                }
            }
            // *** as of here we can be sure that the dimension is 'width' *** //


            // remember that heightValue and otherUnit work _not_ on the same block
            if (unit === 'px') {
                otherBlockUnit = '%';
                otherBlockWidthValue = value * 100 / options.sizeProps.containerWidth;
            }
            else {
                otherBlockUnit = 'px';
                otherBlockWidthValue = value * options.sizeProps.containerWidth / 100;
            }

            // update the unit-side of the tree with the value
            options.sizeProps[unit].current.width = value;
            options.sizeProps[otherBlockUnit].current.width = otherBlockWidthValue;

            // update the height fields of the same and of the other block
            if (options.syncDimensions) {
                heightValue = value / ratio;
                otherBlockHeightValue = otherBlockWidthValue / ratio;
                //same block
                options.sizeProps[unit].current.height = heightValue;
                options.$fields[unit].height.val(_round(heightValue, 0));
                //other block
                options.sizeProps[otherBlockUnit].current.height = otherBlockHeightValue;
                options.$fields[otherBlockUnit].height.val(_round(otherBlockHeightValue, 0));
            }

            /* sliders */
            // update same slider value only when fn is triggered by typing
            if (eventType !== 'sliderEvent') {
                options.$sliders[unit].val(value);
            }
            // update other slider
            options.$sliders[otherBlockUnit].val(otherBlockWidthValue);

            // update other width field
            options.$fields[otherBlockUnit].width.val(_round(otherBlockWidthValue, 0));

            // reset percent height to null
            options.sizeProps['%'].current.height = null;

            // update medium
            if (options.applyToMedium) {
                currentValues = this._getValues($elt);
                options.target.attr('width', currentValues.width);
                options.target.attr('height', currentValues.height || 'auto');
            }
            $elt.trigger('sizechange.' + ns, self._publicArgs($elt, options));
        },


        /**
         * Initialize the fields
         *
         * @param $elt
         * @returns {{}}
         * @private
         */
        _initFields: function ($elt) {

            var options = $elt.data(dataNs),
                dimensions = ['width', 'height'],
                field, _fields = {},
                self = this;

            _(options.$blocks).forOwn(function ($block, unit) {
                _fields[unit] = {};

                options.$blocks[unit].find('input').each(function () {
                    _(dimensions).forEach(function (dim) {
                        field = options.$blocks[unit].find('[name="' + dim + '"]');
                        // there is no 'height' field for % - $('<input>') is a dummy to avoid checking if the field exists all the time
                        _fields[unit][dim] = field.length ? field : $('<input>');
                        _fields[unit][dim].prop({
                            unit: unit,
                            dimension: dim
                        });
                        _fields[unit][dim].val(_round(options.sizeProps[unit].current[dim], 0));
                        _fields[unit][dim].data({ min: 0, max: options.sizeProps.sliders[unit].max });

                        _fields[unit][dim].on('keydown', function (e) {
                            var $field = $(this),
                                c = e.keyCode,
                                specChars = (function () {
                                    var chars = [8, 37, 39, 46];
                                    if ($field.val().indexOf('.') === -1) {
                                        chars.push(190);
                                        chars.push(110);
                                    }
                                    return chars;
                                }());

                            return (_.contains(specChars, c) ||
                                (c >= 48 && c <= 57) ||
                                (c >= 96 && c <= 105));
                        });

                        _fields[unit][dim].on('keyup blur sliderchange', function (e) {
                            var $field = $(this),
                                value = $field.val().replace(/,/g, '.');

                            $field.val(value);

                            if (value > $field.data('max')) {
                                $field.val($field.data('max'));
                            }
                            else if (value < $field.data('min')) {
                                $field.val($field.data('min'));
                            }

                            self._sync($elt, $(this), e.type);
                        });
                    });
                });
            });

            return _fields;
        },


        /**
         * Retrieve current size values in current unit
         *
         * @param $elt
         * @returns {{}}
         * @private
         */
        _getValues: function ($elt) {

            var options = $elt.data(dataNs),
                attr = {};

            _.forOwn(options.sizeProps[options.sizeProps.currentUnit].current, function (value, dimension) {
                if (_.isNull(value)) {
                    value = '';
                }
                else {
                    value = _round(value, 0).toString();
                }
                if (options.sizeProps.currentUnit === '%' && value !== '') {
                    value += options.sizeProps.currentUnit;
                }
                attr[dimension] = value;
            });
            return attr;
        },


        /**
         * Initialize the plugin.
         *
         * Called the jQuery way once registered by the Pluginifier.

         * @example $('selector').mediaSizer({target : $('target') });
         * @public
         *
         * @constructor
         * @returns {*}
         */
        init: function (options) {

            //get options using default
            options = $.extend(true, {}, defaults, options);

            return this.each(function () {
                var $elt = $(this);

                options.hasTarget = options.target && options.target.length;

                // compatibility layer naturalWidth|Height vs. naturalHeight
                // internally width/height are used
                options.width         = options.width         || options.naturalWidth;
                options.height        = options.height        || options.naturalHeight;
                options.naturalWidth  = options.naturalWidth  || options.width;
                options.naturalHeight = options.naturalHeight || options.height;

                options.hasSize = options.width && options.height && _.isFinite(+options.width) && _.isFinite(+options.height);

                // incomplete or conflicting configurations
                // no target provided, also no width and/or no height
                if(!options.hasTarget && !options.hasSize) {
                    throw new Error('MediaSizer::init() You must either set width and height or a target element');
                }

                // no target provided, but applyToMedium = true
                else if(!options.hasTarget && options.applyToMedium) {
                    throw new Error('MediaSizer::init() options.applyToMedium can only be true if a target element is provided');
                }

                // target quietly takes precedence over width and height
                else if(options.hasTarget && options.hasSize) {
                    delete options.width;
                    delete options.height;
                    options.hasSize = false;
                }

                if (!$elt.data(dataNs)) {

                    $elt.html(tpl({
                        responsive: (typeof options.responsive !== 'undefined') ? !!options.responsive : true
                    }));

                    //add data to the element
                    $elt.data(dataNs, options);

                    options.sizeProps = MediaSizer._getSizeProps($elt);
                    options.originalSizeProps = _.cloneDeep(options.sizeProps);

                    options.syncDimensions = $elt.find('.media-sizer').hasClass('media-sizer-synced');

                    options.$blocks = MediaSizer._initBlocks($elt);
                    options.$fields = MediaSizer._initFields($elt);
                    options.$sliders = MediaSizer._initSliders($elt);

                    options.$syncBtn = MediaSizer._initSyncBtn($elt);
                    options.$resetBtn = MediaSizer._initResetBtn($elt);


                    /**
                     * The plugin has been created
                     * @event MediaSizer#create.toggler
                     */
                    $elt.trigger('create.' + ns, MediaSizer._publicArgs($elt, options));
                }
            });
        },


        /**
         * Destroy the plugin completely.
         * Called the jQuery way once registered by the Pluginifier.
         *
         * @example $('selector').toggler('destroy');
         * @public
         */
        destroy: function () {
            this.each(function () {
                var $elt = $(this);

                /**
                 * The plugin have been destroyed.
                 * @event MediaSizer#destroy.toggler
                 */
                $elt.trigger('destroy.' + ns);
            });
        }
    };

    //Register the toggler to behave as a jQuery plugin.
    Pluginifier.register(ns, MediaSizer);

});
