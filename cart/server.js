const cart = require('./cart')

const port = process.env.PORT || 4001;

cart.redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.log(err.message);
})

cart.redisClient.on('error', (err) => {
    console.log('Error occured while connecting or accessing redis server');
});

cart.app.listen(port, () => {
    console.log(`Cart service running on port ${port}`);
});
