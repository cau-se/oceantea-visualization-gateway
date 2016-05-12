const http = require("http");
const httpProxy = require("http-proxy");
const express = require("express");
const exphbs  = require("express-handlebars");
const validator  = require("validator");
const authClient = require("./auth_client");

const proxyPort = 3333;
const appPort = 3334;
const localAddr = "127.0.0.1";

const scalarTSServiceAddr = localAddr;
const scalarTSServicePort = 3335;




const hbs = exphbs.create({ defaultLayout: "main" });

const app = express();

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.use(function(req, res, next) {
	console.log(req.headers);
	next();
});


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
			loginTarget : "/manage.html",
			navManagement : true,
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


function proxyRequest(authToken, userID, req, res) {
	req.headers["x-auth-userid"] = userID.toString();
	 
	if(req.url.indexOf("/timeseries") === 0) {
		proxy.web(req, res, { target: "http://"+scalarTSServiceAddr+":"+scalarTSServicePort+"", ignorePath: false });
	}
	else {
		proxy.web(req, res, { target: "http://"+localAddr+":"+appPort, ignorePath: false });
	}
}


const proxy = httpProxy.createProxyServer({});
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
