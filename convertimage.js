//loads image and set data into base64 format
function convertImgToBase64(url, callback){
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var img = new Image();
    var ext = url.substr(url.length-3).toLowerCase();
    var outputFormat;
    if (ext == 'jpg') {outputFormat = 'image/jpeg';}
    if (ext == 'png') {outputFormat = 'image/png';}
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img,0,0);
        var dataURL = canvas.toDataURL(outputFormat);

        //thumbnail
        var maxHeight = 475;
        canvas.height = img.height>maxHeight?maxHeight:img.height;
        canvas.width = img.width*canvas.height/img.height;
        ctx.drawImage(img,0,0,canvas.height,canvas.width);
        var thumbURL = canvas.toDataURL(outputFormat);
        callback.call(this, dataURL, thumbURL);
        // Clean up
        canvas = null;
    };
    if (url.substr(0,7) == 'http://') {url = 'http://toneproxy.appspot.com/' + url.substr(7);}
    if (url.substr(0,8) == 'https://') {url = 'http://toneproxy.appspot.com/' + url.substr(8);}
    img.src = url;
}