/* 
 * This file contains various popup dialogs for our app
 */

// Dialog box to get user credentials and URL to Services resource of EMC REST
function promptForCredentials()
{
    
    bootbox.confirm("<form id='logindetails' action=''>\
                    <span style='color:#1d9d74'>REST Services URL, pointing to Home: services.json</span><br>\
                    <input type='text' class='form-control' placeholder='"+document.location.origin+"/dctm-rest/services.json' name='serverurl'></input><br/>\
                    <span style='color:#1d9d74'>User Name</span><br>\
                    <input type='text' class='form-control'  name='username'></input><br/>\
                    <span style='color:#1d9d74'>Password</span><br>\
                    <input type='password' class='form-control'  name='password'></input>\
                    </form>", function(result) {
                                if(result) {
                                    var loginForm = document.forms['logindetails'];
                                    var homeUri = loginForm.elements['serverurl'].value;
                                    if(!homeUri){
                                    	homeUri = loginForm.elements['serverurl'].placeholder;
                                    }
                                    setHomeUri(homeUri);
                                    setBasicAuthFormattedCredentials(prepareCredentialsForBasicAuth(loginForm.elements['username'].value,loginForm.elements['password'].value));
                                    resetNavigation();
                                }
                            }
    );
}

// Dialog box to get user credentials and URL to Services resource of EMC REST
function editProfile()
{
    var homeUri = getHomeUri();
    var credentials = atob(getBasicAuthFormattedCredentials());
    var username = credentials.substring(0,credentials.indexOf(':'));
    bootbox.confirm("<form id='logindetails' action=''>\
                    <span style='color:#1d9d74'>REST Services URL, pointing to Home: services.json</span><br>\
                    <input type='text' class='form-control' value='"+homeUri+"' name='serverurl'></input><br/>\
                    <span style='color:#1d9d74'>User Name</span><br>\
                    <input type='text' class='form-control' value='"+username+"' name='username'></input><br/>\
                    <span style='color:#1d9d74'>Password</span><br>\
                    <input type='password' class='form-control'  name='password'></input>\
                    </form>", function(result) {
                                if(result)
                                {
                                    var loginForm = document.forms['logindetails'];
                                    setHomeUri(loginForm.elements['serverurl'].value);
                                    if (loginForm.elements['username'].value && loginForm.elements['password'].value) 
                                        setBasicAuthFormattedCredentials(prepareCredentialsForBasicAuth(loginForm.elements['username'].value,loginForm.elements['password'].value));
                                    resetNavigation();
                                }
                            }
    );
}

function resourceNotSupport() {
    bootbox.alert("This resource is currently not supported",function(result) {});      
}

// Delete asset from here   
function deleteCurrentAsset($scope) {
    bootbox.dialog({
        message: "Are you sure you want to delete this asset?",
        title: "You're about to delete asset",
        buttons:
        {
            danger:
            {
                label: "No, get me out!",
                className: "btn-danger",
                callback: function() {
                  // no-op, user bailed
                }
            },
            main:
            {
                label: "Yes, destroy it",
                className: "btn-primary",
                callback: function() {
                    showAssetInteractingFeedback();
                    $.ajax({
                        cache: false,
                        type: "DELETE",
                        async: true,
                        url: getCurrentObjectReference(),
                        contentType: "application/json",
                        beforeSend: function (xhr)
                        {
                            xhr.setRequestHeader("Authorization", "Basic " + getBasicAuthFormattedCredentials());
                        },
                        success: function (data) {
                            hideAssetInteractingFeedback();
                            goOneStepBack();
                            asyncRefreshView($scope,getCurrentLocation(),'progressFeedback');
                        }
                    });
                }
            }
        }
    });
}

function prepareCredentialsForBasicAuth(name, password) {
    return btoa(name + ":" + password);
}

// For logout we need to do credentials cleanup
function signOut() {
    bootbox.dialog({
        message: "Logging out will erase current credentials",
        title: "Are you sure you want to log-out?",
        buttons:
        {
          danger:
          {
            label: "No, get me out!",
            className: "btn-danger",
            callback: function() {
              // no-op if user cancels out
            }
          },
          main:
          {
            label: "Yes, log-out",
            className: "btn-primary",
            callback: function() {
                removeCredentials();
                refreshView();
            }
          }
        }
    });
}

// Quick call to get REST resources version details - no need to authorize for this call
function fetchVersionData() {
        $.ajax({
        cache: false,
        type: "GET",
        async: true,
        url: getVersionResourceReference(),
        contentType: "application/json",
        success: function (response) {
            bootbox.dialog({
            message: "Version: "+response.properties.product_version+"<br/>"+"Revision: "+response.properties.revision_number,
            title: response.properties.product,
            buttons:
            {
              main:
              {
                label: "Close",
                className: "btn-success",
                callback: function() {
                    // no-op, just user dismissing a dialog
                }
              }
            }
          });   
        }
    });
}

// This clears all persistent data on the client
function clearPersistentData() {
    bootbox.dialog({
        message: "About to clear all persistent information kept on the client, including home URI, user data, etc.... You'll have to reset user profile...",
        title: "Are you sure you want clear cached local data?",
        buttons:
        {
          danger:
          {
            label: "No, get me out!",
            className: "btn-danger",
            callback: function() {
              // no-op if user cancels out
            }
          },
          main:
          {
            label: "Yes, clear all",
            className: "btn-primary",
            callback: function() {
                localStorage.clear();
                refreshView();
            }
          }
        }
    });      
}
 
