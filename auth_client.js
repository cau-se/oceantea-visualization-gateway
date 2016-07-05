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

const http = require("http");

const authServer = "127.0.0.1";
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
