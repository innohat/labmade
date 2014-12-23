angular.module('dood.ctrl.create', [
    'ngResource',
    'dood.auth',
    'dood.helpers',
    'dood.device',
    'dood.doc.merchants',
    'dood.doc.photos',
    'ui.bootstrap',
    'cgBusy'
])

.controller('CreateCtrl', function(
    merchantDb,
    findTargetInArray,
    clearHistory,
    auth,
    facebook,
    facebookSharePhoto,
    plainUpload,
    photoDb,
    $q,
    $http,
    $scope,
    firstTimeRun,
    tooltip,
    photoUpload,
    $modal) {

    //Init place and frame
    $scope.place = {
        name: "Loading"
    };
    $scope.photo = {
        "facebook_shared": true
    };

    $scope.upload = function() {
        plainUpload.show($scope)
    }
    $scope.photoType = "data";
    plainUpload.success(function(response) {
        $scope.$apply(function() {
            $scope.photoUrl = response;
            target = $('#portfolio');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top
                }, 1000);
            }
        });
    });
    plainUpload.error(function(response) {
    });

    merchantDb.find('4')
        .then(function(place) {
            $scope.place = place;
            $scope.photo.message = place.default_message;
            $scope.photo.frame_id = place.id;

            return auth.ensureLogin();
        })
        .then(function(currentUser) {
            $scope.currentUser = currentUser;
        })

    function choose(image_url, image_public_id) {
        var modalInstance = $modal.open({
            templateUrl: 'message.html',
            controller: 'ModalInstanceCtrl',
            size: 'lg',
            resolve: {
                message: function() {
                    return $scope.photo.message;
                }
            }
        });

        var deferred = $q.defer();

        modalInstance.result.then(function(message) {
            $scope.photo.message = message;
            $scope.create(image_url, image_public_id).then(function() {
                deferred.resolve();
            });
        })

        return deferred.promise;
    }

    $scope.choose1 = function() {
        $scope.creating1 = choose($scope.place.image_url_1, $scope.place.image_public_id_1);
    }

    $scope.choose2 = function() {
        $scope.creating2 = choose($scope.place.image_url_2, $scope.place.image_public_id_2);
    }

    $scope.create = function(image_url, image_public_id) {
        $scope.photo.facebook_shared = true;
        var deferred = $q.defer();
        var photoDest;

        return auth.ensureLogin()
            .then(function() {
                return photoUpload($scope.photoUrl, $scope.photoType, {
                    url: $scope.place.image_url,
                    public_id: $scope.place.image_public_id
                });
            })
            .then(function(destUrl) {
                $scope.photo.image_url = destUrl;
            })
            .then(function() {
                if (!facebook.loggedIn()) {
                    return confirmPopup('Login Required', 'You need to login to Facebook to continue. ');
                }
            })
            .then(function() {
                if ($scope.photo.facebook_shared) {
                    return facebookSharePhoto($scope.photo.message + $scope.place.facebook_additional_message, $scope.photo.image_url);
                } else {
                    return {
                        data: {
                            post_id: null
                        }
                    };
                }
            })
            .then(function(response) {
                $scope.photo.facebook_post_id = response.data.post_id;
            })
            .then(function() {
                return photoDb.create($scope.photo)
            })
            .then(function() {
                alert('You have successfully uploaded your photo. Please enjoy the redeem! ');
            });

    }
})

    .controller('ModalInstanceCtrl', function ($scope, $modalInstance, message) {
        $scope.ok = function () {
            $modalInstance.close($scope.message)
        };

        $scope.message = message;
    });
