angular.module('dood.doc.photos', [
    'dood.doc.core',
    'dood.helpers',
    'ngResource',
    'angular-data.DS',
    'angular-data.DSCacheFactory'])

    .factory('photoDb', function(
	$http,
	$resource,
	$q,
	photoCache,
	ensureSession,
	nowDateString,
	arrayClear,
	findTargetInArray,
	apiBaseUrl,
	DSCacheFactory) {

	//Photos sorting: latest first

	var photos = photoCache.loadCache();

	//Private helper functions

	function localEarliestTimestamp() {
	    if(photos.length == 0) {
		return null;
	    }

	    return photos[photos.length - 1].created_at;
	}

	function localLatestTimestamp() {
	    if(photos.length == 0) {
		return null;
	    }

	    return photos[0].created_at;
	}

	//Public functions

	function update(limit) {
	    var deferred = $q.defer();

	    if(!localLatestTimestamp()) {
		deferred.reject('no photo in the database');
	    }

	    ensureSession()
		.then(function(access_token) {
		    var postParams = {
			access_token: access_token,
			after: localLatestTimestamp()
		    };
		    $resource(apiBaseUrl + 'photos').query(postParams, function(data, status, headers, config) {
			data.forEach(function(x) { photos.unshift(x); });
			photoCache.appendToCache(data);
			deferred.resolve(photos);
		    }, function(data, status, headers, config) {
			deferred.reject(status);
		    });
		})

	    return deferred.promise;
	}

	function fetch(limit) {
	    var deferred = $q.defer();

	    if(!limit) {
		limit = null;
	    }

	    console.log('dash: fetch new photos ...');

	    ensureSession()
		.then(function(access_token) {
		    $http({ method: 'GET',
			    url: apiBaseUrl + 'photos',
			    params: {
				access_token: access_token,
				before: (localEarliestTimestamp() ? localEarliestTimestamp() : nowDateString()),
				limit: limit }})
			.success(function(data, status, headers, config) {
			    data.forEach(function(x) { photos.push(x); });
			    photoCache.appendToCache(data);
			    deferred.resolve(photos);
			})
			.error(function(data, status, headers, config) {
			    deferred.reject(status);
			});
		});

	    return deferred.promise;
	}

	function all() {
	    return photos;
	}

	function clear() {
	    arrayClear(photos);
	    photoCache.removeAll();
	}

	function create(photo) {
	    var deferred = $q.defer();

	    ensureSession()
		.then(function(session_uuid) {
		    photo['access_token'] = session_uuid;
		    $http.post(apiBaseUrl + 'photos', photo)
			.success(function() {
			    deferred.resolve(photo);
			})
			.error(function(data, status) {
			    deferred.reject(status);
			});
		});

	    return deferred.promise;
	}

	function get(uuid) {
	    return findTargetInArray(photos, function(x) { return x.uuid == uuid; });
	}

	function find(uuid) {
	    var deferred = $q.defer();

	    if(get(uuid)) {
		deferred.resolve(get(uuid));
	    } else {
		ensureSession()
		.then(function(session_uuid) {
		    $http.get(apiBaseUrl + 'photos/' + uuid + '?' +
			      'access_token=' + session_uuid)
			.success(function(data) {
			    deferred.resolve(data);
			    photoCache.storeToCache(data);
			})
			.error(function(data, status) {
			    deferred.reject(status);
			});
		});
	    }

	    return deferred.promise;
	}

	return {
	    //Instant
	    all: all,
	    clear: clear,
	    get: get,
	    //Async
	    create: create,
	    update: update,
	    fetch: fetch,
	    find: find
	};
    })

    .factory('photoCache', function(DSCacheFactory) {
	var cache = DSCacheFactory('photos');

	function loadCache() {
	    var photoResult = [];
	    cache.keys().forEach(function(key) {
		photoResult[photoResult.length] = cache.get(key);
	    });
	    photoResult.sort(function(x, y) {
		return x.created_at > y.created_at;
	    });
	    return photoResult;
	}

	function appendToCache(array) {
	    array.forEach(function(x) {
		storeToCache(x);
	    });
	    return true;
	}

	function storeToCache(val) {
	    if(!val.uuid) {
		return false;
	    }

	    cache.put(val.uuid, val);
	}

	function comparePhotoInCacheAndReturnIndex(callback) {
	    var curIndex;
	    var curVal;

	    cache.keys().forEach(function(key, i) {
		var val = cache.get(key);

		if(curIndex == undefined || curVal == undefined) {
		    curIndex = i;
		    curVal = val;
		    return;
		}

		if(callback(val, curVal)) {
		    curIndex = i;
		    curVal = val;
		}
	    });

	    return curIndex;
	}

	function getLatestPhotoUuidInCache() {
	    var index = comparePhotoInCacheAndReturnIndex(function(val, curVal) {
		val.created_at > curVal.created_at });
	    return cache.get(index);
	}

	function getEarlistPhotoUuidInCache() {
	    var index = comparePhotoInCacheAndReturnIndex(function(val, curVal) {
		val.created_at < curVal.created_at });
	    return cache.get(index);
	}

	cache.setOptions({
	    onExpire: function(key, value) {
		if(!(value.uuid == getLatestPhotoUuidInCache() || value.uuid == getEarlistPhotoUuidInCache())) {
		    cache.put(key, value);
		}
	    }
	});

	return {
	    loadCache: loadCache,
	    appendToCache: appendToCache,
	    storeToCache: storeToCache
	}
    })

    .factory('photoRedeem', function() {
	return function(photoDoc) {

	};
    })

    .factory('photoUpload', function(makeId, ensureSession, apiBaseUrl, $q, $http) {
	function cloudinarySign(fileID, frameID, accessToken, done, fail) {
	    $http.post(apiBaseUrl + 'utils/cloudinarysign',{
		tags: 'gift',
		public_id: fileID,
		transformation: 'c_fill,h_750,w_750'+ (frameID ? '/l_' + frameID : ''),
		eager: 'c_fill,h_200,w_200',
		eager_async: 'true',
		access_token: accessToken
	    }).success(function(data, status, headers, config) {
		done(data);
	    }).error(function(data, status, headers, config) {
		fail(status);
	    })
	}

	function phonegapUpload(fileUrl, frame, accessToken) {
	    var deferred = $q.defer();

	    var uri = encodeURI('https://api.cloudinary.com/v1_1/dood/image/upload');
	    var transfer = new FileTransfer();
	    var fileID = makeId(10);
	    var options = new FileUploadOptions()
	    options.fileKey = 'file';
	    options.mimeType = "image/jpeg";
	    options.chunkedMode = false;
	    options.fileName = fileID + '.jpg';
	    options.headers = {
		Connection: "close"
	    };
	    options.chunkedMode = false;

	    cloudinarySign(fileID, frame.public_id, accessToken, function(params) {
		options.params = params;
		transfer.upload(
		    fileUrl, uri,
		    function(res){
			deferred.resolve(JSON.parse(res.response).url);
		    }, function(error){
			deferred.reject(error);
		    }, options);
	    }, function(err) {
		deferred.reject(err);
	    })

	    return deferred.promise;
	}

	function dataUrlUpload(dataUrl, frame, accessToken) {
	    var deferred = $q.defer();

	    var uri = encodeURI('https://api.cloudinary.com/v1_1/dood/image/upload');
	    var fileID = makeId(10);

	    cloudinarySign(fileID, frame.public_id, accessToken, function(params) {
		$http({ method: 'POST',
			url: 'https://api.cloudinary.com/v1_1/dood/image/upload',
			data: {
			    file: dataUrl,
			     api_key: params.api_key,
			     timestamp: params.timestamp,
			     signature: params.signature,
			     tags: params.tags,
			     eager_async: params.eager_async,
			     eager: params.eager,
			     transformation: params.transformation,
			     public_id: params.public_id
			 }
		      })
		    .success(function(data, status) {
			deferred.resolve(data.url);
		    })
		    .error(function(data, status) {
			deferred.reject(status);
		    });
	    }, function(err) {
		deferred.reject(err);
	    })

	    return deferred.promise;
	}

	return function(url, type, frame) {
	    var deferred = $q.defer();

	    ensureSession()
		.then(function(access_token) {
		    if(type == 'file') {
			phonegapUpload(url, frame, access_token)
			    .then(function(destUrl) {
				deferred.resolve(destUrl);
			    }, function(err) {
				deferred.reject(err);
			    });
		    } else if(type == 'data') {
			dataUrlUpload(url, frame, access_token)
			    .then(function(destUrl) {
				deferred.resolve(destUrl);
			    }, function(err) {
				deferred.reject(err);
			    });
		    } else {
			deferred.reject('unsupported type');
		    }
		});

	    return deferred.promise;
	};
    });

//Note: Use angular-data or some kind of local data models and use pourchDB/(or plain HTTP) for querying and updating.
