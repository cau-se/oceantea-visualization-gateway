const http = require("http");

function getJSON(host, port, path, timeout, userID, callback) {
	var req = http.request({
			hostname: host,
			port: port,
			path: path,
			method: "GET",
			headers: {
				"x-auth-userid": userID.toString()
			}
		}, function(res) {
			var body = "";
			res.on("data", function(chunk) {
				body += chunk;
			});
			res.on("end", function() {
				if(res.statusCode !== 200) {
					callback();
					return;
				}
				var responseObj = null;
				try {
					responseObj = JSON.parse(body);
				} catch(e) {
					callback();
					return;
				}
				callback(responseObj);
			});
		});
	req.on("error", function(e) {
		callback();
	});
	req.on("socket", function(socket) {
		socket.setTimeout(timeout);  
		socket.on("timeout", function() {
			req.abort();
			//callback(); <- do not call this because abort() fires error event for req.
		});
	});
	req.end();
}

function requestResource(method, host, port, path, timeout, userID, callback) {
	var req = http.request({
			hostname: host,
			port: port,
			path: path,
			method: method,
			headers: {
				"x-auth-userid": userID.toString()
			}
		}, function(res) {
			var body = "";
			res.on("data", function(chunk) {
				body += chunk;
			});
			res.on("end", function() {
				callback(res.statusCode, body);
			});
		});
	req.on("error", function(e) {
		callback(500, "");
	});
	req.on("socket", function(socket) {
		socket.setTimeout(timeout);  
		socket.on("timeout", function() {
			req.abort();
			//callback(); <- do not call this because abort() fires error event for req.
		});
	});
	req.end();
}

module.exports.getJSON = getJSON;
module.exports.requestResource = requestResource;
