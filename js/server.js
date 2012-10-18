var http = require("http"),
    sys = require("sys"),
    url = require("url"),
    qs = require("querystring");

var ITEMS_BACKLOG = 20;

var urlMap = {
	'/real_time_feed' : function (req, res) {
							var since = parseInt(qs.parse(url.parse(req.url).query).since, 10);
							feed.query(since, function (data) {
								res.simpleJSON(200, data);
							});
						},
	'/send_feed_item' : function (req, res, json) {
							feed.appendMessage( json );
							res.simpleJSON(200, {});
						}
}

http.createServer(function (req, res) {
	// Get the url and associate the function to the handler
	// or
	// Trigger the 404
	handler  = urlMap[url.parse(req.url).pathname] || notFound;
	
	var json = "";
	
	if(req.method === "POST"){
		// We need to process the post but we need to wait until the request's body is available to get the field/value pairs.
		req.body = '';
		
		req.addListener('data', function (chunk) {
									// Build the body from the chunks sent in the post.
				 					req.body = req.body + chunk;
								})
			.addListener('end', function () {
									json = JSON.stringify(qs.parse(req.body));
									handler(req, res, json);
		      					}
						);
	}else{
		handler(req, res);
	}
	
	res.simpleJSON = function (code, obj) {
		var body = JSON.stringify(obj);
		res.writeHead(code, {
							"Access-Control-Allow-Origin": "*",
							"Content-Type": "text/json",
							"Content-Length": body.length
						}
					);
		res.end(body);
	};
}).listen(8001);


// This method handles the feed push and querying.
var feed = new function () {
	var real_time_items = [],
		callbacks = [];

	this.appendMessage = function (json) {
		// Append the new item.
		real_time_items.push( json );

		// Log it to the console
		sys.puts(new Date() + ": " + JSON.parse(json).type + " pushed");

		// As soon as something is pushed, call the query callback
		while (callbacks.length > 0)
			callbacks.shift().callback([JSON.parse(json)]);

		// Make sur we don't flood the server
		while (real_time_items.length > ITEMS_BACKLOG)
			real_time_items.shift();
	};

	this.query = function (since, callback) {
		var matching = [];
			
		for (var i = 0; i < real_time_items.length; i++) {
			var real_time_item = real_time_items[i];
			if (real_time_item.timestamp > since)
				matching.push(real_time_item)
		}

		if (matching.length != 0) {
			callback(matching);
		} else {
			callbacks.push({ timestamp: new Date(), callback: callback });
		}
	};
};

var NOT_FOUND = "Not Found\n";

function notFound(req, res) {
  res.sendwriteHeadHeader(404, [ ["Content-Type", "text/plain"]
                      , ["Content-Length", NOT_FOUND.length]
                      ]);
  res.write(NOT_FOUND);
  res.end();
}

console.log('Server running at http://127.0.0.1:8001/');