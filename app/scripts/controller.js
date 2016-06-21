'use strict';

/* 
 * Controller for our Angular app
 * 
 */

/*var coreRestApp = angular.module('coreRestApp', [
    'coreRestController'
]);*/

var app = angular.module('coreRestApp', ['ngRoute']);

app.service('viewDataStore', function() {
    
    var _obj={};
    this.setData = function(data){
        _obj = data;
    }
    this.getData = function(){
        return _obj;
    }
    
    this.clearData = function(){
    	_obj={};
    }
});

app.controller('mainViewController', ['$scope', '$http', 'viewDataStore',
    function ($scope, $http, viewDataStore) {
        if (!isUserProfileConfigured())
             { promptForCredentials(); return; }
        
        resetSearch($scope);   
        asyncRefreshView($scope,resumeBrowse(),viewDataStore);
        // Update current list view based on selected view type
        $scope.redrawView = function (newSelectedViewType) {
            var currentView = getCurrentView();
            setCurrentView(newSelectedViewType);
            if((location.hash == "#/collection"||location.hash == "#/search") && currentView != newSelectedViewType){
            	setTimeout(function(){toTemplate(location.hash.substring(1))},1);
            }
        };//ends redrawView
     
        // This is action when user clicks on an item  
        $scope.followOnClick = function (entry) { 
            saveCurrentLocation(entry.uri);
            asyncRefreshView($scope,entry.uri,viewDataStore);
            
        };
        
        $scope.toLink = function (entry) {
            if(entry.notSupported){
            	setTimeout(function(){location.hash=localStorage["currentTemplate"]},1);
                resourceNotSupport();
                return;
            }
            var href = entry.uri;
            if(entry.linkRelName == constants.linkRelationDql){
            	href = "template:/search";
            	appendToBreadCrumbs(entry.title,href);
            	$scope.breadcrumbsData = getBreadcrumbs();
            	setTimeout(function(){$scope.$apply();},1);
            	saveCurrentLocation(href);
            	href = {crumb:entry.title,uri:href};
            }else{
            	saveCurrentLocation(href);
            }
            
            asyncRefreshView($scope,href,viewDataStore);
            
        };
        
        $scope.goBack = function() {
            goOneStepBack();
            setCurrentObjectJsonRepresentation(null);
            var entry = {crumb:getLastValueFromBreadCrumbs(),uri:getLastHrefFromBreadCrumbs()};
            asyncRefreshView($scope,entry,viewDataStore);
        };
        
        $scope.followBreadCrumb = function(entry) {
            // We have a difference between angular entry index, starting at 1, and array offset which
            // starts at zero
            var indexCorrected = entry.index+1;
            spliceBreadCrumbs(indexCorrected,(getBreadcrumbsAsArray().length-(indexCorrected)));
            setCurrentObjectJsonRepresentation(null);
            saveCurrentLocation(entry.uri);
            asyncRefreshView($scope,entry,viewDataStore);
            
        };
    }
]);//ends controller

// Common reset handle to the item in lightbox view
function resetLightBoxView($scope) {
    $scope.listview = new Array();
    $scope.assetssmall = new Array();
    $scope.assetslarge = new Array();
}

function resetSearch($scope) {
    $scope.searchresultslistview = new Array();
    $scope.searchresultssmall = new Array();
    $scope.searchresultslarge = new Array();  
}

// Common reset for Preview area
function resetPreview($scope) {
    $scope.updatableProperties = new Array();
    $scope.internalProperties = new Array();
    $scope.applicationProperties = new Array();
    $scope.readOnlyProperties = new Array();
    $scope.typeProperties = new Array();
    $scope.batchableResources = new Array();
    $scope.links = new Array();
    
}

// Common reset for cabinet/folder view
function resetFolderView($scope) {
    $scope.folders = new Array();
}

function resetProgress() {
    progressCompleted = false;
    $('.progress-bar').width(0);
}
var progressCompleted = false;
function initiateProgress()
{
   var col_md_4_width = $('.col-md-4').width();
   var progress = setInterval(function () {
       var $bar = $('.progress-bar');
       var div = Math.floor($bar.width() / (col_md_4_width / 100));
       if (progressCompleted) {//if ($bar.width() >= col_md_4_width) {
            $bar.text("100%");
            clearInterval(progress);
            $('.progress').removeClass('active');
       } else {
            var tickerSize = 20;
            if (div > 70)
                tickerSize = 10;
            else if(div > 80) 
                tickerSize = 5;
            else if(div > 90) 
                tickerSize = 1;
                
            if (div >= 100) 
                $bar.width(0);
            else
                $bar.width($bar.width() + tickerSize);
       }
       
       if (div > 100)
           div = 100;
       $bar.text(div + "%");
   }, 100);
}

// Main callback for fetching new data in async fashion
function asyncRefreshView($scope,uri,viewDataStore) {
    // First let's reset progress and hide everything
    stackCounterPush();
    startProgress();
    
    var prefix = "template:";
    
    if(uri&&uri.uri&&uri.crumb){
    	if(isTemplate(uri.uri)){
    		appendToBreadCrumbs(uri.crumb,uri.uri);
            $scope.breadcrumbsData = getBreadcrumbs();
        	viewDataStore.clearData();
        	setTimeout(function(){
        		toTemplate(getTemplate(uri.uri));
        	},1);
        	stopProgress();
        	return;
    	}else{
    		uri = uri.uri;
    	}
    	
    }
    
    function isTemplate(uri){
    	return uri&&(typeof(uri) == "string")&&uri.startsWith(prefix);
    }
    
    function getTemplate(uri){
    	if(!isTemplate(uri)){
    		return null;
    	}
    	return uri.substring(uri.indexOf(prefix)+prefix.length)
    }

    $.when(fetchData(uri)
    ).done(function(data) {
        resetLightBoxView($scope);
        resetPreview($scope);
        resetFolderView($scope);
        var currentResource = determineResourceType(data);
        switch (currentResource) {   
        case resourceType.service:
            processServicesResource(data,uri,$scope,viewDataStore);
            break;
        case resourceType.repository:
            processRepositoryResource(data,$scope,viewDataStore);
            break;
        case resourceType.collection:    
            processCollection(data,$scope,viewDataStore);
            break;            
        case resourceType.contentless:
            processContentlessObject(data,$scope,viewDataStore);
            break;
        case resourceType.folder:
            processFolder(data,$scope,viewDataStore);
            break;
        case resourceType.contentful:
            processContentfulObject(data,$scope,viewDataStore);
            break;
        case resourceType.checkedout:
        	processCheckedOutObjects(data,$scope,viewDataStore);
            break;
        case resourceType.type:
            processTypeResource(data,$scope,viewDataStore);
            break;
        case resourceType.batchableResources:
            processBatchableResources(data,$scope,viewDataStore);
            break;
        case resourceType.unknown:
            break;
        default:
            bootbox.confirm("Unknown resource type returned: "+currentResource);
        }
        stackCounterPop();
        stopProgress();
    }).fail(function(xhr,error) {
    	stopProgress();
    });
}

function getDataForNoPreviewAsset(previewUrl, data) {
    var dataArray = new Array();
    dataArray.push({
        uri: previewUrl,
        title:data.title,
        description: "",
        relimagelink: "",
        realthumbnail: "",
        thumbnailsize: getThumnbailSize(),
        updated: "",
        updatedShadowCopy: "",
        summary: "",
        summaryShadowCopy: "",
        index: 0,
    });
    return dataArray;
}

// Collect breadcrumbs and format properly
function getBreadcrumbs() {
    var breadcrumbArray = getBreadcrumbsAsArray();
    var breadcrumbHrefs = getBreadcrumbsHrefsAsArray();
    var dataArray = new Array();
    for (var i = 0; i < breadcrumbArray.length; i++) {
        dataArray.push({
            crumb: breadcrumbArray[i],
            uri: breadcrumbHrefs[i],
            index: i
        });
    }
    return dataArray;
}

function getPreviewArray(data) {
    // Check for storyboard - this is really lame, and should be changed to query
    // For now: check whether we have jpeg_preview, then jpeg_lres then jpeg_story
    // as CTS may generage previews in those formats - depends on configuration
    var storyBoardFormats = ["jpeg_preview", "jpeg_lres", "jpeg_story"];
    var previewArray = new Array();
    for (var i = 0; i < storyBoardFormats.length; i++) {
        var previewArray = findStoryBoard(data, storyBoardFormats[i]);
        if (previewArray.length != 0 && previewArray.length != 1)
            break;
    }
    return previewArray;
}

// Fetch single preview image, async call, return promise
function getStoryBoardImage(storyUrl) {
    return $.ajax({
        cache: false,
        type: "GET",
        async: true,
        url: storyUrl,
        contentType: "application/json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + getBasicAuthFormattedCredentials());
        }
    });
}

function fetchData(url,options) {
    return applyData(url,"GET", options);
}

function applyData(url, method,options) {
    var params = {
            cache: false,
            type: method,
            async: true,
            url: url,
            contentType: "application/json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + getBasicAuthFormattedCredentials());
            }
        }
    if(!options){
        options = {}
    }
    $.extend(params,options);
    return $.ajax(params);      
}

function showElement(elementName) {
    var state = document.getElementById(elementName).style.display;
    if (state != 'block')
    {
        document.getElementById(elementName).style.display = 'block';
    }
}
function hideElement(elementName) {
    var state = document.getElementById(elementName).style.display;
    if (state != 'none')
    {
        document.getElementById(elementName).style.display = 'none';
    }
}

function resetWidgets(){
	resetUserProfileControls();
}

function resetUserProfileControls(){
	// Check to enable/disable login/logout actions
    if(!isUserProfileConfigured()) {
        $(document.getElementById('logincontrol')).removeClass("disabled");
        $(document.getElementById('logoutcontrol')).addClass("disabled");
        $(document.getElementById('editcontrol')).addClass("disabled");
    } else {
        $(document.getElementById('logoutcontrol')).removeClass("disabled");
        $(document.getElementById('editcontrol')).removeClass("disabled");
        $(document.getElementById('logincontrol')).addClass("disabled");
    } 
}

function hasLink(data,link){
	var link = findContentUrlForRelation(data,link);
	if(link){
		return true;
	}
	return false;
}

function startProgress(){
	resetProgress();
    showElement('progressFeedback');
    initiateProgress();
}
function stopProgress(){
	hideElement('progressFeedback');
}

