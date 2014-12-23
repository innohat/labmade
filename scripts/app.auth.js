'use strict';

angular.module('dood.auth', [
    'ngResource',
    'dood.doc.core',
    'dood.helpers'])

    .factory('auth', function(
	$q,
	$http,
	ensureSession,
	apiBaseUrl,
	facebook) {

	var currentUser;
	var loggedIn = false;

	function ensureLogin() {
	    var access_token, facebook_access_token;
	    var deferred = $q.defer();

	    if(loggedIn) {
		deferred.resolve(currentUser);
		return deferred.promise;
	    }

	    ensureSession()
		.then(function(_access_token) {
		    access_token = _access_token;
		    return facebook.ensureLogin();
		})
		.then(function() {
		    facebook_access_token = facebook.accessToken();
		    return $http.post(apiBaseUrl + 'passports/facebook/authenticate',
				      {"access_token": access_token, "facebook_access_token": facebook_access_token});
		})
		.then(function() {
		    loggedIn = true;
		    return reloadCurrentUser();
		})
		.then(function(response) {
		    console.log(response);
		    currentUser = response.data;
		    deferred.resolve(currentUser);
		}, function(err) {
		    deferred.reject(err);
		});

	    return deferred.promise;
	}

	function reloadCurrentUser() {
	    return ensureSession()
		.then(function(access_token) {
		    return $http.get(apiBaseUrl + 'users/me?access_token=' + access_token)
		});
	}

	return {
	    ensureLogin: ensureLogin,
	    currentUser: function() { return currentUser; },
	    reloadCurrentUser: reloadCurrentUser,
	    isLoggedIn: function() { return loggedIn; }
	}
    })
    .value('facebookAppId', '174723602705982')
    .factory('jsFacebook', function(
	    facebookAppId,
	    $q,
	    $rootScope) {
	    var initialized = false;
	    var loggedIn = false;

	    var accessToken;
	    var expirationDate;
	    var permissions;

	    function ensureInit() {
	        var deferred = $q.defer();
	        if (initialized) {
		        deferred.resolve();
	        } else {
		        try {
		            window.fbAsyncInit = function() {
			            FB.init({
			                appId      : facebookAppId,
			                xfbml      : true,
			                version    : 'v2.0',
			                status     : true
			            });
			            $rootScope.$apply(function() {
			                initialized = true;
			                deferred.resolve();
			            });
		            };

		            (function(d, s, id){
			            var js, fjs = d.getElementsByTagName(s)[0];
			            if (d.getElementById(id)) {return;}
			            js = d.createElement(s); js.id = id;
			            js.src = "//connect.facebook.net/en_US/sdk.js";
			            fjs.parentNode.insertBefore(js, fjs);
		            }(document, 'script', 'facebook-jssdk'));
		        } catch(e) {
		            deferred.reject(e);
		        }
	        }

	        return deferred.promise;
	    }

	    function ensureLogin() {
	        var deferred = $q.defer();

	        if (loggedIn) {
		        deferred.resolve();
	        } else {
		        ensureInit()
		            .then(function() {
			            FB.getLoginStatus(function(response) {
			                console.log(response);
			                if (response.status === 'connected') {
				                $rootScope.$apply(function() {
				                    loggedIn = true;

				                    accessToken = response.authResponse.accessToken;
				                    expirationDate = response.authResponse.expiresIn;
				                    permissions = response.authResponse.permissions;

				                    deferred.resolve();
				                });
			                }
			                else {
				                FB.login(function(response) {
				                    console.log(response);
				                    $rootScope.$apply(function() {
					                    if (response.status === 'connected') {
					                        loggedIn = true;

					                        accessToken = response.authResponse.accessToken;
					                        expirationDate = response.authResponse.expiresIn;
					                        permissions = response.authResponse.permissions;

					                        deferred.resolve();
					                    } else {
					                        deferred.reject(response.status);
					                    }
				                    });
				                }, {scope: 'public_profile,email,publish_actions'});
			                }
			            });
		            }, function(err) {
			            deferred.reject(err)
		            });
	        }

	        return deferred.promise;
	    }

	    return {
	        initialized: function() { return initialized; },
	        loggedIn: function() { return loggedIn; },
	        accessToken: function() { return accessToken; },
	        expirationDate: function() { return expirationDate; },
	        permissions: function() { return permissions; },

	        ensureInit: ensureInit,
	        ensureLogin: ensureLogin
	    };
    })

    .factory('facebook', function(jsFacebook) {
	    return jsFacebook;
    })

    .factory('facebookSharePhoto', function(facebook, $http) {
	    return function(message, url) {
	        var returnVal = facebook.ensureLogin()
		        .then(function() {
		            return $http({ method: 'POST',
			                       url: 'https://graph.facebook.com/me/photos',
			                       params: { access_token: facebook.accessToken(),
				                             url: url,
				                             message: message }
			                     })
		        });
	        return returnVal;
	}
    });
