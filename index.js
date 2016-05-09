const http = require("http");
const httpProxy = require("http-proxy");
const express = require("express");
const exphbs  = require("express-handlebars");

const authService = require("./auth_service");

const proxyPort = 3333;
const appPort = 3334;
const localAddr = "127.0.0.1";




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
		navExploration : true,
		libBootstrapSlider : true,
		libFontAwesome : true,
		libD3js : true,
		libCanvasPlot: true
	});
});
app.get("/manage.html", function (req, res) {
	// if auth...
	res.render("management", {
		pagetitle : "Management",
		navManagement : true,
		libFontAwesome : true,
		libBootstrapJS : true
	});
});
app.get("/analysis.html", function (req, res) {
	res.render("analysis", {
		pagetitle : "Analysis",
		navAnalysis : true
	});
});
app.get("/mlanalysis.html", function (req, res) {
	res.render("mlanalysis", {
		pagetitle : "ML Analysis",
		navMLAnalysis : true
	});
});

app.use(express.static("./public"));


app.listen(appPort, localAddr, function () {
	console.log("Static content app listening on port " + appPort);
});


function proxyRequest(userID, req, res) {
	req.headers["x-auth-userid"] = userID.toString();
	 
	if(req.url.indexOf("/index.html") === 0) {
		proxy.web(req, res, { target: "http://"+localAddr+":"+appPort+"/mlanalysis.html", ignorePath: true });
	}
	else {
		proxy.web(req, res, { target: "http://"+localAddr+":"+appPort, ignorePath: false });
	}
}


const proxy = httpProxy.createProxyServer({});
const proxyServer = http.createServer(function(req, res) {
	// You can define here your custom logic to handle the request 
	// and then proxy the request. 
	if(req.headers.hasOwnProperty("x-auth-token")) {
		authService.getUserIDFromToken(req.headers["x-auth-token"], function(userID) {
			proxyRequest(userID, req, res);
		})
	}
	else {
		proxyRequest(-1, req, res);
	}
}).listen(proxyPort);
console.log("Reverse proxy listening on port " + proxyPort);
