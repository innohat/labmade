angular.module('dood.doc.core', ['ngResource', 'angular-data.DS'])

    .value('apiBaseUrl', 'http://snapviva.com/query/')

    .factory('ensureSession', function(
	$http,
	$q,
	apiBaseUrl) {
	var access_token;

	return function() {
	    console.log(access_token);
	    var deferred = $q.defer();

	    if(access_token) {
		deferred.resolve(access_token);
	    } else {
		$http.post(apiBaseUrl + 'session')
		    .success(function(data, status, headers, config) {
			access_token = data.access_token;
			if(access_token) {
			    deferred.resolve(access_token);
			} else {
			    deferred.reject('uuid is null');
			}
		    })
		    .error(function(data, status, headers, config) {
			deferred.reject(status);
		    })
	    }

	    return deferred.promise;
	};
    })
