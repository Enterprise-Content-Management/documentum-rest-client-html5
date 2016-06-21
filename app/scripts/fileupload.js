
var uploadCompleted = false; 
function resetProgressUpload(elementName) {
    uploadCompleted = false;
    $("#"+elementName).width(0);
}
function initiateProgressUpload(elementName)
{
   var col_md_4_width = $('.col-md-4').width()*4;
   var progress = setInterval(function () {
       var $bar = $("#"+elementName);
       if ($bar.width() >= col_md_4_width || uploadCompleted) {
           clearInterval(progress);
       } else {
            var tickerSize = 20;
            if ($bar.width() > 70)
                tickerSize = 3;
            else if($bar.width() > 80) 
                tickerSize = 2;
            else if($bar.width() > 90) 
                tickerSize = 1;
            
            if ($bar.width() >= 100) 
                $bar.width(0);
            else
                $bar.width($bar.width() + tickerSize);
       }
       var div = Math.floor($bar.width() / (col_md_4_width / 100));
       if (div > 100)
           div = 100;
       $bar.text(div + "%");
   }, 100);
}

function getBuilder(filename, filedata, boundary, formData) {
    var dashdash = '--',
    crlf = '\r\n',
    builder = '';
    
    builder += dashdash;
    builder += boundary;
    builder += crlf;
    builder += 'Content-Disposition: form-data; name=metadata';
    builder += crlf;
    builder += 'Content-Type: application/vnd.emc.documentum+json';
    builder += crlf;
    builder += crlf;
    
    var filenameArray = filename.split(".");
    var fExt = filenameArray.pop();
    var fName = filenameArray.pop();
    
    builder += '{"properties": {';
    builder += '"r_object_type": "dm_document",';
    
    if (formData)
        for (var key in formData)
        {
            if (formData.hasOwnProperty(key)) {
                var keyValue = formData[key];
                if (keyValue && keyValue.length > 0) {
                    builder += '"'+key +'": "'+keyValue+'",';
                }
            }
        }
    else
        builder += '"object_name": "' + fName + '",';
    builder += '"a_content_type": "' + fExt + '"';
    builder += '}}';
    builder += crlf;
    
    builder += dashdash;
    builder += boundary;
    builder += crlf;
    
    builder += 'Content-Disposition: form-data; name=metadata';
    builder += '; filename="' + filename + '"';
    builder += crlf;
    
    builder += 'Content-Type: application/octet-stream';
    builder += crlf;
    builder += crlf; 
    
    builder += filedata;
    builder += crlf;
    
    builder += dashdash;
    builder += boundary;
    builder += dashdash;
    builder += crlf;
    return builder;
}

var targetResult;
var filename;
var span;
var file;
var thumbnailElementId = 'thumbnailCheckin';

function handleFileSelectCheckin(evt) {
    var files = evt.target.files; // FileList object
    var imageDetected = true;
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
      // Only process image files.
      if (!f.type.match('image.*')) {
        imageDetected = false;
      }
        
        
      var thumbReader = new FileReader();
      var binaryReader = new FileReader();
      thumbReader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          if (span) 
            document.getElementById(thumbnailElementId).removeChild(span);
          
          span = document.createElement('span');
          if (!imageDetected) 
                span.innerHTML = ['<img class="thumb" src="img/Unknown.jpg" style="z-index: 1;"/><br>'].join('');
            else
                span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(theFile.name), '"/><br>'].join('');
          thumbnailElementId = 'thumbnailCheckin';
          document.getElementById(thumbnailElementId).insertBefore(span, null);
          file = theFile;
        };
      })(f);
      
      // Closure to capture the file information.
      binaryReader.onload = (function(theFile) {
        return function(e) {
            $(document.getElementById('startCheckInButton')).removeClass("disabled");
            targetResult = e.target.result;
            filename = theFile.name;
            
        };
      })(f);
      // Read in the image file as a data URL.
      thumbReader.readAsDataURL(f);
      binaryReader.readAsBinaryString(f);
    }
}

function uploadContent(uri,appendProperties) {
    var formData = appendProperties? $('form').serializeObject() : null;
    var boundary = '------multipartformboundary' + (new Date).getTime();
    var builder = getBuilder(filename, targetResult, boundary, formData);
    var extension = getExtensionFromFilename(filename);
    var documentumFormat = getDocumentumFormatFromExtension(extension);
    var promise = $.Deferred();
    var xhr = new XMLHttpRequest();
    var formatQueryParameter;
    if (uri.indexOf('?') != -1) 
        formatQueryParameter = "&format=";
    else
        formatQueryParameter = "?format=";

    xhr.open("POST", uri+formatQueryParameter+documentumFormat, true);
    xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' 
        + boundary);
    xhr.setRequestHeader('Accept','application/json;q=0.9,*/*;q=0.8');
    xhr.setRequestHeader("Authorization", "Basic " + getBasicAuthFormattedCredentials()); 
    
    xhr.onload = function(e) { 
                  if (xhr) {
                    var overlayIcon = "done.png";
                    var responseData = jQuery.parseJSON(xhr.responseText);
                    if(isResponseSuccessful(xhr)) {
                        promise.resolve(responseData);
                    } else {
                        overlayIcon = "httperror.png";
                        promise.reject(responseData); 
                    }
                    uploadCompleted = true;
                    
                    span.innerHTML += ['<img class="thumboverlay" src="img/'+overlayIcon+'" style="z-index: 2;"/><br>'].join('');
                    document.getElementById(thumbnailElementId).insertBefore(span, null);
                    //if (getErrorCode(responseData)) 
                    //    return;
                  }
              };
    xhr.onerror = function(e) {
        promise.reject(e);
    };
    
    xhr.sendAsBinary(builder);
    return promise;
}

function isResponseSuccessful(xhr) {
    if(xhr.status >= 400)
        return false;
    else
        return true;
}

function getExtensionFromFilename(filename) {
    // Sanity check
    if (!filename) 
        return null;
    // Check for extension to be present at all
    if (filename.indexOf(".") == -1) 
        return null;
    
    var filenameArray = filename.split(".");
    // One last check for special system and hidden files
    if( filenameArray.length === 1 || ( filenameArray[0] === "" && filenameArray.length === 2 ) ) {
        return "";
    }
    return filenameArray.pop().toLowerCase();
}

function getDocumentumFormatFromExtension(extension) {
    var result = extension;
    for(key in formatMapper) {
        if (formatMapper.hasOwnProperty(key) && key === extension) {
            result = formatMapper[key];
            break;
        }
    }
    return result;
}

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
