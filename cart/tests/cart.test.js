const cart = require('../cart')
const redis = require('redis-mock')
const request = require('supertest')

// let mockRedisClient;

// beforeEach(() => {
//     mockRedisClient = redis.createClient();
//     jest.mock('redis', () => ({
//         createClient: () => mockRedisClient,
//     }));
// });

jest.mock('redis', () => redis);

afterAll(() => {
    // cart.redisClient.quit()
    // mockRedisClient.quit()
});

// afterEach(async () => {
//     await client.quit()
//   });

test('GET request no auth', async () => {
    const res = await request(cart.app)
                        .get('/cart/1')
                        .expect(403)

})

// test('GET request with auth', async () => {
//     const res = await request(cart.app)
//                         .get('/cart/1')
//                         .set('Authorization', '5e5de5796910e608706a3b54aaedf30a14654768d0006386694295c32f0433b85a6419aa19852f80ec5e47c7fc652c841148a45395bb69cc05942dc39520f5b6')
//                         .expect(200)

// })

// Example test case for the GET endpoint
test('GET /cart/:userId should return cart items', async () => {
    // Initialize the mock Redis database with dummy data
    const cartKey = 'cart:1';
    const dummyData = [
      JSON.stringify({ productId: 'product1', quantity: 2 }),
      JSON.stringify({ productId: 'product2', quantity: 1 }),
    ];
    cart.redisClient.SADD(cartKey, dummyData, (err) => {
      if (err) {
        console.error(err);
      }
    });
  
    const response = await request(cart.app).get('/cart/1')
                                            .set('Authorization', '5e5de5796910e608706a3b54aaedf30a14654768d0006386694295c32f0433b85a6419aa19852f80ec5e47c7fc652c841148a45395bb69cc05942dc39520f5b6')
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ productId: 'product1', quantity: 2 }, { productId: 'product2', quantity: 1 }]);
  });

test('POST request', () => {})

test('PUT request', () => {})

test('DELETE request', () => {})

test('Verify request no Auth header', () => {})

test('Verify request wrong Auth header', () => {})

test('Verify request valid Auth header', () => {})