'use strict';

/* 
 * Controller for our Angular app
 * 
 */

/*var coreRestApp = angular.module('coreRestApp', [
    'coreRestController'
]);*/

var app = angular.module('coreRestApp', []);

app.controller('mainViewController', ['$scope', '$http', '$log',
    function ($scope, $http) {
        if (!isUserProfileConfigured())
             { promptForCredentials(); return; }
        
        resetSearch($scope);   
        asyncRefreshView($scope,resumeBrowse(),'progressFeedback');
        // Update current list view based on selected view type
        $scope.redrawView = function (newSelectedViewType) {
            var currentView = getCurrentView();
            setCurrentView(newSelectedViewType);
            var thumbnailSize = getThumnbailSize();
            switch (currentView) {
            case viewType.largeIcons: 
                if (newSelectedViewType == constants.smallIconView) {
                    $scope.assetssmall  = $scope.assetslarge.splice(0);
                    $scope.searchresultssmall = $scope.searchresultslarge.splice(0);
                    updateSmallIconsArrays($scope,thumbnailSize);
                }
                else if (newSelectedViewType == constants.listView) {
                    $scope.listview  = $scope.assetslarge.splice(0);
                    $scope.searchresultslistview = $scope.searchresultslarge.splice(0);
                    updateListViewArrays($scope,thumbnailSize);
                }
                break;
            case viewType.smallIcons:
                if (newSelectedViewType == constants.listView) {
                    $scope.listview  = $scope.assetssmall.splice(0);
                    $scope.searchresultslistview = $scope.searchresultssmall.splice(0);                
                    updateListViewArrays($scope,thumbnailSize);
                }
                else if (newSelectedViewType == constants.largeIconView) {
                    $scope.assetslarge  = $scope.assetssmall.splice(0);                 
                    $scope.searchresultslarge = $scope.searchresultssmall.splice(0);
                    updateLargeIconsArrays($scope,thumbnailSize);
                }
                break;
            case viewType.listView:
                if (newSelectedViewType == constants.smallIconView) {
                    $scope.assetssmall = $scope.listview.splice(0);
                    $scope.searchresultssmall = $scope.searchresultslistview.splice(0);
                    updateSmallIconsArrays($scope,thumbnailSize);
                }
                else if (newSelectedViewType == constants.largeIconView) {
                    $scope.assetslarge = $scope.listview.splice(0);
                    $scope.searchresultslarge = $scope.searchresultslistview.splice(0);
                    updateLargeIconsArrays($scope,thumbnailSize);
                }                
                break; 
            }
        };//ends redrawView
     
        // This is action when user clicks on an item  
        $scope.followOnClick = function (entry) {
        	if(entry.notSupported){
        		resourceNotSupport();
        		return;
        	}	
            saveCurrentLocation(entry.uri);
            asyncRefreshView($scope,entry.uri,'progressFeedback');
        };
        
        $scope.followBreadCrumb = function(entry) {
            // We have a difference between angular entry index, starting at 1, and array offset which
            // starts at zero
            var indexCorrected = entry.index+1;
            spliceBreadCrumbs(indexCorrected,(getBreadcrumbsAsArray().length-(indexCorrected)));
            setCurrentObjectJsonRepresentation(null);
            saveCurrentLocation(entry.uri);
            asyncRefreshView($scope,entry.uri,'progressFeedback');
            switchToHomeTab();
        };
        
        $scope.goBack = function(entry) {
            goOneStepBack();
            setCurrentObjectJsonRepresentation(null);
            asyncRefreshView($scope,getCurrentLocation(),'progressFeedback');
        };
        
        $scope.deleteAsset = function() {
            deleteCurrentAsset($scope);
        };
        
        $scope.startSearch = function() {
            //showElement('progressFeedbackSearch');
            var dqlTempl = getDqlTemplate();
            if(!dqlTempl)
                return;
            var templEndIndex = dqlTempl.indexOf('{');
            if (templEndIndex != -1) {
                dqlTempl = dqlTempl.substring(0,templEndIndex);
                dqlTempl = dqlTempl + '?dql=';
            }
            var query = querySelector.searchWithThumbnails;
            var searchText = document.getElementById('searchfield').value;
            query = query + searchText +"'";
            var encodedQuery = encodeURIComponent(query);
            asyncRefreshView($scope,dqlTempl+encodedQuery,'progressFeedbackSearch');
        };
        
        $scope.lockAsset = function() { 
            resetProgress();
            showElement('progressFeedback');
            initiateProgress();
            var uri = getCurrentObjectCheckOutUri();
            if(!uri || uri=== 'null'){
            	hideElement('progressFeedback');
            	progressCompleted = true;
                $scope.$apply(); 
            	return;
            }
            $.when(applyData(uri,"PUT")
            ).done(function(data) {
                setCurrentObjectJsonRepresentation(data);
                progressCompleted = true;
                hideElement('progressFeedback');
                var uri = findContentUrlForRelation(data,constants.linkRelationCheckInNextMajor);
                setCurrentObjectCheckInUri(uri);
                uri = findContentUrlForRelation(data,constants.linkRelationCancelCheckOut);
                setCurrentObjectCancelCheckOutUri(uri);
                $scope.$apply();
            });
        };
        
        $scope.cancelLock = function() {
            resetProgress();
            showElement('progressFeedback');
            initiateProgress();
            var c_uri = getCurrentObjectCancelCheckOutUri();
            $.when(applyData(c_uri,"DELETE")
            ).done(function(data) {
                $.when(fetchData(getCurrentObjectReference())
                ).done(function(refreshedData) {
                   setCurrentObjectJsonRepresentation(refreshedData);
                   progressCompleted = true;
                   resetWidgets();
                   hideElement('progressFeedback');
                   $scope.$apply(); 
                });
            }); 
        };
        
        $scope.getCheckedOutObjects = function() {
            //showElement('checkedOutProgressFeedback');
            var checkedOutUri = getCheckedOutUri();
            asyncRefreshView($scope,checkedOutUri,'checkedOutProgressFeedback'); 
        };
        
        $scope.getCheckedOutDetails = function (entry) {
            switchToHomeTab();
            asyncRefreshView($scope,entry.uri,'progressFeedback');
        };
        
        $scope.startCheckInProcess = function() {
            $(document.getElementById('startCheckInButton')).addClass("disabled");
            var checkinUri = getCurrentObjectCheckInUri();
            resetProgressUpload('checkinProgress');
            showElement('progressFeedbackCheckin');
            initiateProgressUpload('checkinProgress');
            uploadContent(checkinUri,true).then(function (data) {
                var uri = findUrlForLinkRelation(data,constants.linkRelationSelf);
                hideElement('progressFeedbackCheckin');
                switchToHomeTab();
                asyncRefreshView($scope,uri,'progressFeedback'); 
            }, function (error) {
                bootbox.confirm("An error occurred, HTTP Request object came back with and Error: <br>\
                                <span style='color:#FF0000'>Error Code:\
                                "+error.status
                                +"</span><br><span style='color:#FF0000'>Error Message:"
                                 + error.message+"</span>", function(result) {
                                                            });
                
            });
        };
        
        
        $scope.startImportInProcess = function() {
            $(document.getElementById('startImportButton')).addClass("disabled");
            resetProgressUpload('uploadProgress');
            showElement('progressFeedbackUpload');
            initiateProgressUpload('uploadProgress');
            var currentFolderRefUri = getCurrentFolderReference();
            uploadContent(currentFolderRefUri,false).then(function (data) {
                var uri = findUrlForLinkRelation(data,"self");
                hideElement('progressFeedbackUpload');
                //switchToHomeTab();
                //resetActiveButtons();
                //asyncRefreshView($scope,uri); 
            }, function (error) {
                bootbox.confirm("An error occurred, HTTP Request object came back with and Error: <br>\
                                <span style='color:#FF0000'>Error Code:\
                                "+error.status
                                +"</span><br><span style='color:#FF0000'>Error Message:"
                                 + error.message+"</span>", function(result) {
                                                            });
            });
        };
    }
]);//ends controller

function updateListViewArrays($scope,thumbnailSize) {
    for (var i = 0; i < $scope.listview.length; i++) {
        $scope.listview[i].thumbnailsize = thumbnailSize;
        $scope.listview[i].updated = $scope.listview[i].updatedShadowCopy;
        $scope.listview[i].summary = $scope.listview[i].summaryShadowCopy;
    }
    for (var i = 0; i < $scope.searchresultslistview.length; i++ ) {
        $scope.searchresultslistview[i].thumbnailsize = thumbnailSize;
        $scope.searchresultslistview[i].updated = $scope.searchresultslistview[i].updatedShadowCopy;
        $scope.searchresultslistview[i].summary = $scope.searchresultslistview[i].summaryShadowCopy;
    }
}

function updateSmallIconsArrays($scope,thumbnailSize) {
    for (var i = 0; i < $scope.assetssmall.length; i++)
        $scope.assetssmall[i].thumbnailsize = thumbnailSize;

    for (var i = 0; i < $scope.searchresultssmall.length; i++)
        $scope.searchresultssmall[i].thumbnailsize = thumbnailSize;
}

function updateLargeIconsArrays($scope,thumbnailSize) {
    for (var i = 0; i < $scope.assetslarge.length; i++) 
        $scope.assetslarge[i].thumbnailsize = thumbnailSize;

    for (var i = 0; i < $scope.searchresultslarge.length; i++) 
        $scope.searchresultslarge[i].thumbnailsize = thumbnailSize;
}

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
function asyncRefreshView($scope,uri,progressElement) {
    // First let's reset progress and hide everything
    progressCompleted = false;
    stackCounterPush();
    resetProgress();
    //showElement('progressFeedback');
    showElement(progressElement);
    initiateProgress();
    hideCarousel();
    hideCarouselLoadingFeedback();
    hideAssetInteractingFeedback();

    $.when(fetchData(uri)
    ).done(function(data) {
        var currentResource = determineResourceType(data);
        switch (currentResource) {   
        case resourceType.service:
            processServiceResource(data, 'Home Resources', self);
            appendToBreadCrumbs('Services',findContentUrlForRelation(data,constants.linkRelationSelf));
            $scope.breadcrumbsData = getBreadcrumbs();
            resetLightBoxView($scope);
            resetPreview($scope);
            setCurrentObjectJsonRepresentation(null);
            asyncRefreshView($scope,getCurrentLocation(),progressElement);
            break;
        case resourceType.repository:
            $scope.folders = getDataFromLinks(data, constants.iconBook);
            var crumbData = data.name;
            if(!crumbData)
                crumbData = data.title;
            appendToBreadCrumbs(crumbData,findContentUrlForRelation(data,constants.linkRelationSelf));
            $scope.storyboards = getFakeStoryboard();
            $scope.breadcrumbsData = getBreadcrumbs();
            resetLightBoxView($scope);
            resetPreview($scope);
            setCurrentObjectJsonRepresentation(null);
            break;
        case resourceType.renditions:
            var previewArray = getPreviewArray(data);
            if (previewArray.length == 0 || previewArray.length == 1) {
                var previewUrl = findLinkToPreview(data);
                if (!previewUrl || previewUrl == constants.noPreviewReference) {
                    // We're showing an asset, so let's allow user acting on it
                    $scope.folders = getDataForNoPreviewAsset(previewUrl, data);
                    $scope.breadcrumbsData = getBreadcrumbs();
                    resetLightBoxView($scope);
                    resetFolderView($scope);
                } else {
                    // We found single preview, so reload with preview URL
                    saveCurrentLocation(previewUrl);
                    $scope.assetname = data.title;
                    resetLightBoxView($scope);
                    resetFolderView($scope);
                    asyncRefreshView($scope,previewUrl,progressElement);
                }
            } else {
                // Fetch storyboard in async fashion
                fetchStoryBoard(previewArray, false, $scope);
                // For now just add fake to prevent carousel-angular issue with async calls
                $scope.storyboards = getFakeStoryboard();
                $scope.breadcrumbsData = getBreadcrumbs();
                $scope.assetname = data.title;
                resetLightBoxView($scope);
                resetFolderView($scope);
            }
            break;
        case resourceType.collection:    
            var processedData = getDataFromEntries(data);
            if ((data.title) && !data.title.startsWith('Objects under')) 
                appendToBreadCrumbs(data.title,findContentUrlForRelation(data,constants.linkRelationSelf));
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
            $scope.storyboards = getFakeStoryboard();
            $scope.breadcrumbsData = getBreadcrumbs();
            resetPreview($scope);
            break;            
        case resourceType.object:
            var uri = findUrlForLinkRelation(data,null);
            var needToFetchPreviewContent = true;
            if (data.properties && (data.properties.object_name || data.properties.name))
                appendToBreadCrumbs(data.properties.object_name?data.properties.object_name : data.properties.name,findContentUrlForRelation(data,constants.linkRelationSelf));
            else if (data.properties && (data.properties.user_name || data.properties.group_name))
                appendToBreadCrumbs(data.properties.user_name?data.properties.user_name : data.properties.group_name ,findContentUrlForRelation(data,constants.linkRelationSelf));
            else if (data.type) 
                appendToBreadCrumbs(data.type.name?data.type.name : data.type,findContentUrlForRelation(data,constants.linkRelationSelf));
                
            if (data.type === "dm_cabinet" || data.type === "dm_folder") {
                setCurrentObjectJsonRepresentation(null);
            } else if (data.type === "dm_user"
                       || data.type === "dm_group"
                       || data.type === "dm_format"
                       || data.type === "dm_relation"
                       || data.type === "dmc_fav_col_relation"
                       || data.type === "dm_relation_type"
                       || data.type.name) {
                needToFetchPreviewContent = false;
                setCurrentObjectJsonRepresentation(data);
                var icon = constants.userStaticImage;
                if (data.type === "dm_group") 
                    icon = constants.groupStaticImage;
                else if (data.type === "dm_format") 
                    icon = constants.formatStaticImage;
                else if (data.type === "dm_relation" || data.type === "dmc_fav_col_relation" || data.type === "dm_relation_type") 
                    icon = constants.relationStaticImage;
                else if (data.type.name) 
                    icon = constants.typeStaticImage;
                var dataArray = new Array();
                dataArray.push({
                    preview: icon
                });
                $scope.links = dataArray;
            } else {
                setCurrentObjectJsonRepresentation(data);
                var primaryContentUri = findUrlGivenLinkRelation(data,constants.linkRelationPrimaryContent);
                getDownloadUri($scope,primaryContentUri+"?media-url-policy=LOCAL");
            }
            saveCurrentLocation(findUrlForLinkRelation(data,constants.linkRelationSelf));
            resetLightBoxView($scope);
            if (needToFetchPreviewContent)
                resetPreview($scope);
            resetFolderView($scope);
            var processedData = getDataFromProperties(data, constants.linkRelationContentMedia);
            $scope.updatableProperties = processedData.pop();
            $scope.applicationProperties = processedData.pop();
            $scope.internalProperties = processedData.pop();
            $scope.readOnlyProperties = processedData.pop();
            if (needToFetchPreviewContent) 
                asyncRefreshView($scope,uri,progressElement);
            else
                $scope.breadcrumbsData = getBreadcrumbs();
            break;
        case resourceType.content:
            $scope.assetname = data.properties.object_name;
            $scope.links = getMediaFromProperties(data, constants.linkRelationContentMedia);
            $scope.storyboards = getFakeStoryboard();
            $scope.breadcrumbsData = getBreadcrumbs();
            resetLightBoxView($scope);
            break;
        case resourceType.searchresults:
            resetSearch($scope);
            //hideElement('progressFeedbackSearch');
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
            break;
        case resourceType.checkedout:
            var processedData = getDataFromEntries(data);
            $scope.checkedoutlistview = processedData.pop();
            switchToCheckedOutTab();
            hideElement('checkedOutProgressFeedback');
            break;
        case resourceType.type:
        	var self = findContentUrlForRelation(data,constants.linkRelationSelf);
            appendToBreadCrumbs(data.name,self);
            setCurrentObjectJsonRepresentation(data);
            var icon = constants.typeStaticImage;
            var dataArray = new Array();
            dataArray.push({
                preview: icon
            });
            $scope.links = dataArray;
            saveCurrentLocation(self);
            resetLightBoxView($scope);
            resetFolderView($scope);
            var processedData = getTypePropertyInfoFromProperties(data);
            $scope.typeProperties = processedData;
            $scope.breadcrumbsData = getBreadcrumbs();
            break;
        case resourceType.batchableResources:
        	var self = findContentUrlForRelation(data,constants.linkRelationSelf);
            appendToBreadCrumbs("batchable-resources",self);
            setCurrentObjectJsonRepresentation(data);
            var icon = constants.uknownStaticImage;
            var dataArray = new Array();
            dataArray.push({
                preview: icon
            });
            $scope.links = dataArray;
            saveCurrentLocation(self);
            resetLightBoxView($scope);
            resetFolderView($scope);
            var batchableResources = getBatchableResourcesFromData(data);
            $scope.batchableResources = batchableResources;
            $scope.breadcrumbsData = getBreadcrumbs();
            break;
        case resourceType.unknown:
            
            break;
        default:
            bootbox.confirm("Uknown resource type returned: "+currentResource);
        }
        $scope.$apply();
        stackCounterPop();
        if (stackCounterSize() == 0)
        {
            progressCompleted = true;
            hideElement(progressElement);
        }
    }).fail(function(xhr,error) {
        hideElement(progressElement);
    });
}

function getDownloadUri($scope,uri) {
    $.when(fetchData(uri,{error:function(){
    	$scope.downloaduri = undefined;
    	setTimeout(function(){
	    	if(!$(document.getElementById('downloadButton')).hasClass("disabled")){
	    		$(document.getElementById('downloadButton')).addClass("disabled");
	    	}
    	},100);
    }})
    ).done(function(data) {
       var uri = findUrlGivenLinkRelation(data,constants.linkRelationContentMedia); 
       $scope.downloaduri = uri;
       $scope.$apply();
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

// Fetch storyboard - entire array in chunks of four, to give perception of speed for
// large assets
function fetchStoryBoard(previewArray, append, $scope) {
    if (!append) {
        stackCounterPush();
        showElement('progressFeedback');
    }

    var classnameactive = "item active";
    var classactive = constants.activeState;
    $.when(getStoryBoardImage(previewArray[0]),
        getStoryBoardImage(previewArray[1]),
        getStoryBoardImage(previewArray[2]),
        getStoryBoardImage(previewArray[3])
    ).done(function (firstArg, secondArg, thirdArg, fourthArg) {
        var allData = [].concat(firstArg[0]).concat(secondArg[0]).concat(thirdArg[0]).concat(fourthArg[0]);
        var storyboardUrlArray = getCombinedStoryBoard(allData, constants.linkRelationContentMedia);
        var dataArray = new Array();
        for (var i = 0; i < storyboardUrlArray.length; i++) {
            if (i > 0 || append) {
                classnameactive = "item";
                classactive = "";
            }

            dataArray.push({
                preview: storyboardUrlArray[i],
                previewheading: "",
                slide: i.toString(),
                classactive: classactive,
                classname: classnameactive
            });
        }
        
        if (append)
            for (var i = 0; i < dataArray.length; i++)
                $scope.storyboards.push(dataArray[i]);
        else
            $scope.storyboards = dataArray;
            
        if (!append) {
            stackCounterPop();
            if (stackCounterSize() == 0)
                hideElement('progressFeedback');
            // Storyboard was found, let's make carousel visible
            showCarousel();
        }   
        hideCarouselLoadingFeedback();

        $scope.$apply();
        var previewArrayUnusedReferences = previewArray.slice(4);
        var unusedElementCount = previewArrayUnusedReferences.length;
        if (unusedElementCount > 4) {
            showCarouselLoadingFeedback();
            fetchStoryBoard(previewArrayUnusedReferences, true, $scope);
        }
    });
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

// Helper function to populate non-existent storyboard
// Otherwise Angular fail to populate ng-repeat for storyboard div
// and we end up with half-baked carousel component, which is hidden anyhow
// but throws javascript type errors
function getFakeStoryboard() {
    var fakeStoryArray = new Array();
    fakeStoryArray.push({
        preview: "",
        previewheading: "",
        slide: 0,
        classactive: "",
        classname: ""
    });
    return fakeStoryArray;
}


