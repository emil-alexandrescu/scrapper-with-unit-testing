// ----------------
//   Dependencies
// ----------------

var Config      = require('../config.json');
var should      = require('should');
var Request     = require('request');
var cheerio =    require('cheerio');
var test = it;

function detectStore(dom) {
    var site_name = $(dom).find('meta[property="og:site_name"]')!=undefined ? $(dom).find('meta[property="og:site_name"]').attr('content') : null;
    if (site_name == null) {
        if (/Mage\.Cookies\.domain/.test($(dom).text())) site_name = "Magento";
        if (/Amazon\.com/.test($(dom).find('title').text())) site_name = "Amazon";
        if ($(dom).find('link[rel="shortcut icon"]') && (/demandware/.test($(dom).find('link[rel^="shortcut"]').attr('href')))) site_name = "Demandware";
        if ($(dom).find("input[name^=\"\/atg\/commerce\"]").length>0) site_name = "ATGCommerce";
    }
    return site_name;
}


//Checking Dom strucutre (for now, check with only price . if scrapped price is in number format, we can say dom structure is not changed.
function testFunc(dom, site_name){
    var price;
    console.log("Checking " + site_name + "...");
    switch (site_name){
        case "Walmart.com":
            price = $(dom).text().match(/currentItemPrice:[\s]*([\d\.]+)/)[1];
            break;
        case "Magento":
            var current_price_match = $(dom).text().match(/"basePrice":"([\d\.]+)"/);
            price = current_price_match?current_price_match[1]:"";
            break;
        case "Amazon":
            var current_price_match = $(dom).find('#priceblock_ourprice').text().match(/\$([\d\.]+)/);
            price = current_price_match?current_price_match[1]:"";
            break;
        case "Target":
            price = $(dom).find('span.offerPrice').text().substr(1).match(/[\d\.]+/)[0];
            break;
        case "Demandware":
            price = $(dom).find('.product-price').find('span[class^=price-]').text().match(/[\d\.]+/)[0];
            break;
        case "ATGCommerce":
            $(dom).find("[class$=-price]").each(function(){
                if (m = $(this).text().match(/([\d]+\.[\d]+)|([\d]+)/)){
                    price = m[0];
                    return false;
                }
            });
            break;
        case "Best Buy":
            price = $(dom).find('div.regular-price').text().match(/[0-9\.]+/)[0];
            break;
    }
    console.log(price);
    (price == price*1).should.be.ok;
}
// ----------------
//   Test Data
// ----------------

var TestData = [
        {
            "url": "www.walmart.com/ip/West-Bend-0.9-cu.-ft.-900-Watt-Microwave/24950645",
            "site": "Walmart.com"
        },
        {
            "url": "www.petermillar.com/men/men-collections/new-arrivals/plaid-justice-sport-coat-italian-wool-blend.html",
            "site": "Magento"
        },
        {
            "url": "www.uggaustralia.eu/1004074.html?dwvar_1004074_color=GRZ#icid=Men_Bottomright_Best-sandals20140520&start=6&cgid=men-flip-flops",
            "site": "Demandware"
        },
        {
            "url": "www.hollandandbarrett.com/shop/product/vitabiotics-perfectil-max-capsules-60012089",
            "site": "ATGCommerce"
        },
        {
            "url": "www.target.com/p/cherokee-young-mens-school-uniform-short-sleeve-pique-polo/-/A-15245123#prodSlot=medium_1_2",
            "site": "Target"
        },
        {
            "url": "www.amazon.com/gp/product/B005HZU7LU/ref=gb1h_img_c-2_1842_c7afe2dc?pf_rd_m=ATVPDKIKX0DER&pf_rd_t=701&pf_rd_s=center-new-2&pf_rd_r=116H4BM0P3P1YDH69VH9&pf_rd_i=20&pf_rd_p=1725241842",
            "site": "Amazon"
        },
        {
            "url" :"www.bestbuy.com/site/seiki-32-class-32-diag--lcd-tv-1080p-hdtv-1080p/1305459296.p",
            "site": "Best Buy"
        }
    ];

// ----------------
//   Test
// ----------------

describe('Page Check :', function() {

    // --
    // Tests
    // --
    [].forEach.call(TestData, function(data){
        test('> GET ' + data['site'] + ' > '+ data['url'], function(done) {
            Request.get({
                url: Config.proxy + data['url'],
                html: true
            }, function(e, r, body) {
                if (e) {
                    throw e;
                    done(e);
                } else {
                    r.statusCode.should.equal(200);
                    $ = cheerio.load(body);
                    var site_name = detectStore($('html')[0]);
                    site_name.should.equal(data['site']);
                    testFunc($('html')[0], site_name);
                    done();
                }
            });
        });
    });
});
