define(['jquery', 'ui', 'ui/durationer'], function($, ui, durationer) {
    'use strict';

    QUnit.module('Durationer Stand Alone Test');

    QUnit.test('plugin', function(assert) {
        assert.expect(1);
        assert.ok(typeof $.fn.durationer === 'function', 'The Durationer plugin is registered');
    });

    QUnit.test('initialization', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var $container = $('#container-1');
        assert.ok($container.length === 1, 'Test the fixture is available');

        var $elt = $(':text', $container);
        assert.ok($elt.length === 1, 'Test input is available');

        $elt.on('create.durationer', function() {
            assert.ok(typeof $elt.data('ui.durationer') === 'object');
            var $controls = $container.find('.duration-ctrl');
            assert.equal($controls.length, 3, 'The plugins has created controls');
            assert.ok(typeof $controls.data('ui.incrementer') === 'object', 'The plugins has initialized incrementer on controls');

            ready();
        });
        $elt.durationer();
    });

    QUnit.test('update seconds', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var $container = $('#container-1');
        assert.ok($container.length === 1, 'Test the fixture is available');

        var $elt = $(':text', $container);

        $elt.on('create.durationer', function() {
            var $secCtrl = $container.find('[data-duration-type="seconds"]');
            assert.equal($secCtrl.length, 1, 'The seconds controls exists');
            $secCtrl.val('10').trigger('change');
        });
        $elt.on('update.durationer', function() {

            assert.equal($elt.val(), '00:00:10', 'The element value has been synchronized');

            ready();
        });
        $elt.durationer();
    });

    QUnit.test('update minutes', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var $container = $('#container-1');
        assert.ok($container.length === 1, 'Test the fixture is available');

        var $elt = $(':text', $container);

        $elt.on('create.durationer', function() {
            var $minCtrl = $container.find('[data-duration-type="minutes"]');
            assert.equal($minCtrl.length, 1, 'The minutes controls exists');
            $minCtrl.val('9').trigger('change');
        });
        $elt.on('update.durationer', function() {

            assert.equal($elt.val(), '00:09:00', 'The element value has been synchronized');

            ready();
        });
        $elt.durationer();
    });

    QUnit.test('Attempt to update minutes with non-numeric value', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var $container = $('#container-1');
        assert.ok($container.length === 1, 'Test the fixture is available');

        var $elt = $(':text', $container);

        $elt.on('create.durationer', function() {
            var $minCtrl = $container.find('[data-duration-type="minutes"]');
            assert.equal($minCtrl.length, 1, 'The minutes controls exists');
            $minCtrl.val('blablablas').trigger('change');
        });
        $elt.on('update.durationer', function() {

            assert.equal($elt.val(), '00:00:00', 'The element value has not been changed');

            ready();
        });
        $elt.durationer();
    });

    QUnit.test('update hours from incrementer', function(assert) {
        var ready = assert.async();
        assert.expect(3);

        var $container = $('#container-1');
        assert.ok($container.length === 1, 'Test the fixture is available');

        var $elt = $(':text', $container);

        $elt.on('create.durationer', function() {
            var $hourCtrlInc = $container.find('[data-duration-type="hours"]').next('.incrementer-ctrl:first').find('.inc');

            assert.equal($hourCtrlInc.length, 1, 'The hours incrementer button controls exists');

            $hourCtrlInc.click();

        });
        $elt.on('update.durationer', function() {

            assert.equal($elt.val(), '01:00:00', 'The element value has been synchronized');

            ready();
        });
        $elt.durationer();
    });

    QUnit.test('initialization with value', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var $container = $('#container-2');
        assert.ok($container.length === 1, 'Test the fixture is available');
        var $elt = $(':text', $container);

        $elt.on('create.durationer', function() {

            var $hourCtrl = $container.find('[data-duration-type="hours"]');
            var $minCtrl = $container.find('[data-duration-type="minutes"]');
            var $secCtrl = $container.find('[data-duration-type="seconds"]');

            assert.equal($hourCtrl.val(), '2');
            assert.equal($minCtrl.val(), '39');
            assert.equal($secCtrl.val(), '59');

            assert.equal($elt.val(), '02:39:59');

            ready();
        });
        $elt.durationer();
    });

    QUnit.module('Durationer Data Attr Test');

    QUnit.test('initialization', function(assert) {
        var ready = assert.async();
        assert.expect(5);

        var $container = $('#container-3');
        assert.ok($container.length === 1, 'Test the fixture is available');

        var $elt = $(':text', $container);
        assert.ok($elt.length === 1, 'Test input is available');

        $elt.on('create.durationer', function() {
            assert.ok(typeof $elt.data('ui.durationer') === 'object');
            var $controls = $container.find('.duration-ctrl');
            assert.equal($controls.length, 3, 'The plugins has created controls');
            assert.ok(typeof $controls.data('ui.incrementer') === 'object', 'The plugins has initialized incrementer on controls');

            ready();
        });

        durationer($container);
    });
});

