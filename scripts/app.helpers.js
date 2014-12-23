angular.module('dood.helpers', [
    'ngResource' ])

    .factory('urlHelpers', function() {
	function concatAndResolveUrl(url, concat) {
	    var url1 = url.split('/');
	    var url2 = concat.split('/');
	    var url3 = [ ];
	    for (var i = 0, l = url1.length; i < l; i ++) {
		if (url1[i] == '..') {
		    url3.pop();
		} else if (url1[i] == '.') {
		    continue;
		} else {
		    url3.push(url1[i]);
		}
	    }
	    for (var i = 0, l = url2.length; i < l; i ++) {
		if (url2[i] == '..') {
		    url3.pop();
		} else if (url2[i] == '.') {
		    continue;
		} else {
		    url3.push(url2[i]);
		}
	    }
	    return url3.join('/');
	}

	return {
	    join: concatAndResolveUrl
	};
    })

    .factory('nowDateString', function() {
	return function() {
	    var str = JSON.stringify(new Date());
	    return str.substr(1, str.length - 2);
	};
    })

    .factory('arrayClear', function() {
	return function(arr) {
	    while(arr.length > 0) {
		arr.pop();
	    }
	};
    })

    .factory('findTargetInArray', function() {
	return function(arr, conditionCallback) {
	    var target = null;
	    arr.forEach(function(x) {
		if(conditionCallback(x)) {
		    target = x;
		}
	    });
	    return target;
	}
    })

    .factory('clearHistory', function($rootScope) {
	return function() {
	    $rootScope.$viewHistory = {
		histories: { root: { historyId: 'root', parentHistoryId: null, stack: [], cursor: -1 } },
		backView: null,
		forwardView: null,
		currentView: null,
		disabledRegistrableTagNames: [],
		views: []
	    };
	};
    })

    .factory('confirmPopup', function($ionicPopup, uiLoading) {
	return function(title, message) {
	    var needToShowUiLoadingAgain = false;
	    if(uiLoading.isShowing()) {
		uiLoading.hide();
		needToShowUiLoadingAgain = true;
	    }
	    var confirmPopup = $ionicPopup.confirm({
		title: title,
		template: message
	    });
	    return confirmPopup
		.then(function(res) {
		    var deferred = $q.defer();
		    if (res) {
			deferred.resolve();
		    } else {
			deferred.reject('user canceled');
		    }
		    if (needToShowUiLoadingAgain) {
			uiLoading.show();
		    }
		    return deferred.promise;
		});
	};
    })

    .factory('makeId', function() {
	return function(l)
	{
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for( var i=0; i < l; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
	};
    })

    .factory('firstTimeRun', function() {
        var firstTimeRun = false;

        if(!window.localStorage.getItem('has_run')) {
            //do some stuff if has not loaded before
            window.localStorage.setItem('has_run', 'true');
            firstTimeRun = true;
        }

        return firstTimeRun;
    })

    .factory('tooltip', function() {
        var targets = $( '[rel~=tooltip]' ),
            target  = false,
            tooltip = false,
            title   = false;

        return function(tip, target)
        {
            target  = $( target );
            tooltip = $( '<div id="tooltip"></div>' );

            if( !tip || tip == '' )
                return false;

            target.removeAttr( 'title' );
            tooltip.css( 'opacity', 0 )
                   .html( tip )
                   .appendTo( 'body' );

            var init_tooltip = function()
            {
                if( $( window ).width() < tooltip.outerWidth() * 1.5 )
                    tooltip.css( 'max-width', $( window ).width() / 2 );
                else
                    tooltip.css( 'max-width', 340 );

                var pos_left = target.offset().left + ( target.outerWidth() / 2 ) - ( tooltip.outerWidth() / 2 ),
                    pos_top  = target.offset().top - tooltip.outerHeight() - 20;

                if( pos_left < 0 )
                {
                    pos_left = target.offset().left + target.outerWidth() / 2 - 20;
                    tooltip.addClass( 'left' );
                }
                else
                    tooltip.removeClass( 'left' );

                if( pos_left + tooltip.outerWidth() > $( window ).width() )
                {
                    pos_left = target.offset().left - tooltip.outerWidth() + target.outerWidth() / 2 + 20;
                    tooltip.addClass( 'right' );
                }
                else
                    tooltip.removeClass( 'right' );

                if( pos_top < 0 )
                {
                    var pos_top  = target.offset().top + target.outerHeight();
                    tooltip.addClass( 'top' );
                }
                else
                    tooltip.removeClass( 'top' );

                tooltip.css( { left: pos_left, top: pos_top } )
                       .animate( { top: '+=10', opacity: 0.8 }, 50 );
            };

            init_tooltip();
            $( window ).resize( init_tooltip );

            var remove_tooltip = function()
            {
                tooltip.animate( { top: '-=10', opacity: 0 }, 50, function()
                {
                    $( this ).remove();
                });

                target.attr( 'title', tip );
            };

            target.bind( 'mouseleave', remove_tooltip );
            tooltip.bind( 'click', remove_tooltip );
        };
    });
