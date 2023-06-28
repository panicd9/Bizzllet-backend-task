const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");
const { secp256k1 } = require("@noble/curves/secp256k1");
const app = express();

loadBalancerPub = new Uint8Array([
	3, 220, 176, 74, 186, 168, 174, 173, 46, 174, 204, 159, 206, 132, 254, 84, 30,
	149, 2, 162, 226, 29, 54, 178, 72, 223, 78, 159, 78, 37, 60, 216, 167,
]);

var jsonParser = bodyParser.json();

// Create a Redis client
const redisClient = redis.createClient({
	socket: {
		host: "redis",
		port: "6379",
	},
});

app.get("/cart/:userId", async (req, res) => {
	console.log("Received GET request!");

	if (!verifyRequest(req, loadBalancerPub)) {
		return res.status(403).json({ error: "Forbidden access!" });
	}

	// Generate a unique key for the user's cart in Redis
	const cartKey = `cart:${req.params.userId}`;

	redisClient
		.SMEMBERS(cartKey)
		.then((data) => {
			if (data.length != 0) {
				cartItems = [];
				console.log("DATA: ", data);
				for (var i = 0; i < data.length; i++) {
					console.log("Data[i]", data[i]);
					cartItems.push(JSON.parse(data[i]));
				}
				return res.status(200).json(cartItems);
			} else {
				return res.status(200).json({ message: `No items in ${cartKey} !` });
			}
		})
		.catch((err) => console.error(err));
});

app.post("/cart", jsonParser, async (req, res) => {
	console.log("Received POST request!");
	if (!verifyRequest(req, loadBalancerPub)) {
		return res.status(403).json({ error: "Forbidden access!" });
	}

	var userId, productId, quantity;
	try {
		({ userId, productId, quantity } = req.body);
	} catch {
		return res.status(500).json({ message: "Wrong body!" });
	}

	// Generate a unique key for the user's cart in Redis
	const cartKey = `cart:${userId}`;

	alreadyInDB = false;
	await redisClient
		.SMEMBERS(cartKey)
		.then((data) => {
			if (data.length != 0) {
				for (var i = 0; i < data.length; i++) {
					item = JSON.parse(data[i]);
					cartItems.push(item);
					// console.log(item.productId, productId)
					if (item.productId == productId) {
						alreadyInDB = true;
					}
				}
			}
		})
		.catch((err) => console.error(err));

	if (alreadyInDB) {
		return res.status(500).json({ error: "Already in database!" });
	}

	// Store the product in the user's cart in Redis
	var product = { productId: productId, quantity: quantity };
	redisClient
		.sAdd(cartKey, JSON.stringify(product))
		.then((data) => {
			res.status(200).json({ message: "Product added to cart" });
			console.log(
				"Product added to cart!",
				"\nKey: ",
				cartKey,
				"\nProduct: ",
				product
			);
		})
		.catch((err) => {
			res.status(500).json({ error: "Internal server error" });
			console.error(err);
		});
});

app.put("/cart/:userId", jsonParser, async (req, res) => {
	console.log("Received PUT request!");

	if (!verifyRequest(req, loadBalancerPub)) {
		return res.status(403).json({ error: "Forbidden access!" });
	}

	var userId, productId, quantity;
	try {
		({ userId, productId, quantity } = req.body);
	} catch {
		return res.status(500).json({ message: "Wrong body!" });
	}

	const cartKey = `cart:${req.params.userId}`;
	cartItems = [];
	itemToRemoveString = null;
	// itemToRemove = null

	await redisClient
		.SMEMBERS(cartKey)
		.then((data) => {
			if (data.length != 0) {
				for (var i = 0; i < data.length; i++) {
					item = JSON.parse(data[i]);
					cartItems.push(item);
					// console.log(item.productId, productId)
					if (item.productId == productId) {
						itemToRemoveString = data[i];
						// itemToRemove = item
					}
				}
			}
		})
		.catch((err) => console.error(err));

	if (itemToRemoveString == null) {
		return res.status(500).json({
			error: `Cannot change because product with id:${productId} is not in cart!`,
		});
	}

	await redisClient
		.sRem(cartKey, itemToRemoveString)
		.then()
		.catch((err) => console.error(err));

	var product = { productId: productId, quantity: quantity };

	await redisClient
		.sAdd(cartKey, JSON.stringify(product))
		.then((data) => {
			// console.log(data)
			res.status(200).json({ message: "Product quantity changed!" });
			console.log(
				"Product quantity changed!",
				"\nKey: ",
				cartKey,
				"\nProduct: ",
				product
			);
		})
		.catch((err) => {
			res.status(500).json({ error: "Internal server error" });
			console.error(err);
		});
});

app.delete("/cart/:userId", jsonParser, async (req, res) => {
	console.log("Received DELETE request!");

	if (!verifyRequest(req, loadBalancerPub)) {
		return res.status(403).json({ error: "Forbidden access!" });
	}

	var productId;
	try {
		({ productId } = req.body);
	} catch {
		return res.status(500).json({ message: "Wrong body!" });
	}

	const cartKey = `cart:${req.params.userId}`;

	itemToRemoveString = null;
	await redisClient
		.SMEMBERS(cartKey)
		.then((data) => {
			if (data.length != 0) {
				for (var i = 0; i < data.length; i++) {
					item = JSON.parse(data[i]);
					if (item.productId == productId) {
						itemToRemoveString = data[i];
						// itemToRemove = item
					}
				}
			}
		})
		.catch((err) => console.error(err));

	// console.log("Item to remove string:", itemToRemoveString)
	// console.log("Cartkey", cartKey)

	redisClient
		.sRem(cartKey, itemToRemoveString)
		.then(() => {
			return res.status(200).json({ message: "Product removed succesfully!" });
		})
		.catch((err) => {
			// console.error(err)
			return res.status(500).json({ error: "Product does not exist" });
		});
});

function verifyRequest(request, pub) {
	// sig = request.headers.authentication
	// console.log(request.headers.authorization)
	// console.log("BODY: ", request.body)

	// Return false if there is no "Authorization" header
	if (!request.headers.authorization) {
		return false;
	}

	// Message in format method|path|body ("|" means concatenate)
	msg =
		request.method +
		request.originalUrl +
		(JSON.stringify(request.body) || "{}");
	hexMsg = Buffer.from(msg).toString("hex");

	console.log("Hex msg: ", hexMsg);

	sig = request.headers.authorization;

	console.log("Sig: ", sig);

	isValid = secp256k1.verify(sig, hexMsg, pub) === true;
	console.log(isValid);

	return isValid;
}

module.exports = {
	app: app,
	redisClient: redisClient,
};
