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
			let results = getShortUrl(config.longurl, config.shorturl);
			results.then((value) => {
				if (value.error) {
					node.status({ fill: 'red', shape: 'ring', text: 'error' });
					node.error(value.error);
				} else {
					try {
						msg.payload = value;
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