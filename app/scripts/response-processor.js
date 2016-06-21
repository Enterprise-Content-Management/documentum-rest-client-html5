/*
 * This file hosts all methods for processing returning JSON
 * data structures  
 */

function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

function getKeyValue(obj, key) {
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            getKeyValue(obj[i], key);
        } else if (i == key && obj[key]) {
            return obj[key];
        }
    }
    return null;
}


// This method is dealing with updating of bindings based on current data set returned from REST call
// As structure of JSON resource is different for some resources, we have different
// parsing routines based on given JSON structure. This one processes data.links array
// We pass JSON data object, name of icon for list view, label for displayText element as
// well as 'self' object reference
function getDataFromLinks(data) {
    var dataArray = new Array();
    if(data && data.links)
        for (var i = 0; i < data.links.length; i++) {
            var updated = '';
            var summary = '';
            var linkRelName = data.links[i].rel;
            var hrefValue = data.links[i].href;
            var notSupported = false;
            var title = normalizeString(linkRelName,'/',true);
            
            if (linkRelName == constants.linkRelationDql){
            	setDqlTemplate(data.links[i].hreftemplate);
            	title = "search-by-name";
            }
            else if (linkRelName == constants.linkRelationBatches){
            	notSupported = true;
            }
            
            if(!hrefValue)
            	hrefValue = data.links[i].hreftemplate;
            
            if(linkRelName == constants.linkRelationSearch)
            	continue;
            
            dataArray.push({
                uri: hrefValue,
                linkRelName:linkRelName,
                notSupported:notSupported,
                title: title,
                shorttitle: shorten(title),
                description: linkRelName,
                realthumbnail: constants.repositoryStaticImage,
                thumbnailsize: getThumnbailSize(),
                updated: updated,
                updatedShadowCopy: updated,
                summary: summary,
                summaryShadowCopy: summary,
                index: i,
            });
        }
    return dataArray;
}

// Similar method as one above, but processing data.entries array
// This method is common for cabinets/folders and asset objects. 
function getDataFromEntries(data) {
    if(!data || !data.title || !data.entries)
        return new Array();
    var iconName = '';
    var isRepository = false;
    if(data.title == "Repositories")
        { iconName = constants.iconBook;isRepository = true; }
    else if(data.title == "Cabinets")
        iconName = constants.iconChevronRight;
    else if(data.title.startsWith("Objects under"))
        iconName = constants.documentStaticImage;
    else if(data.title.startsWith("Users"))
        iconName = constants.userStaticImage;
    else if(data.title.startsWith("Groups"))
        iconName = constants.groupStaticImage;
    else if(data.title.startsWith("Formats"))
        iconName = constants.formatStaticImage;
    else if(data.title.startsWith("Relation"))
        iconName = constants.relationStaticImage;
    else if(data.title.startsWith("Types"))
        iconName = constants.typeStaticImage;

    var folderArray = new Array();
    var assetArray = new Array();
    for (var i = 0; i < data.entries.length; i++) {
        var img = iconName;
        var isFolder = false;
        // Check if object is of type folder and set different icon then
        if(data.entries[i].summary.startsWith(constants.folderObjectType))
            img =  constants.iconChevronRight;
            
        if(data.entries[i].summary.startsWith(constants.folderObjectType) || data.entries[i].summary.startsWith(constants.cabinetObjectType))
            isFolder = true;
        
        // Also locate 'icon' element containing URI to Thumbnail Server image     
        var thumbnailUrl = findIconLink(data,i);
        if(!thumbnailUrl || thumbnailUrl == "")
            if (iconName == "") 
                thumbnailUrl = constants.uknownStaticImage;
            else
                thumbnailUrl = iconName;
        var updated = '';
        var summary = '';
        var updatedCopy = normalizeString(data.entries[i].updated,'T',false);
        var summaryCopy = normalizeString(data.entries[i].summary,' ',false);
        if(isListView()) {
           updated =  updatedCopy;
           summary = summaryCopy;
        }
        if (isFolder || isRepository) 
            folderArray.push({
                uri: data.entries[i].content.src,
                title: normalizeString(data.entries[i].title,'/',true),
                shorttitle: shorten(normalizeString(data.entries[i].title,'/',true)),
                description: data.entries[i].summary,
                relimagelink: img,
                realthumbnail: thumbnailUrl,
                thumbnailsize: getThumnbailSize(),
                updated: updated,
                updatedShadowCopy: updatedCopy,
                summary: summary,
                summaryShadowCopy: summaryCopy,
                index: i,
            });
        else
            assetArray.push({
                uri: data.entries[i].content.src,
                title: normalizeString(data.entries[i].title,'/',true),
                shorttitle: shorten(normalizeString(data.entries[i].title,'/',true)),
                description: data.entries[i].summary,
                relimagelink: img,
                realthumbnail: thumbnailUrl,
                thumbnailsize: getThumnbailSize(),
                updated: updated,
                updatedShadowCopy: updatedCopy,
                summary: summary,
                summaryShadowCopy: summaryCopy,
                index: i,
            });
    }
    var dataArray = new Array();
    dataArray.push(folderArray);
    dataArray.push(assetArray);
    return dataArray;
}

// Similar method as one above, but processing data.entries array
// This method is common for cabinets/folders and asset objects. 
function getDataFromSearchEntries(data) {
    if (!data || !data.entries) 
        return null;

    var img = constants.iconFile;
    var assetArray = new Array();
    for (var i = 0; i < data.entries.length; i++) {
        var updated = '';
        var summary = '';
        var updatedCopy = normalizeString(data.entries[i].updated,'T',false);
        var summaryCopy = normalizeString(data.entries[i].content.properties.r_object_type,' ',false);
        if(isListView()) {
           updated =  updatedCopy;
           summary = summaryCopy;
        }
        var uri = '';
        var entry = data.entries[i];
        for(var j in entry.links){
        	var link = entry.links[j];
        	if(link.rel == 'edit'){
        		uri = link.href;
        	}
        }
        assetArray.push({
            uri: uri,
            title: normalizeString(data.entries[i].content.properties.object_name,'/',true),
            shorttitle: shorten(normalizeString(data.entries[i].content.properties.object_name,'/',true)),
            description: data.entries[i].content.name,
            relimagelink: img,
            realthumbnail: data.entries[i].content.properties.thumbnail_url,
            thumbnailsize: getThumnbailSize(),
            updated: updated,
            updatedShadowCopy: updatedCopy,
            summary: summary,
            summaryShadowCopy: summaryCopy,
            index: i,
        });
    }
    return assetArray;
}

// Yet another processing of JSON response, data.link array. Used
// during preview action it will update preview information
function getDataFromProperties(data,linkName) {
    var dataArray = new Array();
    var allProperties = new Array();
    var updatableProperties = new Array();
    var readOnlyProperties = new Array();
    var internalProperties = new Array();
    var applicationProperties = new Array();
    if(data.properties)
        for(key in data.properties) {
            var value = data.properties[key];
            
            if (value && value.length > +constants.maxStandardStringLength) 
                value = normalizeString(value,'000',false);
            
            if (key.startsWith("r_"))
                readOnlyProperties.push({
                    propertyKey: key.substring(2),
                    propertyValue: value
                });
            else if(key.startsWith("i_"))
                internalProperties.push({
                    propertyKey: key.substring(2),
                    propertyValue: value
                });
            else if(key.startsWith("a_"))
                applicationProperties.push({
                    propertyKey: key.substring(2),
                    propertyValue: value
                });
            else
                updatableProperties.push({
                    propertyKey: key,
                    propertyValue: value
                });
        }
    else if (data.type&&data.type.properties) {
        for(key in data.type.properties) {
            var value = data.type.properties[key];
            var name = value['name'];
            var type = value['type'];
            
            if (name.startsWith("r_"))
                readOnlyProperties.push({
                    propertyKey: name.substring(2),
                    propertyValue: type
                });
            else if(name.startsWith("i_"))
                internalProperties.push({
                    propertyKey: name.substring(2),
                    propertyValue: type
                });
            else if(name.startsWith("a_"))
                applicationProperties.push({
                    propertyKey: name.substring(2),
                    propertyValue: type
                });
            else
                updatableProperties.push({
                    propertyKey: name,
                    propertyValue: type
                });
        }
    }
    dataArray.push(readOnlyProperties);
    dataArray.push(internalProperties);
    dataArray.push(applicationProperties);
    dataArray.push(updatableProperties);
    return dataArray;
}

//Yet another processing of JSON response, data.link array. Used
//during preview action it will update preview information
//TODO
function getTypePropertyInfoFromProperties(data) {
 var dataArray = new Array();
 var allProperties = new Array();
 var properties = data.properties;
 var attributes;
 for(var i = 0; i< properties.length; i++) {
     var property = data.properties[i];
     attributes = new Array();
     for(var attribute in property){
    	 attributes.push({
             attributeKey: attribute,
             attributeValue: property[attribute]
         });
     }
     allProperties.push(attributes);
 }
 return allProperties;
}

function getBatchableResourcesFromData(data) {
	if(data['batchable-resources']&&data['batchable-resources'].length>0){
		return data['batchable-resources'];
	}else
	 return new Array();
	}

// Yet another processing of JSON response, data.link array. Used
// during preview action it will update preview information
function getMediaFromProperties(data,linkName) {
    var dataArray = new Array();
    if (data && data.links) 
        for (var i = 0; i < data.links.length; i++) {
            if(data.links[i].rel == linkName) {
                dataArray.push({
                    preview: data.links[i].href
                });
                break;
            }
        }
    return dataArray;
}

// Check current set of links for given data.entry sub element to find
// 'icon' relation. Return either a link or an empty string
function findIconLink(data,i) {
    if(!data || !data.entries)
        return null;
    for (var x = 0; x < data.entries[i].links.length; x++)
        if(data.entries[i].links[x].rel == constants.linkRelationIcon)
            return data.entries[i].links[x].href;
            
    return "";
}

// For JSON responses that don't need new rendering, we just want to find next link relation link
// and follow there
function findUrlForLinkRelation(data,linkRelToFind) {
    var uri;
    if (data.type && data.type.name) 
        return null;

    var linkRelName = linkRelToFind ? linkRelToFind : constants.linkRelationContents;
    // If we deal with object itself, searching for link relation "contents" we need to
    // update reference to actual object, which is helpfule for actions like DELETE
    var updateObjectReference = false;
    if(data.type == constants.documentObjectType)
        updateObjectReference = true;
    // We need to keep track of current folder reference which we use during Upload feature   
    var updateFolderResourceReference = false;
    if(data.type == constants.cabinetObjectType || data.type == constants.folderObjectType) {
        updateFolderResourceReference = true;
        linkRelName = constants.linkRelationObjects;
    }
    
    var foundCancelCheckIn = false;   
    for (var i = 0; i < data.links.length; i++) {
        var name = data.links[i].rel;
        // Check for relation name we're looking
        if(name == linkRelName)
            uri = data.links[i].href;
        // Update current object reference   
        if(name == constants.linkRelationSelf)
            setCurrentObjectReference(data.links[i].href);
            
        if (updateObjectReference && name == constants.linkRelationCheckout) {
            setCurrentObjectCheckoutUri(data.links[i].href);
        }
        else if (updateObjectReference && name == constants.linkRelationCancelCheckOut) {
            setCurrentObjectCancelCheckOutUri(data.links[i].href);
            foundCancelCheckIn = true;
        }
        else if (updateObjectReference && name == constants.linkRelationCheckInNextMajor) {
            setCurrentObjectCheckInUri(data.links[i].href);
        }
        // Update current folder references   
        if(updateFolderResourceReference && name == constants.linkRelationObjects)
            setCurrentFolderReference(data.links[i].href,data.properties.r_object_type +" "+ data.properties.object_name);
          
    }
    return uri;
}

function findUrlGivenLinkRelation(data, relName) {
    var uri;
    if(data && data.links)
        for (var i = 0; i < data.links.length; i++) {
            var name = data.links[i].rel;
            // Check for relation name we're looking
            if(name == relName) {
                uri = data.links[i].href;
                break;
            }
        }
    return uri;
}

function processCollection(data,$scope,viewDataStore){
    if ((data.title) && !data.title.startsWith('Objects under')) 
        appendToBreadCrumbs(data.title,findContentUrlForRelation(data,constants.linkRelationSelf));
    $scope.breadcrumbsData = getBreadcrumbs();
    viewDataStore.setData(data);
    toTemplate("/collection");
}

function processCheckedOutObjects(data,$scope,viewDataStore){
	//TODO checkedout tab
	appendToBreadCrumbs(data.title,findContentUrlForRelation(data,constants.linkRelationSelf));
    $scope.breadcrumbsData = getBreadcrumbs();
    viewDataStore.setData(data);
    toTemplate("/collection");
}

function processFolder(data,$scope,viewDataStore){
	var uri = findUrlGivenLinkRelation(data,constants.linkRelationObjects);
	var self = findContentUrlForRelation(data,constants.linkRelationSelf);
    appendToBreadCrumbs(data.properties.object_name,self);
    setCurrentObjectJsonRepresentation(null);
    saveCurrentLocation(self);
    asyncRefreshView($scope,uri,viewDataStore);
}

function processContentlessObject(data,$scope,viewDataStore){
	var breadCrumbsName = 'object';
	if(data.name == "user"){
		breadCrumbsName = data.properties.user_name
	}else if (data.name == "group"){
		breadCrumbsName = data.properties.group_name
	}else if( data.name == "format"){
		breadCrumbsName = data.properties.name
	}else if( data.name == "relation" || data.name == "relation-type"){
		breadCrumbsName = data.properties.relation_name
	}else if( data.name == "network-location"){
		breadCrumbsName = data.properties.netloc_ident
	}else if( data.type ){
		breadCrumbsName = data.type.name?data.type.name : data.type;
	}
	var self = findContentUrlForRelation(data,constants.linkRelationSelf);
	appendToBreadCrumbs(breadCrumbsName,self);
	saveCurrentLocation(self);
	$scope.breadcrumbsData = getBreadcrumbs();
	viewDataStore.setData(data);
    toTemplate("/contentless");
    
}

function processContentfulObject(data,$scope,viewDataStore){
	appendToBreadCrumbs(data.properties.object_name,findContentUrlForRelation(data,constants.linkRelationSelf));
	$scope.breadcrumbsData = getBreadcrumbs();
    viewDataStore.setData(data);
    toTemplate("/contentful");
}

function processTypeResource(data,$scope,viewDataStore){
    var self = findContentUrlForRelation(data,constants.linkRelationSelf);
    saveCurrentLocation(self);
    appendToBreadCrumbs(data.name,self);
    $scope.breadcrumbsData = getBreadcrumbs();
    viewDataStore.setData(data);
    toTemplate("/type");
}

function processBatchableResources(data,$scope,viewDataStore){
	var self = findContentUrlForRelation(data,constants.linkRelationSelf);
	saveCurrentLocation(self);
    appendToBreadCrumbs("batchable-resources",self);
    $scope.breadcrumbsData = getBreadcrumbs();
    viewDataStore.setData(data);
    toTemplate("/batchables");
}

function processRepositoryResource(data,$scope,viewDataStore){
    var crumbData = data.name;
    if(!crumbData)
        crumbData = data.title;
    appendToBreadCrumbs(crumbData,findContentUrlForRelation(data,constants.linkRelationSelf));
    $scope.breadcrumbsData = getBreadcrumbs();
    saveCurrentLocation(findContentUrlForRelation(data,constants.linkRelationSelf));
    setCurrentObjectJsonRepresentation(null);
    viewDataStore.setData(data);
    toTemplate("/repository");
}

function processServicesResource(data,uri,$scope,viewDataStore){
	//clear bread crumbs, start from scratch
	resetBreadCrumbs();
	appendToBreadCrumbs('Services',uri);
	var repositoriesLink = getRepositoriesLinkRelInServices(data);
	var aboutLink = getAboutRepositoriesLinkRelInServices(data);
    setVersionInfoReference(aboutLink);
    $scope.breadcrumbsData = getBreadcrumbs();
    setCurrentObjectJsonRepresentation(null);
    asyncRefreshView($scope,repositoriesLink,viewDataStore);
}

function toTemplate(path){
	location.hash = "";
	localStorage["currentTemplate"] =  path;
	location.hash = path;
}

function toSeachTabView(){
	location.hash = "";
	location.hash = "/search";
}

function getRepositoriesLinkRelInServices(data) {
	if(data.resources&&data.resources[constants.linkRelationRepositories]&&data.resources[constants.linkRelationRepositories].href){
		return data.resources[constants.linkRelationRepositories].href;
	}
	return null;
}

function getAboutRepositoriesLinkRelInServices(data) {
	if(data.resources&&data.resources[constants.linkRelationAbout]&&data.resources[constants.linkRelationAbout].href){
		return data.resources[constants.linkRelationAbout].href;
	}
	return null;
}

// Convoluted logic to find best preview for given asset
// It varies based on renditions available and given format object
function findLinkToPreview(data) {
    if(!data){
    	data = {}
    }
    if(!data.entries){
    	data.entries = [];
    }
        
    var contenturl = null;
    var previewlocation = null;
    var lreslocation = null;
    var thumblocationsmall = null;
    var thumblocationmedium = null;
    var thumblocationlarge = null;
    var primarylocation = null;
    var previewfound = false;
    for (var i = 0; i < data.entries.length; i++) {
        if(data.entries[i].title.startsWith("Content [page: 0, format: jpeg_preview")) {
            previewlocation = data.entries[i].content.src;
            previewfound = true;
            break;
        }
        else if(data.entries[i].title.startsWith("Content [page: 0, format: jpeg_lres")) {
            lreslocation = data.entries[i].content.src;
        }
        else if(data.entries[i].title.startsWith("Content [page: 0, format: jpeg_th, modifier: large_jpeg_th")) {
            thumblocationlarge = data.entries[i].content.src;
        }
        else if(data.entries[i].title.startsWith("Content [page: 0, format: jpeg_th, modifier: medium_jpeg_th")) {
            thumblocationmedium = data.entries[i].content.src;
        }
        else if(data.entries[i].title.startsWith("Content [page: 0, format: jpeg_th, modifier: small_jpeg_th")) {
            thumblocationsmall = data.entries[i].content.src;
        }
        else {
            primarylocation = data.entries[i].content.src;
        }
        
    }
    if(previewlocation)
        contenturl = previewlocation;
    else if(lreslocation)
        contenturl = lreslocation;
    else if(thumblocationlarge)
        contenturl = thumblocationlarge;
    else if(thumblocationmedium)
        contenturl = thumblocationmedium;
    else if(thumblocationsmall)
        contenturl = thumblocationsmall;
        
    if(!contenturl)
        contenturl = primarylocation;
        
    return contenturl;
}

// Loop through all entries of Media Contents resource to find all storyboard renditions matching
// given preview format, ie. jpeg_story, jpeg_preview, jpeg_lres, etc
function findStoryBoard(data,previewFormat) {
    var previewArray = new Array();
    if(data && data.entries)
        for (var i = 0; i < data.entries.length; i++)
            if(data.entries[i].title.startsWith("Content [page: 0, format: "+previewFormat) && containsNonEmptyPageModifier(data.entries[i].title))
                previewArray.push(data.entries[i].content.src);
       
    return previewArray;
}
// This method looks at content description to find valid page modifier, to be able to
// differentiate between valid storyboard rendition, which contains non empty modifier and
// other renditions of the same format, which usually don't have modifier set.
// Description is of the format: "Content [page: 0, format: jpeg_story, modifier: 000000000]"
function containsNonEmptyPageModifier(description) {
    if (!description) 
        return false;

    var indexLocation = description.indexOf(constants.pageModifierString);
    if (indexLocation != -1) {
        var lastBracketIndex = description.lastIndexOf("]");
        var modifier = description.substring(indexLocation+constants.pageModifierString.length,lastBracketIndex);
        // Account for string containing just a space char which is not a valid page modifier
        if (modifier && modifier.length > 1) {
            return true;
        }
    }
    return false;
}

// In given result find URI for given link relation and return it
function findContentUrlForRelation(data,linkRelName) {
    var uri;
    if (data && data.links) {
        for (var i = 0; i < data.links.length; i++)
        if(data.links[i].rel == linkRelName) {
            uri = data.links[i].href;
            break;
        }
    }
    else if (data && data.type && data.type.name) {
        for (var i = 0; i < data.type.links.length; i++)
        if(data.type.links[i].rel == linkRelName) {
            uri = data.type.links[i].href;
            break;
        }
    }
    return uri;   
}

// data below represents collection of multiple JSON results
// and we'll need to iterate through each to pull single
// storyboard item from each result
function getCombinedStoryBoard(data,linkRelName) {
    var storyArray = new Array();
    var counter = 0;
    for(var i = 0; i < data.length; i++) {
        var uri = findContentUrlForRelation(data[i],linkRelName);
        if (uri) 
            storyArray[counter++] = uri;
    }
    return storyArray;
}

// Look at the JSON structure and determine what resource we're dealing with
function determineResourceType(data) {
    var resource = resourceType.unknown;
    if (data.resources)
    	return resourceType.service;
    else if (data.servers)
    	return resourceType.repository;
    else if (data.title)
        if (data.title.startsWith("Contents of"))
        	return resourceType.renditions;
        else if (data.title.startsWith("DQL query results"))
        	return resourceType.searchresults;
        else if (data.title.startsWith("Checked-out objects"))
        	return resourceType.checkedout;
        else
            return resourceType.collection;
    else if (data.properties&&data.properties instanceof Array)
    	return resourceType.type;
    else if (data['batchable-resources'])
    	return resourceType.batchableResources;
    else if (data.name){
    	resource = resourceType.object;
    	if(data.name === "content"){
    		return resourceType.content;
    	}else if (data.type === "dm_cabinet" || data.type === "dm_folder") {
    		return resourceType.folder;
        }else if (data.name === "user"
               || data.name === "group"
               || data.name === "format"
               || data.name === "relation"
               || data.name === "relation-type"
               || data.name === "network-location"
               || (data.type&&data.type.name)) {
        	return resourceType.contentless;
        }else if(data.links){
        	var links = data.links;
        	var link;
        	for(var i = 0; i<links.length;i++){
        		link = links[i];
        		if(link.rel === constants.linkRelationPrimaryContent){
        			return resourceType.contentful;
        		}
        	}
        }
    }
        
    return resource;   
}

// Trim string if too long
function normalizeString(mystring,marker,discardFront) {
    var adjustedString = mystring;
    
    if(!adjustedString)
        adjustedString = '';
    
    var maxStringLength = +constants.maxStandardStringLength;
    // If the string is a URI, trim first part, leaving anything after last slash
    var markerIndex = adjustedString.lastIndexOf(marker);
    if(markerIndex != -1)
        if (discardFront)
            adjustedString = adjustedString.substring(markerIndex+1,adjustedString.length);
        else
            adjustedString = adjustedString.substring(0,markerIndex);
    if(adjustedString.length > maxStringLength)
        adjustedString = adjustedString.substring(0,maxStringLength)+'...';
          
    return adjustedString;
}

// Common way of creating shorter strings
function shorten(mystring) {
    var maxShortStringLength = +constants.maxShortStringLength;
    if (mystring.length < maxShortStringLength)
        return mystring;
    else
        return mystring.substring(0,maxShortStringLength);
}

function getErrorCode(data) {
    if (data.status) 
        return data.status;
    else
        return null;
    
}

// Generic String 'startsWith' comparison function
if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function (prefix){
      return this.indexOf(prefix) == 0;
    };
}
if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}
