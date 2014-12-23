angular.module('dood.doc.friends', [
    'ngResource',
    'dood.helpers',
    'dood.doc.core',
    'dood.auth'])

    .factory('friendDb', function(
	ensureSession,
	facebook,
	auth,
	arrayClear,
	apiBaseUrl,
	$q,
	$resource,
	$http) {

	var friends = [];

	function refresh() {
	    var deferred = $q.defer();

	    clear();
	    auth.ensureLogin()
		.then(function() {
		    return auth.reloadCurrentUser();
		})
		.then(function() {
		    auth.currentUser().friends.forEach(function(x) { friends.push(x); });
		    deferred.resolve(friends);
		}, function() {
		    deferred.reject(status);
		});

	    return deferred.promise;
	}

	function all() {
	    return friends;
	}

	function clear() {
	    arrayClear(friends);
	}

	function info(user_id) {
	    return auth.ensureLogin()
		.then(function() {
		    return ensureSession();
		})
		.then(function(access_token) {
		    return $http({
			method: 'GET',
			url: apiBaseUrl + 'users/' + user_id,
			params: {
			    access_token: access_token
			}
		    });
		})
		.then(function(response, status) {
		    return response.data;
		});
	}

	return {
	    refresh: refresh,
	    all: all,
	    clear: clear,
	    info: info
	};
    });
