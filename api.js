// This program is a personal cloud server api
// All the sources are available under the GPL v3 : http://www.gnu.org/licenses/gpl.html
// (C) Meurice Christophe 2012

// # Includes

var restify = require('restify');
var path = require('path');
var auth = require('./lib/auth');
var Cookies = require("cookies");

// # Configuration

var config = {
    server : "pw+",
    version : "0.0.1",
    api : "0.0.1",
    apiRoute : "api",
    appRoute : "apps",
    port : 8000,
    serverId : "",
    configured : false
};

if (path.existsSync('config/users.sqlite')) {
    // TODO : Check if the root password is changed
    config.configured = true;
}
else{
    auth.createDatabase();
}

var api_public = [];
var api_private = [];
var api_node = [];

var apps_public = [];
var apps_secure = [];
var apps_node = [];

// # Loading core api

    // ## Public
require("fs").readdirSync("./" + config.apiRoute).forEach(function(file) {
    if (path.existsSync("./" + config.apiRoute + "/" + file + "/public.js")) {
        console.log("Loading api module : " + file + " public");
        api_public[file] = require("./" + config.apiRoute + "/" + file + "/public.js");
    }
});

    // ## Private
require("fs").readdirSync("./" + config.apiRoute).forEach(function(file) {
    if (path.existsSync("./" + config.apiRoute + "/" + file + "/private.js")) {
        console.log("Loading api module : " + file + " private");
        api_private[file] = require("./" + config.apiRoute + "/" + file + "/private.js");
    }
});

    // ## Node Communication
require("fs").readdirSync("./" + config.apiRoute).forEach(function(file) {
    if (path.existsSync("./" + config.apiRoute + "/" + file + "/node.js")) {
        console.log("Loading api module : " + file + " node");
        api_node[file] = require("./" + config.apiRoute + "/" + file + "/node.js");
    }
});

// # Loading applications

    // ## Public
require("fs").readdirSync("./" + config.appRoute).forEach(function(file) {
    if (path.existsSync("./" + config.appRoute + "/" + file + "/api/public.js")) {
        console.log("Loading application module : " + file + " public");
        apps_public[file] = require("./" + config.appRoute + "/" + file + "/api/public.js");
    }
});

    // ## Private
require("fs").readdirSync("./" + config.appRoute).forEach(function(file) {
    if (path.existsSync("./" + config.appRoute + "/" + file + "/api/private.js")) {
        console.log("Loading application module : " + file + " private");
        apps_secure[file] = require("./" + config.appRoute + "/" + file + "/api/private.js");
    }
});

    // ## Node communication
require("fs").readdirSync("./" + config.appRoute).forEach(function(file) {
    if (path.existsSync("./" + config.appRoute + "/" + file + "/api/node.js")) {
        console.log("Loading application module : " + file + " node");
        apps_node[file] = require("./" + config.appRoute + "/" + file + "/api/node.js");
    }
});

// # Creating server

var server = restify.createServer();
server.name = config.name + " " + config.version;
server.use(restify.queryParser({ mapParams: true }));
server.use(restify.bodyParser({ mapParams: true }));

// # Routes

// ## Api version

server.get('/', version);
server.get('/version', version);

// ## Core api

server.get('/core/:module/public/:function', callPublicApi);
server.get('/core/:module/private/:function', callPrivateApi);
server.get('/core/:module/node/:function', callNodeApi);

// ## Applications

server.get('/app/:app/public/:function', callApplicationPublic);
server.get('/app/:app/secure/:function', callApplicationSecure);
server.get('/app/:app/node/:function', callApplicationNode);

// # Starting server

server.listen(config.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});

// # Access methods

// ## Version of the server

function version(req, res, next){
    res.json(config);
}

// ## Core api call

function callPublicApi(req,res,next){

    var module = api_public[req.params.module];

    if (module != undefined){
        var fct = module[req.params.function];
        if (fct != undefined){
            fct(req,res,next);
            return;
        }
    }

    // Module / function not found
    res.json({type : "error", body : "This application/function doesn't exist in the api"});
}

function callPrivateApi(req,res,next){

    var cookies = new Cookies( req, res, null );

    auth.isSessionValid(cookies.get("user"), cookies.get("session"),function(uid){

        if ( uid > 0 ){

            var module = api_private[req.params.module];

            if (module != undefined){
                var fct = module[req.params.function];
                if (fct != undefined){
                    fct(req,res,next);
                    return;
                }
            }
        }
        else{
            res.json({type : "not logged", body : "You are not logged"});
            return;
        }

        // Module / function not found
        res.json({type : "error", body : "This application/function doesn't exist in the api"});
    });
}

function callNodeApi(req,res,next){

}

// ## 3rdParty application call

function callApplicationPublic(req, res, next) {

    var module = apps_public[req.params.app];

    if (module != undefined){
        var fct = module[req.params.function];
        if (fct != undefined){
            fct(req,res,next);
            return;
        }
    }

    // Module / function not found
    res.json({type : "error", body : "This application/function doesn't exist in the api"});
}

function callApplicationSecure(req, res, next) {

    var cookies = new Cookies( req, res, null );

    auth.isSessionValid(cookies.get("user"), cookies.get("session"),function(uid){

        if ( uid > 0 ){

            var module = apps_secure[req.params.app];

            if (module != undefined){
                var fct = module[req.params.function];
                if (fct != undefined){
                    fct(req,res,next);
                    return;
                }
            }
        }
        else{
            res.json({type : "not logged", body : "You are not logged"});
            return;
        }

        // Module / function not found
        res.json({type : "error", body : "This application/function doesn't exist in the api"});
    });
}

function callApplicationNode(req,res,next){

}