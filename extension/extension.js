/************************************************************************************
 This is your Page Code. The appAPI.ready() code block will be executed on every page load.
 For more information please visit our docs site: http://docs.crossrider.com
 *************************************************************************************/


appAPI.ready(function($) {

    function BestBuyParser() {
        this.store='bestbuy'
        this.get_product_page_info=function(dom) {
            var product_info = {};
            var pdp_model_data = $(dom).find('div#pdp-model-data');
            product_info['sku'] = pdp_model_data.attr('data-sku-id');
            product_info['id'] = pdp_model_data.attr('data-product-id');
            product_info['product_name'] = JSON.parse(pdp_model_data.attr('data-names'))['short'];
            if ($(dom).find('div.regular-price:eq(0)').length>0){
                product_info['current_price'] = $(dom).find('div.regular-price:eq(0)').text().match(/[0-9\.]+/)[0];
                product_info['images'] = [];
                var imgs = JSON.parse(pdp_model_data.attr('data-gallery-images'));
                for (var i in imgs) {
                    product_info['images'][i] = imgs[i]['url'];
                }
            }
            else{
                product_info['current_price'] = "out of stock";
                product_info['images'] = [];
            }

            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            console.log(null);
            return null;
        }
    }
    function WalmartParser() {
        this.store='walmart'
        this.get_product_page_info=function(dom) {
            var product_info = {};
            product_info['product_name'] = $(dom).find('h1.productTitle:eq(0)').text();
            product_info['sku'] = $(dom).text().match(/upc:[\s]+'([\d]+)'/)[1];
            product_info['current_price'] = $(dom).text().match(/currentItemPrice:[\s]*([\d\.]+)/)[1];
            product_info['id'] = $(dom).text().match(/itemId:[\s]*([\d\.]+)/)[1];
            product_info['images'] = [];
            $(dom).find('.BoxSelection').each(function(index){
                product_info['images'][index] = $(this).parent().attr('onmouseover').match(/handleSwatchMouseOver\('([\w\d:\/_\-\.]+)'/)[1];
            });
            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            console.log($(dom).find('img#mainImage')[0]);
            return $(dom).find('img#mainImage')[0];
        }

    }
    /*** MAGENTO PARSER ***/
    function MagentoParser() {
        this.store='magento'
        this.get_product_page_info=function(dom) {
            var product_info = {};
            product_info['product_name'] = $(dom).find('div.product-name h1:eq(0)').text();

            var current_price_match = $(dom).text().match(/"basePrice":"([\d\.]+)"/);
            product_info['current_price'] = current_price_match?current_price_match[1]:"";


            var sku_match = $(dom).find('p.sku:eq(0)').text().match(/:[\s]*([\w\d]+)/);
            product_info['sku'] = sku_match? sku_match[1] : "";

            var id_match = $(dom).text().match(/"productId":"([\d]+)"/);
            product_info['id'] = id_match?id_match[1]:"";


            product_info['images'] = [];
            $(dom).find('div.more-views a').each(function(index){
                product_info['images'][index] = "http://" + $(this).attr('href').substr(1);
            });
            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            console.log($(dom).find('a.product-image img')[0]);
            return $(dom).find('a.product-image img')[0];
        }
    }

    /*** AMAZON PARSER ***/
    function AmazonParser() {
        this.store='amazon'
        this.get_product_page_info=function(dom) {
            var product_info = {};
            product_info['product_name'] = $(dom).find('#productTitle').text();

            var current_price_match = $(dom).find('#priceblock_ourprice').text().match(/\$([\d\.]+)/);
            product_info['current_price'] = current_price_match?current_price_match[1]:"";

            product_info['sku'] = $(dom).find('#ASIN').val();
            product_info['id'] = $(dom).find('#nodeID').val();

            product_info['images'] = [];
            var imgs = $(dom).text().match(/"main":\{"([\w\d:\/%\._\-]+)"/g);
            var index = 0;
            for (var i = 0; i < imgs.length; i++ ){
                var flag = true;
                var url = imgs[i].substr(9);
                url = url.slice(0, url.length-1);
                for (var j = 0; j<product_info.length; j++){
                    if (product_info['images'][j] == url){
                        flag=false;
                        break;
                    }
                }
                if (flag){
                    product_info['images'][index] = url;
                    index ++;
                }
            }
            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            //var imgs = $(dom).text().match(/"main":\{"([\w\d:\/%\._\-]+)"/g);
            //var url = imgs[0].substr(9);


            //it crashes when i am trying to log because src contains the img data not img url

            //var el = $(dom).find('img.a-dynamic-image');
            //el.attr('src', url);
            //console.log(el);
            return $(dom).find('img.a-dynamic-image')[0];
        }
    }

    /*** TARGET PARSER ***/
    function TargetParser() {
        this.store='target';
        this.get_product_page_info=function(dom) {
            var product_info = {};

            var product_name_match = $(dom).find('.product-name').text().match(/(\b[\w\d].*[$\w\d])/);
            product_info['product_name'] = product_name_match[1];

            product_info['current_price'] = $(dom).find('span.offerPrice').text().substr(1).match(/[\d\.]+/)[0];

            var sku_match = $(dom).find('meta[property="og:url"]').attr('content').match(/\/([\w]+\-[\d]+)/);
            product_info['sku'] = sku_match? sku_match[1] : "";

            product_info['id'] = $(dom).find('input[name="productId"]').val();


            product_info['images'] = [];
            $(dom).find('a.scene7.imgAnchor img').each(function(index){
                product_info['images'][index] = "http://" + $(this).attr('src').replace('_50x50', '').substr(1);
            });
            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            console.log($(dom).find('a#heroZoomImage.scene7 img')[0]);
            return $(dom).find('a#heroZoomImage.scene7 img')[0];
        }
    }

    /*** Demandware PARSER ***/
    function DemandwareParser() {
        this.store='Demandware';
        this.get_product_page_info=function(dom) {
            var product_info = {};

            product_info['product_name'] =$(dom).find('.product-name').text();

            product_info['current_price'] = $(dom).find('.product-price').find('span[class^=price-]').text().match(/[\d\.]+/)[0];

            product_info['id'] = $(dom).find('span[itemprop="productID"]').text();
            if (!product_info['id'])
                product_info['id'] = $(dom).text().match(/productid[\s]*=[\s]*"([\d\w\-]+)"/i)[1];
            else
                product_info['id'] = product_info['id'].match(/[\d\w\-_]+/)[0];

            product_info['sku'] = product_info['id'];

            product_info['images'] = [];
            $(dom).find('div.product-thumbnails li.thumb a').each(function(index){
                if ($(this).attr('href').indexOf('#') == -1)
                    product_info['images'].push("http://" + $(this).attr('href').substr(1));

            });
            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            console.log($(dom).find('img.primary-image')[0]);
            return $(dom).find('img.primary-image')[0];
        }
    }

    /*** ATGCommerce PARSER ***/
    function ATGCommerceParser() {
        this.store='ATGCommerce';
        this.get_product_page_info=function(dom) {
            var product_info = {};

            var product_name_el = $(dom).find('h1[class*="title"]');
            if (product_name_el.children().length == 0)
                product_info['product_name'] = product_name_el.text().trim();
            else
                product_info['product_name'] = product_name_el.children().eq(0).text().trim();

            $(dom).find("[class$='-price']").each(function(){
                if (m = $(this).text().match(/([\d]+\.[\d]+)|([\d]+)/)){
                    product_info['current_price'] = m[0];
                    return false;
                }
            });

            var product_id_el = $(dom).find('input').filter(function() {

                var str = $(this).attr('id') || $(this).attr('class');
                if (str == null) return false;
                return (str.toLowerCase().indexOf('productid') > -1);
            });
            product_info['id'] = product_id_el.val();

            var product_sku_el = $(dom).find('input[type="hidden"]').filter(function() {
                var str = $(this).attr('id') || $(this).attr('class');
                if (str == null) return false;
                return (str.toLowerCase().indexOf('skuid') > -1);
            });
            product_info['sku'] = product_sku_el.val();

            product_info['images'] = [];
            $(dom).find('[class*="thumb"] a').each(function(index){
                if ($(this).attr('href').indexOf('#') == -1)
                    product_info['images'].push("http://" + $(this).attr('href').substr(1));

            });
            console.log(product_info);
            return product_info;
        }
        this.get_primary_image_element=function(dom) {
            if ($(dom).find('[class*="prod"][class*="im"] img').length>0)
            {
                console.log($(dom).find('[class*="prod"][class*="im"] img')[0]);
                return $(dom).find('[class*="prod"][class*="im"] img')[0];
            }
            return null;
        }
    }


    function detectStore(dom) {
        var site_name = $(dom).find('meta[property="og:site_name"]')!=undefined ? $(dom).find('meta[property="og:site_name"]').attr('content') : null;
        if (site_name == null) {
            if (/Mage\.Cookies\.domain/.test($(dom).text())) site_name = "Magento";
            if (/Amazon\.com/.test($(dom).find('title').text())) site_name = "Amazon";
            if ($(dom).find('link[rel="shortcut icon"]') && (/demandware/.test($(dom).find('link[rel^="shortcut"]').attr('href')))) site_name = "Demandware";
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

    appAPI.resources.includeJS('toastr.min.js');
    appAPI.resources.includeCSS('toastr.min.css');

    var storeParser=detectStore(document);
    var product_info;
    console.log(storeParser);
    if (storeParser!=null){
        console.log('************** visiting ' + storeParser.store + ' store ');
        try{
            product_info = storeParser.get_product_page_info(document);
        }catch(e){
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
            toastr.info(storeParser.store +' product found');
        }
    }


});
