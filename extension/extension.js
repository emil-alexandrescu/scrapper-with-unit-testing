/************************************************************************************
 This is your Page Code. The appAPI.ready() code block will be executed on every page load.
 For more information please visit our docs site: http://docs.crossrider.com
 *************************************************************************************/

appAPI.ready(function($) {
    appAPI.resources.includeRemoteJS('http://cartbox.parseapp.com/src/common/addproduct/convertimage.js');
    appAPI.resources.includeRemoteJS('http://cartbox.parseapp.com/src/common/addproduct/detectstore.js');
    appAPI.resources.includeRemoteJS('http://cartbox.parseapp.com/src/common/addproduct/productsave.js');
    appAPI.resources.includeJS('toastr.min.js');
    appAPI.resources.includeCSS('toastr.min.css');
    appAPI.resources.includeRemoteJS('http://www.parsecdn.com/js/parse-1.2.18.min.js');
    //pare initialize
    Parse.initialize("YCV5ZQm2HBkJ3ugHCDwULH75Nb3NVanr3QscKXXE", "ChwfTXDXKo4UjoSYDbYNWtEFCmoEBraltnYUtVSc");

    //detect user if possible
    var currentuser = Parse.User.current();
    if (currentuser){
        appAPI.db.set("usertoken", currentuser._sessionToken);
        console.log(currentuser._sessionToken);
    }else{
        token = appAPI.db.get("usertoken");
        if (token){
            Parse.User.become(token, {
                success : function(user){
                    currentuser = user;
                    console.log(currentuser);
                }
            });
        }
    }

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


        //check if the user is logged in
        var Product = Parse.Object.extend("Product");
        var ProductImage = Parse.Object.extend("ProductImage");
        var User = Parse.Object.extend("User");
        var userQuery = new Parse.Query(User);
        //var currentuser = Parse.User.current();

        if (currentuser != null && currentuser !=undefined){
            console.log(currentuser);
            console.log(currentuser.get("username"));

            userQuery.equalTo("username", currentuser.get("username"));
            userQuery.count({
                success:function(count){
                    if (count === 0){
                        alert("Please log in to add to cartbox");
                        document.location.href = "http://cartbox.parseapp.com/#/signin";
                        return;
                    }else{
                        var url = document.location.href;
                        productSave(product_info, storeParser, url, currentuser );
                    }
                }
            });
        }else{
            alert("Please log in to add to cartbox");
            document.location.href = "http://cartbox.parseapp.com/#/signin";
            return;
        }
    });
});
