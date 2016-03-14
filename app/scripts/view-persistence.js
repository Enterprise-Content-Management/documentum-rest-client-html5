/*
 * This should be the only file dealing with localStorage
 * We want to avoid directly exposing localStorage to prevent
 * global variables headache.
 * This file exposes accessor methods for underlying localStorage
 */

function setCurrentView(selectedView) {
    if (selectedView == constants.smallIconView)
    {
            localStorage[constants.thumbnailSize] = constants.defaultThumbnailSize;
            localStorage[constants.listViewActive] = 'false';
            localStorage[constants.currentViewType] = viewType.smallIcons;
    }
    else if (selectedView == constants.largeIconView) {
            localStorage[constants.thumbnailSize] = constants.largeThumbnailSize;
            localStorage[constants.listViewActive] = 'false';
            localStorage[constants.currentViewType] = viewType.largeIcons;
    }
    else if (selectedView == constants.listView) {
            localStorage[constants.thumbnailSize] = constants.defaultThumbnailSize;
            localStorage[constants.listViewActive] = 'true';
            localStorage[constants.currentViewType] = viewType.listView;
    } 
}
function getCurrentView() {
    var currentView = localStorage[constants.currentViewType];
    return +currentView;
}
function isListView() {
    if (!localStorage[constants.listViewActive]) 
        return false;
    return localStorage[constants.listViewActive] === 'true';
}

function getThumnbailSize() {
    if (!localStorage[constants.thumbnailSize])
        setCurrentView(constants.largeIconView);

    return localStorage[constants.thumbnailSize];
}

function setCurrentObjectJsonRepresentation(data) {
    if (data === "null" || !data) {
        localStorage[constants.currentObjectJsonRepresentation] = data;
    } else {
        var a = [];
        a.push(data);
        localStorage[constants.currentObjectJsonRepresentation] = JSON.stringify(a);
    }
}
function getCurrentObjectJsonRepresentation() {
    var jsonData = [];
    var data = localStorage[constants.currentObjectJsonRepresentation];
    if (!data || data  === "null") {
        return null;
    }
    jsonData = JSON.parse(data);
    return jsonData ? jsonData[0] : null;
}

function setBasicAuthFormattedCredentials(credentials) {
    localStorage[constants.basicAuthFormattedCredentials] = credentials;
}
function getBasicAuthFormattedCredentials() {
    return localStorage[constants.basicAuthFormattedCredentials];
}
function removeCredentials() {
    localStorage.removeItem(constants.basicAuthFormattedCredentials);
    removeHomeUri();
}

function setDqlTemplate(uri) {
    localStorage[constants.dqlTemplate] = uri;
}
function getDqlTemplate() {
    return localStorage[constants.dqlTemplate];
}

function setCheckedOutUri(uri) {
    localStorage[constants.checkedOutUri] = uri;
}
function getCheckedOutUri() {
    return localStorage[constants.checkedOutUri];
}

function setCurrentObjectCheckoutUri(uri) {
    localStorage[constants.currentObjectCheckOutUri] = uri;
}
function getCurrentObjectCheckOutUri() {
    return localStorage[constants.currentObjectCheckOutUri];
}

function setCurrentObjectCancelCheckOutUri(uri) {
    localStorage[constants.currentObjectCancelCheckOutUri] = uri;
}
function getCurrentObjectCancelCheckOutUri() {
    return localStorage[constants.currentObjectCancelCheckOutUri];
}

function setCurrentObjectCheckInUri(uri) {
    localStorage[constants.currentObjectCheckInUri] = uri;
}
function getCurrentObjectCheckInUri() {
    return localStorage[constants.currentObjectCheckInUri];
}

function isUserProfileConfigured() {
    if(!getBasicAuthFormattedCredentials() || (getBasicAuthFormattedCredentials().length == 0) || !getHomeUri() || (getHomeUri().length == 0))
        return false;
    else
        return true;
}

function setCurrentObjectReference(uri) {
    localStorage[constants.currentObjectRef] = uri;
}
function getCurrentObjectReference() {
    return localStorage[constants.currentObjectRef];
}
function setCurrentFolderReference(uri,label) {
    localStorage[constants.currentFolderResourceUri] = uri;
    localStorage[constants.currentFolderResourceName] = label;
}
function getCurrentFolderReference() {
    return localStorage[constants.currentFolderResourceUri];
}

function setVersionInfoReference(uri) {
    localStorage[constants.versionDataUri] = uri;
}
function getVersionResourceReference() {
    return localStorage[constants.versionDataUri];
}

function setHomeUri(uri) {
    localStorage[constants.homeURI] = uri;
}
function getHomeUri() {
    return localStorage[constants.homeURI];
}
function removeHomeUri() {
    localStorage.removeItem(constants.homeURI);
}

function setCurrentLocation(uri) {
    localStorage[constants.currentLocation] = uri;
}
function getCurrentLocation() {
    return localStorage[constants.currentLocation];
}

function getLastValueFromBreadCrumbs() {
    var breadCrumbArray = new Array();
    breadCrumbArray = localStorage[constants.breadCrumbs].split(';');
    return breadCrumbArray[breadCrumbArray.length-1];
}
function getLastHrefFromBreadCrumbs() {
    var breadCrumbArray = new Array();
    breadCrumbArray = localStorage[constants.breadCrumbsHref].split(';');
    return breadCrumbArray[breadCrumbArray.length-1];
}
function popFromBreadCrumbs() {
    var breadCrumbArray = new Array();
    breadCrumbArray = localStorage[constants.breadCrumbs].split(';');
    var popped = breadCrumbArray.pop();
    
    var breadCrumbHrefs = new Array();
    breadCrumbHrefs = localStorage[constants.breadCrumbsHref].split(';');
    breadCrumbHrefs.pop();
    
    localStorage[constants.breadCrumbs] = breadCrumbArray.join(";");
    localStorage[constants.breadCrumbsHref] = breadCrumbHrefs.join(";");
}
function appendToBreadCrumbs(current,href) {
    // Lame attempt to prevent pushing same value when user hits refresh
    var lastBreadCrumb = getLastValueFromBreadCrumbs();
    if(lastBreadCrumb == current)
        return;
    
    var breadCrumbArray = new Array();
    breadCrumbArray = localStorage[constants.breadCrumbs].split(';');
    breadCrumbArray.push(current);
    localStorage[constants.breadCrumbs] = breadCrumbArray.join(";");
    
    if (!href) 
        href = getHomeUri();
        
    var breadCrumbsHref = new Array();
    breadCrumbsHref = localStorage[constants.breadCrumbsHref].split(';');
    breadCrumbsHref.push(href);
    localStorage[constants.breadCrumbsHref] = breadCrumbsHref.join(";");
}
function resetBreadCrumbs() {
    // Reset breadcrumbs here
    var breadCrumbArray = new Array();
    localStorage[constants.breadCrumbs] = breadCrumbArray.join(";");
    localStorage[constants.breadCrumbsHref] = breadCrumbArray.join(";");
}
function getBreadcrumbsAsArray() {
    var breadCrumbArray = new Array();
    breadCrumbArray = localStorage[constants.breadCrumbs].split(';');
    return breadCrumbArray;
}
function getBreadcrumbsHrefsAsArray() {
    var breadCrumbsHref = new Array();
    if (localStorage[constants.breadCrumbsHref])
        breadCrumbsHref = localStorage[constants.breadCrumbsHref].split(';');
        
    return breadCrumbsHref;
}

// Called when user clicks directly on a breadcrumb
function spliceBreadCrumbs(atIndex,total) {
    // First update breadcrumbs array
    var breadCrumbArray = new Array();
    breadCrumbArray = localStorage[constants.breadCrumbs].split(';');
    breadCrumbArray.splice(atIndex,total);
    localStorage[constants.breadCrumbs] = breadCrumbArray.join(";");
    // Now update corresponding href array
    var breadCrumbHrefs = new Array();
    breadCrumbHrefs = localStorage[constants.breadCrumbsHref].split(';');
    breadCrumbHrefs.splice(atIndex,total);
    localStorage[constants.breadCrumbsHref] = breadCrumbHrefs.join(";");
}