angular.module('dood.doc.merchants', [
    'dood.helpers',
    'dood.doc.core',
    'ngResource'
])

.factory('merchantDb', function(
    $q,
    $resource,
    $http,
    arrayClear,
    findTargetInArray,
    apiBaseUrl,
    ensureSession) {

    //It is called merchants in app, but still places in old server
    var merchants = [];

    function refresh() {
        
        var deferred = $q.defer();
        var _access_token;

        clear();
        ensureSession()
            .then(function(access_token) {
                _access_token = access_token;
                
                var deferred = $q.defer();
                
                var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
                if ( app ) {
                    document.addEventListener("deviceready", function() {
                        navigator.geolocation.getCurrentPosition(function(position) {
                            deferred.resolve(position.coords);
                        }, function() {
                            deferred.resolve();
                        }, { maximumAge: 300000, timeout: 2000 });
                    });
                } else {
                    navigator.geolocation.getCurrentPosition(function(position) {
                        deferred.resolve(position.coords);
                    }, function() {
                        deferred.resolve();
                    }, { maximumAge: 300000, timeout: 2000 });
                }
                                                         
                return deferred.promise;
            })
            .then(function(loc) {
                var access_token = _access_token;
                var postParams = {
                    access_token: access_token
                };
                if(loc) {
                    postParams['latitude'] = loc.latitude;
                    postParams['longitude'] = loc.longitude;
                }
                $resource(apiBaseUrl + 'frames').query(postParams, function(data, status, headers, config) {
                    data.forEach(function(x) {
                        merchants.push(x);
                    });
                    deferred.resolve(merchants);
                }, function(data, status, headers, config) {
                    deferred.reject(status);
                });
            });

        return deferred.promise;
    }

    function all() {
        return merchants;
    }

    function clear() {
        arrayClear(merchants);
    }

    function get(uuid) {
        return findTargetInArray(merchants, function(x) {
            return x.uuid == uuid;
        });
    }

    function find(uuid) {
        var deferred = $q.defer();

        if (get(uuid)) {
            deferred.resolve(get(uuid));
        } else {
            ensureSession()
                .then(function(access_token) {
                    $http.get(apiBaseUrl + 'frames/' + uuid + '?' +
                        'access_token=' + access_token)
                        .success(function(data) {
                            deferred.resolve(data);
                        })
                        .error(function(data, status) {
                            deferred.reject(status);
                        });
                });
        }

        return deferred.promise;
    }

    return {
        refresh: refresh,
        all: all,
        clear: clear,
        get: get,
        find: find
    };
});
