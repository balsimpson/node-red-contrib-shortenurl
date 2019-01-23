//add to package.json
const https = require('https');

const makeHttpCall = async (options) => {
	return new Promise((resolve) => {
		var req = https.request(options, res => {
			res.setEncoding('utf8');
			var returnData = "";
			res.on('data', chunk => {
				returnData = returnData + chunk;
			});
			res.on('end', () => {
				let results = JSON.parse(returnData);
				resolve(results);
			});
		});
		if (options.method == 'POST' || options.method == 'PATCH') {
			req.write(JSON.stringify(options.body));
		}
		req.end();
	})
}

const getShortUrl = async (longurl, shorturl) => {
	let options = {
		host: 'is.gd',
		path: `/create.php?format=json&url=${longurl}&shorturl=${shorturl}`,
		method: 'GET'
	}

	let resp = await makeHttpCall(options);
	return resp;
}

module.exports = function (RED) {
	function ShortenNode(config) {
		RED.nodes.createNode(this, config);
		let node = this;
		node.on('input', function (msg) {
			// check incoming message
			let longurl = '';
			let shorturl = '';
			// LONG URL
			if (msg.longurl) {
				longurl = msg.longurl;
			} else if (msg.payload && msg.payload.longurl) {
				longurl = msg.payload.longurl;
			} else {
				longurl = config.longurl;
			}
			// SHORT URL
			if (msg.shorturl) {
				shorturl = msg.shorturl;
			} else if (msg.payload && msg.payload.shorturl) {
				shorturl = msg.payload.shorturl;
			} else {
				shorturl = config.shorturl;
			}

			let results = getShortUrl(longurl, shorturl);
			results.then((value) => {
				if (value.error) {
					node.status({ fill: 'red', shape: 'ring', text: 'error' });
					node.error(value.error);
				} else {
					try {
						msg.shorturl = value;
						msg.payload.shorturl = value;
						node.send(msg);
					} catch (error) {
						node.status({ fill: 'red', shape: 'dot', text: 'error' });
						node.error(error);
					}
				}
			});
		});
	}
	RED.nodes.registerType('shorten', ShortenNode);
}