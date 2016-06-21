/* 
 * Here are methods helping with navigation actions
 *
 */ 

// Convienience to check for HTML5 storage object which I use heavily
function supportsHtml5Storage() {
    try { return 'localStorage' in window && window['localStorage'] !== null; }
    catch (e) { return false; }
}

// Handle to push/pop counter helpful in
// dealing with state based on recursive calls
var recursiveCounter = new Array();
function stackCounterPush() {
    recursiveCounter.push('something');
}
function stackCounterPop() {
    recursiveCounter.pop();
}
function stackCounterSize() {
    return recursiveCounter.length;
}

// Keep track of where we are for proper
// functioning of Back button and breadcrumbs
function goOneStepBack() {
    popFromBreadCrumbs();
    var previousLocation = getLastHrefFromBreadCrumbs();
    if (!previousLocation)
        previousLocation = getHomeUri();
    
    setCurrentLocation(previousLocation);
}
 
// Save current URL in local storage   
function saveCurrentLocation(uri) {
    if(!supportsHtml5Storage())
        return false;
    
    setCurrentLocation(uri);
    return true;
}

// Refresh current view, for now we refresh entire window
function refreshView() {
    window.location.reload();
}

// This resets navigation back to Home starting point
function resetNavigation() {
    setCurrentLocation(getHomeUri());
    resetBreadCrumbs();
    refreshView();
}

// Called by onload - to resume browsing after reload
// Start from Home resource in case we don't find any other reference
function resumeBrowse() {
    if(!supportsHtml5Storage())
            return false;
    var whereToLoad = getLastHrefFromBreadCrumbs();
    if (!whereToLoad)
        return getHomeUri();
    return {crumb:getLastValueFromBreadCrumbs(),uri:getLastHrefFromBreadCrumbs()};
}

window.onload = function() {
    resumeBrowse();
};