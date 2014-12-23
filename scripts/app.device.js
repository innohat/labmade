angular.module('dood.device', ['ngResource'])
    .factory('plainUpload', function() {
	    var successCallback, errorCallback;
	    var popupInstance;

	    function fetchDataUrlFromInput(sucCallback, errCallback) {
	        var cam = document.getElementById("plain-upload-photo");
	        var files = cam.files;
	        if (files && files.length > 0) {
		        var file = files[0];
		        var fr = new FileReader(); // to read file contents
		        fr.readAsDataURL(file); // read the file
		        fr.onloadend = function() {
		            sucCallback(fr.result);
		        }
	        } else {
		        errCallback("No file uploaded. ");
	        }
	    }

        function success(sucCallback) {
            successCallback = sucCallback;
        }

        function error(errCallback) {
            errorCallback = errCallback;
        }

	    function show($scope) {
            var cam = document.getElementById("plain-upload-photo");
            cam.onchange = function() {
                fetchDataUrlFromInput(successCallback, errorCallback);
            }
            cam.click();
	    }

	    return {
	        show: show,
            success: success,
            error: error
	    };
    });
