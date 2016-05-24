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

const proxyPort = 3333;
const appPort = 3334;
const localAddr = "127.0.0.1";

const authServiceAddr = localAddr;
const authServicePort = 3332;

const scalarTSServiceAddr = localAddr;
const scalarTSServicePort = 3335;

const vectorTSServiceAddr = localAddr;
const vectorTSServicePort = 3336;






const hbs = exphbs.create({ defaultLayout: "main" });

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

app.use(express.static("./public"));


app.listen(appPort, localAddr, function () {
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
	else {
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
	// You can define here your custom logic to handle the request 
	// and then proxy the request.
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
		authClient.getUserIDFromToken(authToken, function(userID) {
			proxyRequest(authToken, userID, req, res);
		})
	}
	else {
		proxyRequest(null, -1, req, res);
	}
}).listen(proxyPort);
console.log("Reverse proxy listening on port " + proxyPort);
