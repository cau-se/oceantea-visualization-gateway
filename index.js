// Copyright 2016 Arne Johanson
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

try {
	process.chdir(__dirname);
}
catch(err) {
	console.log("Could not change working directory to app root");
	process.exit(1);
}

const http = require("http");
const httpProxy = require("http-proxy");
const express = require("express");
const exphbs  = require("express-handlebars");
const validator  = require("validator");
const authClient = require("./auth_client");
const httpClient = require("./http_client");
const gMapsKey = require("./gmaps_key");
const pluginDir = require("./plugins");

const acceptAllHosts = process.argv.includes("--acceptAllHosts");
const useDockerHostnames = process.argv.includes("--useDockerHostnames");

const proxyPort = 3333;
const appPort = 3334;
const localAddr = "localhost";

const authServiceAddr = useDockerHostnames ? "oceantea-auth-inst" : localAddr;
const authServicePort = 3332;

const scalarTSServiceAddr = useDockerHostnames ? "oceantea-scalar-time-series-inst" : localAddr;
const scalarTSServicePort = 3335;

const vectorTSServiceAddr = useDockerHostnames ? "oceantea-vector-time-series-inst" : localAddr;
const vectorTSServicePort = 3336;

const spatialAnalysisServiceAddr = localAddr;
const spatialAnalysisServicePort = 3338;






const hbs = exphbs.create({
	defaultLayout: "main",
	helpers: {
		pluginNavTabs: function(active, authToken) {
			var htmlString = "";
			pluginDir.plugins.forEach(function(p) {
				htmlString += '<li'+(active===p.serviceName ? ' class="active"' : '' )+'><a href="'+p.guiURL+(authToken ? '?authToken='+authToken : '')+'">'+p.tabName+'</a></li>';
			});
			return htmlString;
		}
	}
});

const app = express();

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

//app.use(function(req, res, next) {
//	//console.log(req.headers);
//	console.log(req.method);
//	next();
//});


app.get("/:dummy(index.html)?", function (req, res) {
	res.render("exploration", {
		pagetitle : "Exploration",
		authToken : (req.query.hasOwnProperty("authToken") ? validator.whitelist(req.query.authToken, "0-9a-fA-F") : null),
		gMapsKey : gMapsKey.key,
		navExploration : true,
		libBootstrapSlider : true,
		libFontAwesome : true,
		libD3js : true,
		libCanvasPlot: true
	});
});
app.get("/manage.html", function(req, res, next) { // authorization check
		if(req.headers.hasOwnProperty("x-auth-userid") && parseFloat(req.headers["x-auth-userid"]) >= 0) {
			return next();
		}
		return res.render("login", {
			pagetitle : "Login",
			navManagement : true,
			loginTarget : "/manage.html",
			authAddr : authServiceAddr,
			authPort : authServicePort,
			libFontAwesome : true
		});
	}, function (req, res) {
		res.render("management", {
			pagetitle : "Management",
			authToken : (req.query.hasOwnProperty("authToken") ? validator.whitelist(req.query.authToken, "0-9a-fA-F") : null),
			navManagement : true,
			libFontAwesome : true,
			libBootstrapJS : true
		});
	});
app.get("/spatial_analysis.html", function (req, res) {
	res.render("spatial_analysis", {
		pagetitle : "Spatial Analysis",
		authToken : (req.query.hasOwnProperty("authToken") ? validator.whitelist(req.query.authToken, "0-9a-fA-F") : null),
		navSpatialAnalysis : true
	});
});
app.get("/pattern_discovery.html", function (req, res) {
	res.render("pattern_discovery", {
		pagetitle : "Pattern Discovery",
		authToken : (req.query.hasOwnProperty("authToken") ? validator.whitelist(req.query.authToken, "0-9a-fA-F") : null),
		navPatternDiscovery : true
	});
});

function getPluginServiceHost(plugin) {
	return useDockerHostnames ? (p.serviceName+"-inst") : p.serviceHost;
}
pluginDir.plugins.forEach(function(p) {
	app.get(p.guiURL, function (req, res) {
		const timeout = 5000;
		httpClient.requestResource("GET", getPluginServiceHost(p), p.servicePort, p.apiPrefix+"/static/index.html", timeout, -1, function(status, body) {
			var params = {
				pagetitle : p.tabName,
				authToken : (req.query.hasOwnProperty("authToken") ? validator.whitelist(req.query.authToken, "0-9a-fA-F") : null),
				activePluginTab: p.serviceName,
				remoteContent: body
			};
			for(var tp in p.templateParameters) {
				params[tp] = p.templateParameters[tp];
			}
			res.render("plugin", params);
		});
	});
});

app.use(express.static("./public"));


app.listen(appPort, acceptAllHosts ? null : localAddr, function () {
	console.log("Static content app listening on port " + appPort);
});


function sendJSONResponse(res, status, obj) {
	res.statusCode = status;
	res.setHeader("Content-Type", "application/json");
	try {
		res.end(JSON.stringify(obj));
	} catch(error) {
		res.statusCode = 500;
		res.end("{}");	
	}
}

function appendToObject(obj, objToAppend) {
	Object.keys(objToAppend).forEach(function(k) {
		if(!obj.hasOwnProperty(k)) {
			obj[k] = objToAppend[k];
		}
		else {
			if(obj[k] !== null && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
				appendToObject(obj[k], objToAppend[k]);
			}
			else if(Array.isArray(obj[k]) && Array.isArray(objToAppend[k])) {
				objToAppend[k].forEach(function(d) {
					if(obj[k].indexOf(d) < 0) {
						obj[k].push(d);
					}
				});
			}
		}
	});
}

function getAndSendMergedJSON(res, path, userID) {
	var scalarData = null;
	var vectorData = null;
	httpClient.getJSON(scalarTSServiceAddr, scalarTSServicePort, path, 5000, userID, function(data) {
		scalarData = data ? data : {};			
		if(vectorData !== null) {
			appendToObject(scalarData, vectorData);
			sendJSONResponse(res, 200, scalarData);
		}
	});
	httpClient.getJSON(vectorTSServiceAddr, vectorTSServicePort, path, 5000, userID, function(data) {
		vectorData = data ? data : {};			
		if(scalarData !== null) {
			appendToObject(scalarData, vectorData);
			sendJSONResponse(res, 200, scalarData);
		}
	});
}

function forwardRequestToTSServices(method, path, userID, callback) {
	var statusCodes = [];
	var bodies = [];
	httpClient.requestResource(method, scalarTSServiceAddr, scalarTSServicePort, path, 5000, userID, function(status, body) {
		statusCodes.push(status);
		bodies.push(body);
		if(statusCodes.length >= 2) {
			callback(statusCodes, bodies);
		}
	});
	httpClient.requestResource(method, vectorTSServiceAddr, vectorTSServicePort, path, 5000, userID, function(status, body) {
		statusCodes.push(status);
		bodies.push(body);
		if(statusCodes.length >= 2) {
			callback(statusCodes, bodies);
		}
	});
}

function proxyRequest(authToken, userID, req, res) {
	req.headers["x-auth-userid"] = userID.toString();
	 
	if(req.url.indexOf("/timeseries") === 0) {
		if(req.url.indexOf("/timeseries/scalar") === 0) {
			proxy.web(req, res, {
				target: "http://"+scalarTSServiceAddr+":"+scalarTSServicePort+req.url,
				ignorePath: true
			});
		}
		else if(req.url.indexOf("/timeseries/adcp") === 0) {
			proxy.web(req, res, {
				target: "http://"+vectorTSServiceAddr+":"+vectorTSServicePort+req.url,
				ignorePath: true
			});
		}
		else {
			//console.log(req.url);
			getAndSendMergedJSON(res, req.url, userID);
		}
	}
	else if(req.url.indexOf("/datatypes") === 0) {
		if(req.method.toUpperCase() === "GET") {
			getAndSendMergedJSON(res, req.url, userID);	
		}
		else {
			forwardRequestToTSServices(req.method, req.url, userID, function(statusCodes, bodies) {
				const result = (statusCodes.indexOf(200) >= 0);
				sendJSONResponse(res, result ? 200 : 500, {success: result});
			});
		}
	}
	else if(req.url.indexOf("/stations") === 0) {
		getAndSendMergedJSON(res, "/stations", userID);
	}
	else if(req.url.indexOf("/regions") === 0) {
		getAndSendMergedJSON(res, "/regions", userID);
	}
	else if(req.url.indexOf("/devices") === 0) {
		getAndSendMergedJSON(res, "/devices", userID);
	}
	else if(req.url.indexOf("/login") === 0) {
		proxy.web(req, res, {
			target: "http://"+authServiceAddr+":"+authServicePort+req.url.substr("/login".length),
			ignorePath: true
		});
	}
	else if(req.url.indexOf("/upload/scalar") === 0) {
		proxy.web(req, res, {
			target: "http://"+scalarTSServiceAddr+":"+scalarTSServicePort+"/upload",
			ignorePath: true
		});
	}
	else if(req.url.indexOf("/upload/adcp") === 0) {
		proxy.web(req, res, {
			target: "http://"+vectorTSServiceAddr+":"+vectorTSServicePort+"/upload",
			ignorePath: true
		});
	}
	else if(req.url.indexOf("/convert") === 0) {
		proxy.web(req, res, {
			target: "http://"+scalarTSServiceAddr+":"+scalarTSServicePort+"/convert",
			ignorePath: true
		});
	}
	else if(req.url.indexOf("/bathymetries") === 0) {
		proxy.web(req, res, {
			target: "http://"+spatialAnalysisServiceAddr+":"+spatialAnalysisServicePort+req.url,
			ignorePath: true
		});
	}
	else {
		// Is this a plugin URL?
		const nPlugins = pluginDir.plugins.length;
		for(var i=0; i<nPlugins; ++i) {
			const p = pluginDir.plugins[i];
			if(req.url.indexOf(p.apiPrefix) === 0) {
				proxy.web(req, res, {
					target: "http://"+getPluginServiceHost(p)+":"+p.servicePort+req.url,
					ignorePath: true
				});
				return;
			}
		}

		// If the URL does not match any known prefix, hand it over to the static content service.
		proxy.web(req, res, {
			target: "http://"+localAddr+":"+appPort+req.url,
			ignorePath: true
		});
	}
}


const proxy = httpProxy.createProxyServer({});
proxy.on("error", function (err, req, res) {
	res.statusCode = 500;
	res.end("Reverse proxy error: "+ err);
});
const proxyServer = http.createServer(function(req, res) {
	var authToken = null;
	if(req.headers.hasOwnProperty("x-auth-token")) {
		authToken = req.headers["x-auth-token"];
	}
	else {
		var tokenExpr = /authToken=([0-9a-fA-F]+)/;
		var result = tokenExpr.exec(req.url);
		if(result) {
			authToken = result[1];
		}
	}
	
	if(authToken) {
		authClient.getUserIDFromToken(authServiceAddr, authServicePort, authToken, function(userID) {
			proxyRequest(authToken, userID, req, res);
		})
	}
	else {
		proxyRequest(null, -1, req, res);
	}
}).listen(proxyPort);
console.log("Reverse proxy listening on port " + proxyPort);
