/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery', 
    'lodash',
    'tpl!ui/feedback/feedback'
], function($, _, tpl){

    //keep a reference to ALL alive feedbacks 
    var currents = [];

    //contains the reference to the main feedback box. We expect other containers to be only edge cases.
    var $feedBackBox;

    //feedback levels are divided into 2 categories
    var categories = {

        //volatiles messages disappear after a certain amount of time. 
        //If 2 messages of the same category appears, only the last one is displayed
        'volatile'      : ['info', 'success'],

        //perisitent feedbacks stay until their are closed. 
        //Other persistent feedbacks are merged to keep all the infos. 
        //To prevent UI pollution, they may be collapsed  in a notification area
        'persistent'    : ['warning', 'error']  
    };

    //extract the available levels from the categories
    var levels = _(categories).values().flatten().value();

    //feedback's states
    var states = {
        created     : 'created',
        displayed   : 'displayed',
        closed      : 'closed',
        merged      : 'merged',
        collapsed   : 'collapsed'
    };

    //the default options
    var defaultOptions = {
        timeout : 10000
    };

    /**
     * Object delegation. This enables us to separate the instance of feedback from the feedbackApi.
     * An instance can call methods from the API like it was it, so each object will not contain the function definition.
     * @private 
     * @param {Object} receiver - the object that receive the methods
     * @param {Object} provider - it provides the methods to the receiver
     * @returns {Object} the receiver augmented by the provider's methods. 
     */
    function delegate (receiver, provider) {
        _(provider).functions().forEach(function delegateMethod(methodName) {
            receiver[methodName] = function applyDelegated() {
                return provider[methodName].apply(receiver, arguments);
            };
        });
        return receiver;
    }

    /**
     * It provides the feedback behavior
     * @typedef FeedbackApi
     */
    var feedbackApi = {

        level : null,

        category : null,

        message : function message(level, msg, options){
            if(!level || !_.contains(levels, level)){
                level = 'info';
            }
            this.setState(states.created);

            this.level = level;
            this.category = _.findKey(categories, [this.level]);
            this.options  = _.defaults(options || {}, defaultOptions); 

            this.content  = tpl({
                level : level,
                msg : msg
            });

            this._trigger('create');
 
            return this;
        },

        info : function info(msg, options){
            return this.message('info', msg, options)
                       .open();
        },

        success : function success(msg, options){
            return this.message('success', msg, options)
                       .open();
        },

        warning : function warning(msg, options){
            return this.message('warning', msg, options)
                       .open();
        },

        error : function error(msg, options){
            return this.message('error', msg, options)
                       .open();
        },

        open : function open(){

            this._trigger();

            // do not manage persisten message until finished
            //if(this.category === 'persistent'){ 
                 //this.merge();
            //} else {

                //close others
                _(currents)
                    //.where({ category : 'volatile' })       //all volatiles
                    .reject({ id : this.id})                //but this
                    .invoke('close');                       //run close

                //and display me
                this.display();
//            }
            return this;
        },

        close : function close(){
            if(this.isInState(states.displayed)){

                this.setState(states.closed);

                $('#' + this.id).remove();
        
                this._trigger();
            
                //clean up refs
                _.remove(currents, { _state : states.closed });
            }
        },

        display : function display(){
            var self = this;
            if(this.content){
                this.setState(states.displayed);

                $(this.content)
                    .attr('id', this.id)
                    .appendTo(this._container);
                
                this._trigger();

                if(this.options.timeout >= 0){
                    setTimeout(function(){
                    
                        //volatiles messages auto close and peristent collaspe
        //                if(self.category === 'volatile'){
                            self.close();
                        //} else {
                            //self.collapse();
                        //}

                    }, this.options.timeout);
                }
            }
            return this;
        },

        merge : function merge(){
           var previous =  _.find(currents, { category : 'persistent' });
           if(!previous){
                return this.display();
           }
           //do the merge
           this.setState(states.merged);
            
                
           this._trigger();
        },

        collapse : function collapse(){

           this._trigger();
        },

        /**
         * trigger the event and the callback if exists
         * @param {String} [eventName] - the name of the event, use the caller name if not set
         */
        _trigger : function _trigger(eventName) {
            var name = eventName || this._trigger.caller.name;

            //trigger the related event
            this._container.trigger(name + '.feedback', [this]);

            //run the callback if set in options
            if(_.isFunction(this.options[name])){
                this.options[name].call(this);
            }
        }
    };

    /**
     * COntains the current state of the feedback and accessors
     * @typedef feedbackState
     */
    var feedbackState = {

        //the current state
        _state : null,

        /**
         * Check if the current state is one of the given values
         * @param {String|Array} verify - the statue to check
         * @returns {Boolean} true if the object is in the state to verify
         */        
        isInState : function isInState(verify){
            if(!_.isString(verify)){
                verify = [verify];
            }
            return _.contains(verify, this._state);
        },

        /**
         * Change the current state
         * @param {String} state - the new state
         * @throws {Error} if we try to set an invalid state
         */
        setState : function setState(state){
            if(!_.contains(states, state)){
                throw new Error('Unkown state ' + state );
            }
            this._state = state;
        } 
    };

    /**
     * Enables you to create a new feedback.
     * example fb().error("content");
     * @exports ui/feedback
     * @param {jQUeryElement} [$container] - only to specify another container
     * @returns {Object} the feedback object
     * @throws {Error} if the container isn't found
     */
    var feedbackFactory = function feedbackFactory( $container ){
        var _container;
        if(!$feedBackBox){
            $feedBackBox = $('#feedback-box');
        }
        _container = $container || $feedBackBox;
       
        if(!_container || !_container.length){
            throw new Error('The feedback needs to belong to an existing container');
        }

        //mixin the new object with the state object
        var fb = _.extend( {
            id          : 'feedback-' + (currents.length + 1),
            _container  : _container
        }, feedbackState);

        currents.push(fb);
 
        //delegate the api calls to the new instance
        return delegate(fb, feedbackApi);
    }; 


    return feedbackFactory;
});
