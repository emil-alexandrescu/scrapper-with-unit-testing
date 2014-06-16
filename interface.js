
//sniffs the dom for the store type.
//would return null or BestBuyParser or WalmartParser or MagentoParser
function detectStore(dom) {
    var site_name = $(dom).find('meta[property="og:site_name"]')!=undefined ? $(dom).find('meta[property="og:site_name"]').attr('content') : null;
    if (site_name == null) {
        if (/Mage\.Cookies\.domain/.test($(dom).text())) site_name = "Magento";
        if (/Amazon\.com/.test($(dom).find('.nav_last').text())) site_name = "Amazon";
        if ($(dom).find('link[rel^="shortcut"]') && (/demandware/.test($(dom).find('link[rel^="shortcut"]').attr('href')))) site_name = "Demandware";
        if ($(dom).find("input[name^=\"\/atg\/commerce\"]").length>0) site_name = "ATGCommerce";
    }
    switch (site_name){
        case 'Walmart.com':
            return new WalmartParser();
        case 'Best Buy':
            return new BestBuyParser();
        case 'Magento':
            return new MagentoParser();
        case 'Target':
            return new TargetParser();
        case 'Amazon':
            return new AmazonParser();
        case 'Demandware':
            return new DemandwareParser();
        case 'ATGCommerce':
            return new ATGCommerceParser();
        default:  //magento
            return null;
    }
}

TEST_URLS=[
    'www.bestbuy.com/site/seiki-32-class-32-diag--lcd-tv-1080p-hdtv-1080p/1305459296.p',
    'www.walmart.com/ip/West-Bend-0.9-cu.-ft.-900-Watt-Microwave/24950645',
    'www.petermillar.com/men/men-collections/new-arrivals/plaid-justice-sport-coat-italian-wool-blend.html',
    //'shop.bowlersparadise.com/elite-espionage-bowling-ball',
    //'www.libbystory.com/bb-dakota-emalee-sweater.html',
    'www.amazon.com/gp/product/B005HZU7LU/ref=gb1h_img_c-2_1842_c7afe2dc?pf_rd_m=ATVPDKIKX0DER&pf_rd_t=701&pf_rd_s=center-new-2&pf_rd_r=116H4BM0P3P1YDH69VH9&pf_rd_i=20&pf_rd_p=1725241842',
    'www.target.com/p/merona-women-s-knit-maxi-tank-dress/-/A-15107758#prodSlot=large_1_1',
    'www.target.com/p/cherokee-young-mens-school-uniform-short-sleeve-pique-polo/-/A-15245123#prodSlot=medium_1_2',
    'ca.shop.ecco.com/en_CA/722632.html?dwvar_722632_color=58365#cgid=kids-girls-shoes',
    //'www.amazon.com/Lucky-Brand-Elephant-T-Shirt-X-Small/dp/B00IUK0ECQ/ref=sr_1_2',
    //'www.uggaustralia.eu/1004074.html?dwvar_1004074_color=GRZ#icid=Men_Bottomright_Best-sandals20140520&start=6&cgid=men-flip-flops',
    //'www.cr8tiverecreation.com/creative-recreation-adonis-brown-snake-CR330H210.html',
    //'www.cellsignal.com/products/primary-antibodies/9601?N=4294964832&fromPage=plp',
    'www.hollandandbarrett.com/shop/product/vitabiotics-perfectil-max-capsules-60012089'

]

//loads image and set data into base64 format
function convertImgToBase64(url, callback){
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var img = new Image;
    var ext = url.substr(url.length-3).toLowerCase();
    var outputFormat;
    if (ext == 'jpg') outputFormat = 'image/jpeg';
    if (ext == 'png') outputFormat = 'image/png';
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img,0,0);
        var dataURL = canvas.toDataURL(outputFormat);
        callback.call(this, dataURL);
        // Clean up
        canvas = null;
    };
    if (url.substr(0,7) == 'http://') url = 'http://toneproxy.appspot.com/' + url.substr(7);
    if (url.substr(0,8) == 'https://') url = 'http://toneproxy.appspot.com/' + url.substr(8);
    img.src = url;
}

function loadDOMForUrl(url) {
    var orginial_url = url;
    var url='http://toneproxy.appspot.com/' + url;
    $.ajax({url:url}).done(function(response) {
        var parser = new DOMParser();
        var dom = parser.parseFromString(response, "text/html");
        var storeParser=detectStore(dom);
        if (storeParser!=null){
            console.log('**************' + storeParser.store + '*******************');

            //pare initialize
            Parse.initialize("YCV5ZQm2HBkJ3ugHCDwULH75Nb3NVanr3QscKXXE", "ChwfTXDXKo4UjoSYDbYNWtEFCmoEBraltnYUtVSc");

            //declare classes
            var Product = Parse.Object.extend("Product");
            var ProductImage = Parse.Object.extend("ProductImage");

            var product_info = storeParser.get_product_page_info(dom);

            //save product
            var productobj = new Product();
            productobj.save({
                store: storeParser.store,
                URL: orginial_url,
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
        }
    })
}

$( document ).ready(function() {
    //pass it through a proxy server.
    for (var i = 0 ; i<TEST_URLS.length; i++)
        loadDOMForUrl(TEST_URLS[i]);
});






