app.config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
        when('/repository', {
            templateUrl: 'templates/repository.html',
            controller: 'repositoryViewController'
        }).
        when('/batchables', {
            templateUrl: 'templates/batchableResources.html',
            controller: 'batchablesViewController'
        }).
        when('/type', {
            templateUrl: 'templates/type.html',
            controller: 'typeViewController'
        }).
        when('/contentless', {
            templateUrl: 'templates/contentless.html',
            controller: 'contentlessViewController'
        }).
        when('/contentful', {
            templateUrl: 'templates/contentful.html',
            controller: 'contentfulViewController'
        }).
        when('/checkin', {
            templateUrl: 'templates/checkin.html',
            controller: 'checkinViewController'
        }).
        when('/collection', {
            templateUrl: 'templates/collection.html',
            controller: 'collectionViewController'
        }).
        when('/search', {
            templateUrl: 'templates/search.html',
            controller: 'searchViewController'
        }).
        otherwise({
            templateUrl: 'templates/default.html',
            redirectTo:'/'
            
        });
    }
]);

app.controller('repositoryViewController', ['$scope', '$http', 'viewDataStore',
     function ($scope, $http,viewDataStore) {
        var data = viewDataStore.getData();
        $scope.links = getDataFromLinks(data);
        
     }
 ]);

app.controller('searchViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
		var data = viewDataStore.getData();
		refreshView(data);
		$scope.startSearch = function(){
			startProgress();
			var dqlTempl = getDqlTemplate();
            if(!dqlTempl)
                return;
            var templEndIndex = dqlTempl.indexOf('{');
            if (templEndIndex != -1) {
                dqlTempl = dqlTempl.substring(0,templEndIndex);
                dqlTempl = dqlTempl + '?dql=';
            }
            var query = querySelector.searchWithThumbnails;
            query = query + $scope.searchText +"'";
            var encodedQuery = encodeURIComponent(query);
            $.when(fetchData(dqlTempl+encodedQuery)
            ).done(function(data) {
            	viewDataStore.setData(data);
            	refreshView(data);
            	stopProgress();
            	$scope.$apply();
            });
		}
		
		function refreshView(data){
    		$scope.searchresultslistview = new Array();
    	    $scope.searchresultssmall = new Array();
    	    $scope.searchresultslarge = new Array();
        	var currentView = getCurrentView();
            switch (currentView) {
            case viewType.listView:
                $scope.searchresultslistview = getDataFromSearchEntries(data);
                break;
            case viewType.smallIcons:
                $scope.searchresultssmall = getDataFromSearchEntries(data);
                break;
            case viewType.largeIcons:
                $scope.searchresultslarge = getDataFromSearchEntries(data);
                break;
            default:
                setCurrentView(constants.largeIconView);
                $scope.searchresultslarge = getDataFromSearchEntries(data);
                break;
            
            }
        }
}
]);

app.controller('typeViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
        var icon = constants.typeStaticImage;
        var dataArray = new Array();
        dataArray.push({
            preview: icon
        });
        $scope.links = dataArray;
        var data = viewDataStore.getData();
        var type = getTypePropertyInfoFromProperties(data);
        $scope.type = type;
    }
]);

app.controller('batchablesViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
    var data = viewDataStore.getData();
    var icon = constants.uknownStaticImage;
    var dataArray = new Array();
    dataArray.push({
        preview: icon
    });
    $scope.links = dataArray;
    
    var batchableResources = getBatchableResourcesFromData(data);
    $scope.batchableResources = batchableResources;
    }
]);

app.controller('contentlessViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
        var data = viewDataStore.getData();
        var disabled = "disabled";
        var enabled = "";
        $scope.canDelete = hasLink(data,constants.linkRelationDelete)?enabled:disabled;
        var icon = constants.uknownStaticImage;
        if(data.name === "user")
        	icon = constants.userStaticImage;
        else if (data.name === "group") 
            icon = constants.groupStaticImage;
        else if (data.name === "format") 
            icon = constants.formatStaticImage;
        else if (data.name === "relation" || data.name === "relation-type") 
            icon = constants.relationStaticImage;
        else if (data.name === "network-location") 
            icon = constants.uknownStaticImage;//TODO img for network-location
        else if (data.type.name) 
            icon = constants.typeStaticImage;
        var dataArray = new Array();
        dataArray.push({
            preview: icon
        });
        $scope.links = dataArray;
        var processedData = getDataFromProperties(data, constants.linkRelationContentMedia);
        $scope.updatableProperties = processedData.pop();
        $scope.applicationProperties = processedData.pop();
        $scope.internalProperties = processedData.pop();
        $scope.readOnlyProperties = processedData.pop();
        
        $scope.deleteAsset = function() {
            deleteCurrentAsset($scope,data,viewDataStore);
        };
        
        
    }
]);

app.controller('contentfulViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
        var data = viewDataStore.getData();
        setActionButtons(data);    
        saveCurrentLocation(findContentUrlForRelation(data,constants.linkRelationSelf));
        var processedData = getDataFromProperties(data, constants.linkRelationContentMedia);
        $scope.updatableProperties = processedData.pop();
        $scope.applicationProperties = processedData.pop();
        $scope.internalProperties = processedData.pop();
        $scope.readOnlyProperties = processedData.pop();
        RenderPreviews($scope,data);
        
        function setActionButtons(data){
        	var disabled = "disabled";
            var enabled = "";
            $scope.canDownload = disabled;
            $scope.canLock = hasLink(data,constants.linkRelationCheckout)?enabled:disabled;
            $scope.canCheckIn = hasLink(data,constants.linkRelationCheckInNextMajor)?enabled:disabled;
            $scope.canCancelLock = hasLink(data,constants.linkRelationCancelCheckOut)?enabled:disabled;
            $scope.canDelete = hasLink(data,constants.linkRelationDelete)?enabled:disabled;
        }
        
        function RenderPreviews($scope,data){
        	
        	$scope.downloaduri = "";
            $scope.canDownload = "disabled";
        	var contentUri = findContentUrlForRelation(data,constants.linkRelationPrimaryContent);
        	if(contentUri.contains("?")){
        		contentUri = contentUri+"&media-url-policy=LOCAL";
            }else{
            	contentUri = contentUri+"?media-url-policy=LOCAL";
            }
        	startProgress();
        	$.when(fetchData(contentUri,{error:function(){
        			stopProgress();
                	var dataArray = [];
                	dataArray.push({
                        preview: constants.documentStaticImage
                    });
                    $scope.links = dataArray;
                    $scope.$apply(); 
                    stopProgress();
        		}})
            ).done(function(data) {
            	var uri = findUrlGivenLinkRelation(data,constants.linkRelationContentMedia); 
            	var ajaxParam = {	
            						responseType: 'arraybuffer',
            						headers:{"Authorization":"Basic " + getBasicAuthFormattedCredentials()}
            					};
            	$http.get(uri, ajaxParam)
        		.success(function(fileBuffer,status,headers,xhq){
        			$scope.canDownload = "";
         	        $scope.downloaduri = uri;
        		    var contentType = headers("Content-type");
        		    var dataArray = [];
        		    if(isImageContentType(contentType)){
        		    	var binary = '';
            		    var bytes = new Uint8Array(fileBuffer);
            		    var len = bytes.byteLength;
            		    for (var i = 0; i < len; i++) {
            		        binary += String.fromCharCode( bytes[ i ] );
            		    }
            		    binary = btoa(binary);
        		    	var src = "data:"+contentType+";base64,"+binary;
                    	dataArray.push({
                            preview: src
                        });
        		    }else{
                    	dataArray.push({
                            preview: constants.contentfulStaticImage
                        });
        		    }
        		    
                    $scope.links = dataArray;
        		})
        		.error(function(data, status){
        			console.log(arguments)
        		});
     	        
                stopProgress();
            });
        }
        
        function isImageContentType(contentType){
        	if(!contentType||typeof(contentType)!="string"){
        		return false;
        	}
        	return contentType.startsWith("image/");
        }
        
        $scope.lockAsset = function() { 
            startProgress();
            var uri = findContentUrlForRelation(data,constants.linkRelationCheckout);
            if(!uri || uri=== 'null'){
                stopProgress();
                progressCompleted = true;
                $scope.$apply(); 
                return;
            }
            $.when(applyData(uri,"PUT")
            ).done(function(data) {
            	stopProgress();
                viewDataStore.setData(data);
                toTemplate("/contentful");
                $scope.$apply();
            });
        };
        
        $scope.cancelLock = function() {
        	startProgress();
            var c_uri = findContentUrlForRelation(data,constants.linkRelationCancelCheckOut);
            $.when(applyData(c_uri,"DELETE")
            ).done(function() {
                $.when(fetchData(findContentUrlForRelation(data,constants.linkRelationSelf))
                ).done(function(data) {
                	progressCompleted = true;
                	stopProgress();
                    viewDataStore.setData(data);
                    toTemplate("/contentful");
                    $scope.$apply();
                });
            }); 
        };
        
        $scope.deleteAsset = function() {
            deleteCurrentAsset($scope,data,viewDataStore);
        };
        
        $scope.checkIn = function() {
            toTemplate("/checkin")
        };
    }
]);

app.controller('checkinViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
		document.getElementById('fileSelectorCheckin').addEventListener('change', handleFileSelectCheckin, false);
		var data = viewDataStore.getData();  
	    var processedData = getDataFromProperties(data, constants.linkRelationContentMedia);
	    $scope.updatableProperties = processedData.pop();
	    
	    $scope.startCheckInProcess = function() {
            $(document.getElementById('startCheckInButton')).addClass("disabled");
            var checkinUri = findContentUrlForRelation(data,constants.linkRelationCheckInNextMajor);
            startProgress();
            uploadContent(checkinUri,true).then(function (data) {
                var uri = findUrlForLinkRelation(data,constants.linkRelationSelf);
                stopProgress();
                viewDataStore.setData(data);
                toTemplate("/contentful");
            }, function (error) {
            	stopProgress();
                bootbox.confirm("An error occurred, HTTP Request object came back with and Error: <br>\
                                <span style='color:#FF0000'>Error Code:\
                                "+error.status
                                +"</span><br><span style='color:#FF0000'>Error Message:"
                                 + error.message+"</span>", function(result) {
                                                            });
                
            });
        };
    }
]);

app.controller('collectionViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http,viewDataStore) {
        var data = viewDataStore.getData();
        var processedData = getDataFromEntries(data);
        var currentView = getCurrentView();
        switch (currentView) {
        case viewType.listView:
            $scope.listview = processedData.pop();
            break;
        case viewType.smallIcons:
            $scope.assetssmall = processedData.pop();
            break;
        case viewType.largeIcons:
            $scope.assetslarge = processedData.pop();
            break;
        default:
            setCurrentView(constants.largeIconView);
            $scope.assetslarge = processedData.pop();
            break;
        }    
        $scope.folders = processedData.pop();
    }
]);