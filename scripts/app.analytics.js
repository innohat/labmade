'use strict';

angular.module('dood.analytics', [
    'dood.helpers'
])

.factory('analytics', function($q) {
    var trackView = function(title) {
        //console.log("GA view tracked: " + title);
        if (window.analytics) {
            return analytics.trackView(title); 
        } else {
            //console.log("No GA Object found. Retrying ...");
            setTimeout(function() {
                trackView(title);
            }, 1000);
        }
    }

    var trackEvent = function(category, action, label, value) {
        //console.log("GA action tracked: " + action);
        if (window.analytics) {
            return analytics.trackEvent(category, action, label, value);
        } else {
            //console.log("No GA Object found. Retrying ...");
            setTimeout(function() {
                trackEvent(category, action, label, value);
            }, 1000);
        }
    }

    var setUserId = function(id) {
        //console.log("User id set: " + id);
        if (window.analytics) {
            return analytics.setUserId("" + id);
        } else {
            //console.log("No GA Object found. Retrying ...");
            setTimeout(function() {
                setUserId(id);
            }, 1000);
        }
        
    }

    return {
        trackView: trackView,
        trackEvent: trackEvent,
        setUserId: setUserId
    };
});
