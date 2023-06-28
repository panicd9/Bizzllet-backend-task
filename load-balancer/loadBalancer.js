require("dotenv").config({ path: ".env" });

const util = require("./util");
const net = require("net");
const { secp256k1 } = require("@noble/curves/secp256k1");

// const priv = secp256k1.utils.randomPrivateKey();
// const pub = secp256k1.getPublicKey(priv);
const priv = new Uint8Array([
	147, 146, 165, 12, 47, 69, 7, 101, 133, 107, 108, 217, 124, 40, 188, 158, 192,
	51, 159, 124, 46, 224, 151, 222, 64, 199, 221, 193, 105, 255, 25, 194,
]);
const pub = new Uint8Array([
	3, 220, 176, 74, 186, 168, 174, 173, 46, 174, 204, 159, 206, 132, 254, 84, 30,
	149, 2, 162, 226, 29, 54, 178, 72, 223, 78, 159, 78, 37, 60, 216, 167,
]);
// console.log(priv)
// console.log(pub)

const { services, arrServiceIndices, totalWeight } = initWRR();

console.log("Services: ", services);

function initWRR() {
	var services = [
		{
			url: process.env.SERVICE_1_URL,
			weight: parseInt(process.env.SERVICE_1_WEIGHT),
		},
		{
			url: process.env.SERVICE_2_URL,
			weight: parseInt(process.env.SERVICE_2_WEIGHT),
		},
	];

	var arrServiceIndices = [];
	for (let i = 0; i < services.length; i++) {
		arrServiceIndices = arrServiceIndices.concat(
			Array(services[i].weight).fill(i)
		);
	}

	var totalWeight = services.reduce((sum, { weight }) => sum + weight, 0);

	return {
		services: services,
		arrServiceIndices: arrServiceIndices,
		totalWeight: totalWeight,
	};
}

function getNextService() {
	// Return service to forward HTTP request
	rnd = util.getRandomInt(totalWeight);

	return services[arrServiceIndices[rnd]];
}

// Create a TCP server
const server = net.createServer((conn) => {
	console.log("Client connected!");

	conn.on("data", (data) => {
		var request = data;

		const nextService = getNextService();
		console.log("Forwarding to service: ", nextService);
		// // Forward the HTTP request to the next service
		forwardHttpRequest(request, conn, nextService);
	});
});

// Start the TCP server
server.listen(3000, () => {
	console.log("Load Balancer started on port 3000");
});

// Helper functions for parsing and forwarding HTTP requests
function parseHttpRequest(requestData) {
	// Parse the HTTP request and return the necessary information
	var requestRaw = requestData.toString();

	var request = {
		path: null,
		body: null,
		method: null,
		raw: null,
	};

	request.raw = requestRaw;

	request.method = requestRaw.substring(0, requestRaw.indexOf(" "));

	contentLength = parseInt(
		requestRaw.substring(
			requestRaw.indexOfEnd("Content-Length: "),
			requestRaw.indexOf("\n", requestRaw.indexOf("Content-Length: "))
		)
	);

	request.path = requestRaw.split(" ")[1];

	request.body = null;
	if (request.method != "GET") {
		request.body = requestRaw
			.substring(requestRaw.indexOfEnd("Content-Length: " + contentLength))
			.trim();
	} else {
		request.body = "{}";
	}

	return request;
}

// Forward the HTTP request to the specified service
function forwardHttpRequest(request, conn, service) {
	const client = net.createConnection(
		{
			host: service.url.split(":")[0],
			port: service.url.split(":")[1],
		},
		() => {
			// 'connect' listener.
			console.log("Connected to service!");
			reqObj = parseHttpRequest(request);
			reqSigned = signMessage(reqObj);
			console.log("REQ SIGNED: ", reqSigned);
			client.write(reqSigned);
			// client.write(reqObj.raw)
		}
	);

	client.on("data", (data) => {
		conn.write(data.toString());
		console.log("DATA: ", data.toString());
		client.end();
	});

	client.on("end", () => {
		console.log("Disconnected from service!");
	});
}

function signMessage(reqObj) {
	var msg;
	try {
		msg =
			reqObj.method +
			reqObj.path +
			(JSON.stringify(JSON.parse(reqObj.body)) || "");
	} catch (error) {
		return reqObj.raw;
	}

	hexMsg = Buffer.from(msg).toString("hex");

	const sig = secp256k1.sign(hexMsg, priv).toCompactHex();

	authHeader = "Authorization: " + sig + "\r";
	var request = reqObj.raw;

	request = request.split("\n");

	request.map((s) => s.trim());

	// add Authorization header
	request.splice(1, 0, authHeader);
	request = request.join("\n");
	return request;
}

String.prototype.indexOfEnd = function (string) {
	var io = this.indexOf(string);
	return io == -1 ? -1 : io + string.length;
};

module.exports = {
	server: server,
	initWRR: initWRR,
	parseHttpRequest: parseHttpRequest,
	signMessage: signMessage,
};
