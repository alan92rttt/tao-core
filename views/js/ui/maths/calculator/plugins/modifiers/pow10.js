/**
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
 * Copyright (c) 2019 Open Assessment Technologies SA ;
 */
/**
 * Plugin that multiplies the current operand by 10^x.
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'lodash',
    'i18n',
    'util/namespace',
    'ui/maths/calculator/core/plugin',
    'ui/maths/calculator/core/tokens'
], function (_, __, nsHelper, pluginFactory, tokensHelper) {
    'use strict';

    var pluginName = 'pow10';

    /**
     * The basic `10^x` expression.
     * @type {String}
     */
    var termsPow10 = '10^';

    /**
     * The multiply by `10^x` expression.
     * @type {String}
     */
    var termsMulByPow10 = '*' + termsPow10;

    return pluginFactory({
        name: pluginName,

        /**
         * Called when the plugin is installing in its host.
         */
        install: function install() {
            this.getCalculator()
                .setCommand('pow10', __('Power of 10'), __('Multiply the value by 10^x'));
        },

        /**
         * Called when the plugin should be initialized.
         */
        init: function init() {
            var calculator = this.getCalculator();

            // insert the sub-expression based on strategies
            calculator
                .on(nsHelper.namespaceAll('command-pow10', pluginName), function () {
                    var position = calculator.getPosition();
                    var tokens = calculator.getTokens();
                    var index = calculator.getTokenIndex();
                    var token = tokens[index] || null;
                    var prevToken = tokens[index - 1] || null;
                    var nextToken = tokens[index + 1] || null;
                    var aligned = false;

                    if (token) {
                        // refine the current position, as it should be either on the start or the end of the token
                        aligned = token.offset === position;
                        if (token.type === 'MUL') {
                            if (aligned) {
                                // the "multiply" operator is a special case, as it is part of the complete expression,
                                // so if it is already there, we consider to use it, and move the position just after
                                calculator.setPosition(position + token.value.length);
                                aligned = false;
                            }
                        } else if (!aligned) {
                            // the strategy is to consider the position is in front of the token,
                            // the allowed exception is when the position is the last one
                            if (nextToken || position < token.offset + token.value.length) {
                                calculator.setPosition(token.offset);
                                aligned = true;
                            }
                        }
                    }

                    // empty expression or 0
                    if (tokens.length <= 1 && !token || token.type === 'NUM0') {
                        calculator.replace(termsPow10);
                    }
                    // no token before, or the previous one is either an operator or a function, so no need to add the
                    // "multiply" operator to link to the inserted expression
                    else if (
                        (!aligned && (tokensHelper.isOperator(token) || (token && token.type === 'LPAR'))) ||
                        (aligned && (
                            index === 0 ||
                            tokensHelper.isFunction(prevToken) ||
                            (tokensHelper.isSeparator(prevToken) && prevToken.type !== 'RPAR')
                        ))
                    ) {
                        calculator.insert(termsPow10);
                    }
                    // all other cases, that require an operator to link to the inserted expression
                    else {
                        calculator.insert(termsMulByPow10);
                    }
                });
        },

        /**
         * Called when the plugin is destroyed. Mostly when the host is destroyed itself.
         */
        destroy: function destroy() {
            this.getCalculator()
                .deleteCommand('pow10')
                .off('.' + pluginName);
        }
    });
});
