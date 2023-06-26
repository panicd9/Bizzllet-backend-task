const express = require('express');
const bodyParser = require('body-parser')
const redis = require('redis');
const { secp256k1 } =  require('@noble/curves/secp256k1')
const app = express();

loadBalancerPub = new Uint8Array([
    3, 220, 176,  74, 186, 168, 174, 173,
    46, 174, 204, 159, 206, 132, 254,  84,
    30, 149,   2, 162, 226,  29,  54, 178,
    72, 223,  78, 159,  78,  37,  60, 216,
    167
  ])

var jsonParser = bodyParser.json()

const port = process.env.PORT || 4001;

// Create a Redis client
const redisClient = redis.createClient();

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log(err.message);
})

redisClient.on('error', (err) => {
    console.log('Error occured while connecting or accessing redis server');
});

// Example: Get all products from user's cart
app.get('/cart/:userId', async (req, res) => {
    console.log("Received get request!")

    verifyRequest(req, loadBalancerPub)

    const cartKey = `cart:${req.params.userId}`;

    redisClient.SMEMBERS(cartKey)
    .then(data => {
        if (data.length != 0) {
            cartItems = []
            for (var i = 0; i < data.length; i++) {
                cartItems.push(JSON.parse(data[i]))
            }
            res.status(200).json(cartItems)
        } else {
            res.status(200).json({ message: `No items in ${cartKey} !` });
        }
    })
    .catch(err => console.error(err))
});

// Example: Add product to user's cart
app.post('/cart', jsonParser, (req, res) => {
    // Extract the necessary information from the request body
    const { userId, productId, quantity } = req.body;
  
    verifyRequest(req, loadBalancerPub)

    // Validate the input (e.g., check if required fields are present)
  
    // Generate a unique key for the user's cart in Redis
    const cartKey = `cart:${userId}`;

    // Store the product in the user's cart in Redis
    var product = { productId: productId, quantity: quantity }
    redisClient.sAdd(cartKey, JSON.stringify(product))
    .then((data) => {
        res.status(200).json({ message: 'Product added to cart' });
        console.log("Product added to cart!", "\nKey: ", cartKey, "\nProduct: ", product)
    })
    .catch(err => {
        res.status(500).json({ error: 'Internal server error' });
        console.error(err)
    })
    
});

// Example: Update product quantity
app.put('/cart/:userId', jsonParser, async (req, res) => {
// Extract the necessary information from the request parameters and body
// Update the product quantity in the user's cart in Redis
// Return a success response
    console.log("Received PUT request!")
    verifyRequest(req, loadBalancerPub)

    const { userId, productId, quantity } = req.body;   
    const cartKey = `cart:${req.params.userId}`;
    cartItems = []
    itemToRemoveString = null
    // itemToRemove = null

    await redisClient.SMEMBERS(cartKey)
    .then(data => {
        if (data.length != 0) {     
            for (var i = 0; i < data.length; i++) {
                item = JSON.parse(data[i])
                cartItems.push(item)
                // console.log(item.productId, productId)
                if (item.productId == productId) {
                    itemToRemoveString = data[i]
                    // itemToRemove = item
                }
            }
        }
    })
    .catch(err => console.error(err))

    await redisClient.sRem(cartKey, itemToRemoveString)
    .then()
    .catch(err => console.error(err))

    var product = { productId: productId, quantity: quantity }

    await redisClient.sAdd(cartKey, JSON.stringify(product))
    .then((data) => {
        // console.log(data)
        res.status(200).json({ message: 'Product quantity changed!' });
        console.log("Product quantity changed!", "\nKey: ", cartKey, "\nProduct: ", product)
    })
    .catch(err => {
        res.status(500).json({ error: 'Internal server error' });
        console.error(err)
    })
});

// Example: Delete product from user's cart
app.delete('/cart/:userId', jsonParser, async (req, res) => {
// Extract the necessary information from the request parameters
// Remove the product from the user's cart in Redis
// Return a success response

    verifyRequest(req, loadBalancerPub)

    const {productId} = req.body;
    const cartKey = `cart:${req.params.userId}`;

    itemToRemoveString = null
    await redisClient.SMEMBERS(cartKey)
    .then(data => {
        if (data.length != 0) {     
            for (var i = 0; i < data.length; i++) {
                item = JSON.parse(data[i])
                if (item.productId == productId) {
                    itemToRemoveString = data[i]
                    // itemToRemove = item
                }
            }
        }
    })
    .catch(err => console.error(err))

    // console.log(itemToRemoveString)
    redisClient.sRem(cartKey, itemToRemoveString)
    .then()
    .catch(err => console.error(err))
});

// Start the server
app.listen(port, () => {
    console.log(`Cart service running on port ${port}`);
});


function verifyRequest(request, pub) {
    // sig = request.headers.authentication 
    // console.log(request.headers.authorization)
    msg = request.method + request.originalUrl + (JSON.stringify(request.body) || "") 
    hexMsg = Buffer.from(msg).toString('hex')

    console.log("Hex msg: ", hexMsg)

    sig = request.headers.authorization 

    console.log("Sig: ", sig)

    isValid = secp256k1.verify(sig, hexMsg, pub) === true
    console.log(isValid)

    return isValid

}