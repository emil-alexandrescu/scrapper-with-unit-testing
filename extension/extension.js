/************************************************************************************
 This is your Page Code. The appAPI.ready() code block will be executed on every page load.
 For more information please visit our docs site: http://docs.crossrider.com
 *************************************************************************************/


appAPI.ready(function($) {
    appAPI.resources.includeJS('detectstore.js');
    appAPI.resources.includeJS('convertimage.js');
    appAPI.resources.includeJS('toastr.min.js');
    appAPI.resources.includeCSS('toastr.min.css');
    appAPI.resources.includeRemoteJS('http://www.parsecdn.com/js/parse-1.2.18.min.js');

    var storeParser=detectStore(document);
    var product_info;
    console.log(storeParser);
    if (storeParser!=null){
        console.log('************** visiting ' + storeParser.store + ' store ');
        try{
            product_info = storeParser.get_product_page_info(document);
        }catch(e){
            console.log(e);
            product_info = null;
        }
        if (product_info!=null && product_info['product_name']){
            toastr.options = {
                "closeButton": true,
                "debug": false,
                "positionClass": "toast-bottom-right",
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "50000",
                "extendedTimeOut": "10000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            }
            toastr.info(storeParser.store +' product found. <br /><button class="btn-info" id="add-to-cartbox">ADD TO CARTBOX</button>');
        }
    }
    $('#add-to-cartbox').live('click', function(){
        //pare initialize
        Parse.initialize("YCV5ZQm2HBkJ3ugHCDwULH75Nb3NVanr3QscKXXE", "ChwfTXDXKo4UjoSYDbYNWtEFCmoEBraltnYUtVSc");

        //declare classes
        var Product = Parse.Object.extend("Product");
        var ProductImage = Parse.Object.extend("ProductImage");
        var url = document.location.href;

        //save product
        var productobj = new Product();
        productobj.save({
            store: storeParser.store,
            URL: url,
            productName: product_info['product_name'],
            currentPrice: product_info['current_price']*1,
            productID: product_info['id'],
            SKU: product_info['sku'],
            productImages: product_info['images']
        }).then(function(object) {
                console.log(object);
                //save images
                for (var i =0; i<product_info['images'].length; i++){
                    var ext = product_info['images'][i].substr(product_info['images'][i].length-3).toLowerCase();
                    convertImgToBase64(product_info['images'][i], function(base64Img){
                        var file = new Parse.File(storeParser.store+'_'+product_info['id']+'_'+i+'.'+ext, { base64: base64Img });
                        file.save().then(function(data){
                            var imgobj = new ProductImage();
                            imgobj.set("image", file);

                            //set relation to product
                            imgobj.set("parent", object);
                            imgobj.save();
                            console.log(imgobj);
                        }, function(error){
                            console.log(error);
                        })
                    });
                }
            });
    });

});
