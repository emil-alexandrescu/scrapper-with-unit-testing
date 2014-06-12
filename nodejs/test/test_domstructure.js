// ----------------
//   Dependencies
// ----------------

var Config      = require('../config.json');
var should      = require('should');
var Request     = require('request');
var cheerio =    require('cheerio');
var fs = require('fs');
var vm = require('vm');
var test = it;

function include(path) {
    var code = fs.readFileSync(path, 'utf-8');
    vm.runInThisContext(code, path);
}

include ('../detectstore.js');


var TestData = [
        {
            "url": "www.walmart.com/ip/West-Bend-0.9-cu.-ft.-900-Watt-Microwave/24950645",
            "site": "Walmart"
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
                    var storeparser;
                    var product_info;
                    try{
                        storeparser = detectStore($('html')[0]);
                        product_info = storeparser.get_product_page_info($('html')[0]);
                    }catch(e){
                        console.log(e);
                        product_info = {};
                    }
                    console.log(storeparser);
                    storeparser.store.should.equal(data['site']);
                    product_info['id'].should.be.ok;
                    product_info['product_name'].should.be.ok;
                    product_info['sku'].should.be.ok;
                    product_info['current_price'].should.be.ok;
                    (product_info['current_price'] == product_info['current_price']*1).should.be.ok;
                    product_info['images'].should.be.an.Array;
                    //testFunc($('html')[0], site_name);
                    done();
                }
            });
        });
    });
});
