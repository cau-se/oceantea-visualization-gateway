const http = require("http");

const authServer = "localhost";
const authPort = 3332;
const authTimeout = 2000;

function getUserIDFromToken(token, callback) {
	var req = http.request({
			hostname: authServer,
			port: authPort,
			path: "/userid?token="+token,
			method: "GET",
			headers: {
				"Cache-Control": "no-cache"
			}
		}, function(res) {
			var body = "";
			res.on("data", function(chunk) {
				body += chunk;
			});
			res.on("end", function() {
				if(res.statusCode !== 200) {
					callback(-1);
					return;
				}
				var responseObj = {userID: -1};
				try {
					var responseObj = JSON.parse(body);
				} catch(e) {
					callback(-1);
					return;
				}
				callback(responseObj.hasOwnProperty("userID") ? responseObj.userID : -1);
			});
		});
	req.on("error", function(e) {
		callback(-1);
	});
	req.on("socket", function(socket) {
		socket.setTimeout(authTimeout);  
		socket.on("timeout", function() {
			req.abort();
			//callback(-1); <- do not call this because abort() fires error event for req.
		});
	});
	req.end();
}

module.exports.getUserIDFromToken = getUserIDFromToken;
