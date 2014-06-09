// ----------------
//   Dependencies
// ----------------
var Restify             = require('restify');
var Cluster             = require('cluster');
var Util                = require('util');
var Client              = require('./utils/client');
var URL                 = require('url');

// Config
var Config              = require('./config.json');
var Package             = require('./package.json');

// Shared Core
var Core                = require('sites-node-common');
var Tokens              = Core.Auth.Tokens;

// --------------------------
//   Server Settings & Init
// --------------------------

var Settings = {
    cpu_cores:      require('os').cpus().length,
    port:           Config.server_port
}

// ------------------------
//   Start Server
// ------------------------

if (Cluster.isMaster && Config.use_cluster) {
    // -----------------
    // --
    //  Cluster Master
    // --
    // -----------------

    Util.log('Nolet API Master Started ...');

    // Start as many workers as we have CPU cores
    for (var i = 1; i <= Settings.cpu_cores; i++) {
        Cluster.fork();
    }

    Cluster.on('disconnect', function(worker) {
        Util.log('Worker Disconnect!');
        Cluster.fork();
    });

} else {
    // -----------------
    // --
    //  Workers
    // --
    // -----------------

    Util.log('Nolet API Worker Started ...');

    // -----------------------
    //   Worker Dependencies
    // -----------------------

    // Controllers
    var UserController              = require('./controllers/user');
    var ArticleController           = require('./controllers/article');
    var ArticleFactController       = require('./controllers/article_fact');
    var ArticleStatementController  = require('./controllers/article_statement');
    var PublisherController         = require('./controllers/publisher');
    var JournalistController        = require('./controllers/journalist');
    var UserProfileController       = require('./controllers/userprofile');
    var UserFeedSettingsController  = require('./controllers/userfeedsettings');
    var GroupController             = require('./controllers/group');
    var AuthController              = require('./controllers/auth');
    var FeedController              = require('./controllers/feed');

    // -----------------
    //   Create Server
    // -----------------
    var server = Restify.createServer({
        name                  : 'Nolet-API',
        version               : Package.version,
        accept                : ['application/json'],
        responseTimeHeader    : 'X-Runtime',
        responseTimeFormatter : function(durationInMilliseconds) {
            return durationInMilliseconds / 1000;
        }
    });

    // Auto parse query parameters into req.params
    server.use(Restify.queryParser());

    // Skip other body types, only parse json
    server.use(Restify.jsonBodyParser());

    // Enable compressed responses
    server.use(Restify.gzipResponse());

    // Check for a token
    server.use(function(req, res, next) {
        //return next();

        // TODO: Re-enable protcol and token checks
        /*if (req.headers['x-forwarded-proto'] != Config.protocol) {
            res.header('Location', 'https://' + req.headers.host + req.url);
            res.send(302);
            return next(false);
        }*/
        if(req.url != '/auth/token') {
            if (req.headers['x-auth-token']) {
                Tokens.Authenticate(req.headers['x-auth-token'], function(token) {
                    req.token = token;
                    if (req.token.is_valid) {
                        res.header('X-Token-Valid-For', parseInt(token.expires - (new Date().getTime() / 1000)));
                        return next();
                    } else {
                        return Client.NotAuthorized(req, res);
                    }
                });
            } else if (!req.headers['X-Auth-Token'] && req.params.stripe_id) {
                if (req.params.stripe_id == Config.stripe.identifier) {
                    return next();
                } else {
                    return Client.NotAuthorized(req, res);
                }
            } else {
                return Client.NotAuthorized(req, res);
            }
        } else{
            return next();
        }
    });

    // Normalize/sanitize paths
    server.pre(Restify.pre.sanitizePath());

    // This runs prior to route functions
    server.pre(function(req, res, next) {
        // Query params for GET are not available at this point.  Parse them manually.
        var params = URL.parse(req.href(), true).query;

        Util.log(req.method + ' ' + req.href());

        // Allow method overrides (for stuff like ajax that can't do PUT/DELETE etc)
        req.method = (params._method) ? params._method.toUpperCase() : req.method;
        return next();
    });

    // ----------------
    //   API Routing
    // ----------------

    /** User **/
    server.get({ path: '/users',                            version: '1.0.0' },         UserController.List);
    server.get({ path: '/user/:user_id',                    version: '1.0.0' },         UserController.Retrieve);
    server.put({ path: '/user/:user_id',                    version: '1.0.0' },         UserController.Update);
    server.del({ path: '/user/:user_id',                    version: '1.0.0' },         UserController.Delete);
    server.post({ path: '/user',                            version: '1.0.0' },         UserController.Create);

    /** Feed **/
    server.get({ path: '/feeds',                            version: '1.0.0' },         FeedController.List);
    server.post({ path: '/feed',                            version: '1.0.0' },         FeedController.Subscribe);
    server.get({ path: '/feed/:feed_id',                    version: '1.0.0' },         FeedController.Retrieve);
    server.del({ path: '/feed/:feed_id',                    version: '1.0.0' },         FeedController.Unsubscribe);
    server.get({ path: '/feed/:feed_id/items',              version: '1.0.0' },         FeedController.GetFeedItems);

    /** Article **/
    server.get({ path: '/articles',                         version: '1.0.0' },         ArticleController.List);
    server.get({ path: '/article/:article_id',              version: '1.0.0' },         ArticleController.Retrieve);
    server.put({ path: '/article/:article_id',              version: '1.0.0' },         ArticleController.Update);
    server.del({ path: '/article/:article_id',              version: '1.0.0' },         ArticleController.Delete);
    server.post({ path: '/article',                         version: '1.0.0' },         ArticleController.Create);

    /** ArticleFact **/
    server.get({ path: '/article/:article_id/facts',            version: '1.0.0' },     ArticleFactController.List);
    server.get({ path: '/article/:article_id/fact/:fact_id',    version: '1.0.0' },     ArticleFactController.Retrieve);
    server.put({ path: '/article/:article_id/fact/:fact_id',    version: '1.0.0' },     ArticleFactController.Update);
    server.del({ path: '/article/:article_id/fact/:fact_id',    version: '1.0.0' },     ArticleFactController.Delete);
    server.post({ path: '/article/:article_id/fact',            version: '1.0.0' },     ArticleFactController.Create);

    /** ArticleStatement **/
    server.get({ path: '/article/:article_id/statements',          version: '1.0.0' }, ArticleStatementController.List);
    server.get({ path: '/article/:article_id/statement/:stmt_id',  version: '1.0.0' }, ArticleStatementController.Retrieve);
    server.put({ path: '/article/:article_id/statement/:stmt_id',  version: '1.0.0' }, ArticleStatementController.Update);
    server.del({ path: '/article/:article_id/statement/:stmt_id',  version: '1.0.0' }, ArticleStatementController.Delete);
    server.post({ path: '/article/:article_id/statement',          version: '1.0.0' }, ArticleStatementController.Create);

    /** Journalist **/
    server.get({ path: '/journalists',                      version: '1.0.0' },         JournalistController.List);
    server.get({ path: '/journalist/:journalist_id',        version: '1.0.0' },         JournalistController.Retrieve);
    server.put({ path: '/journalist/:journalist_id',        version: '1.0.0' },         JournalistController.Update);
    server.del({ path: '/journalist/:journalist_id',        version: '1.0.0' },         JournalistController.Delete);
    server.post({ path: '/journalist',                      version: '1.0.0' },         JournalistController.Create);

    /** Publisher **/
    server.get({ path: '/publishers',                       version: '1.0.0' },         PublisherController.List);
    server.get({ path: '/publisher/:publisher_id',          version: '1.0.0' },         PublisherController.Retrieve);
    server.put({ path: '/publisher/:publisher_id',          version: '1.0.0' },         PublisherController.Update);
    server.del({ path: '/publisher/:publisher_id',          version: '1.0.0' },         PublisherController.Delete);
    server.post({ path: '/publisher',                       version: '1.0.0' },         PublisherController.Create);

    /** UserProfile **/
    server.get({ path: '/user/:user_id/profile',            version: '1.0.0' },         UserProfileController.Retrieve);
    server.put({ path: '/user/:user_id/profile',            version: '1.0.0' },         UserProfileController.Update);

    /** FeedSettings **/
    server.get({ path: '/user/:user_id/feed/settings',       version: '1.0.0' },        UserFeedSettingsController.Retrieve);
    server.put({ path: '/user/:user_id/feed/settings',       version: '1.0.0' },        UserFeedSettingsController.Update);

    /** FeedSettings - Journalists **/
    server.post({ path: '/user/:user_id/feed/settings/journalist',  version:  '1.0.0'},        UserFeedSettingsController.CreateJournalist);
    server.del({ path: '/user/:user_id/feed/settings/journalist',   version:  '1.0.0'},        UserFeedSettingsController.DeleteJournalist);

    /** FeedSettings - Publishers **/
    server.post({ path: '/user/:user_id/feed/settings/publisher',   version:  '1.0.0'},        UserFeedSettingsController.CreatePublisher);
    server.del({ path: '/user/:user_id/feed/settings/publisher',    version:  '1.0.0'},        UserFeedSettingsController.DeletePublisher);

    /** FeedSettings - Tags **/
    server.post({ path: '/user/:user_id/feed/settings/tag',         version:  '1.0.0'},        UserFeedSettingsController.CreateTag);
    server.del({ path: '/user/:user_id/feed/settings/tag',          version:  '1.0.0'},        UserFeedSettingsController.DeleteTag);

    /** FeedSettings - Friends **/
    server.post({ path: '/user/:user_id/feed/settings/friend',      version:  '1.0.0'},        UserFeedSettingsController.CreateFriend);
    server.del({ path: '/user/:user_id/feed/settings/friend',       version:  '1.0.0'},        UserFeedSettingsController.DeleteFriend);

    /** FeedSettings - Groups **/
    server.post({ path: '/user/:user_id/feed/settings/group',       version:  '1.0.0'},        UserFeedSettingsController.CreateGroup);
    server.del({ path: '/user/:user_id/feed/settings/group',        version:  '1.0.0'},        UserFeedSettingsController.DeleteGroup);

    /** Group **/
    server.get({ path: '/groups',                                   version: '1.0.0' },        GroupController.List);
    server.get({ path: '/group/:group_id',                          version: '1.0.0' },        GroupController.Retrieve);
    server.put({ path: '/group/:group_id',                          version: '1.0.0' },        GroupController.Update);
    server.del({ path: '/group/:group_id',                          version: '1.0.0' },        GroupController.Delete);
    server.post({ path: '/group',                                   version: '1.0.0' },        GroupController.Create);

    /** Groups - Members **/
    server.post({ path: '/group/:group_id/member',                  version: '1.0.0' },        GroupController.CreateMember);
    server.del({ path: '/group/:group_id/member',                   version: '1.0.0' },        GroupController.DeleteMember);
    server.get({ path: '/group/:group_id/members',                  version: '1.0.0' },        GroupController.ListMembers);

    /** Groups - Moderators **/
    server.post({ path: '/group/:group_id/moderator',               version: '1.0.0' },        GroupController.CreateMod);
    server.del({ path: '/group/:group_id/moderator',                version: '1.0.0' },        GroupController.DeleteMod);

    /** Authentication **/
    server.post({ path: '/auth/token',                              version: '1.0.0' },        AuthController.Create);

    // -----------------
    //   Server Events
    // -----------------

    server.on('NotFound', function(req, res, next) {
        return Client.NotFound(req, res, next, 'Invalid API endpoint.');
    });

    server.on('NotAuthorized', function(req, res, next) {
        return Client.NotAuthorized(req, res, next);
    });

    server.on('uncaughtException', function (req, res, route, err) {
        Client.ServerError(req, res);
        Util.log('Error in: ', route);
        Util.inspect(err);

        // stop taking new requests.
        server.close();

        // Tell the master we're toast
        if (Config.use_cluster) Cluster.worker.disconnect();

        // Give other requests 5 seconds to finish
        var killtimer = setTimeout(function() {
            process.exit(1);
        }, 5000);

        // But don't keep the process open just for that!
        killtimer.unref();

        return;
    });

    // --------------------
    //   Start the Server
    // --------------------

    Core.Database.connect(Core.Config, function(e) {
        if (e) {
            Util.log(e);
            Util.log("Nolet API shutting down...");
        } else {
            Util.log("OrientDB connection available.");
            server.listen(Settings.port, function() {
                Util.log('Worker Listening: ' + server.url);
            });
        }
    });

}

