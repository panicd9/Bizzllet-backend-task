const request = require('supertest');
const { app, redisClient } = require('../cart');
const { secp256k1 } =  require('@noble/curves/secp256k1');

// Mock Redis connection
jest.mock('redis', () => {
  return {
    createClient: jest.fn(() => ({
      SMEMBERS: jest.fn(() => Promise.resolve([])),
      sAdd: jest.fn(() => Promise.resolve()),
      sRem: jest.fn(() => Promise.resolve()),
    })),
  };
});

describe('Cart Service', () => {
  beforeEach(() => {
    // Clear any previous mocks and reset Redis client methods
    jest.clearAllMocks();
  });

  describe('GET /cart/:userId', () => {
    it('should return an empty cart when no items are present', async () => {
      const response = await request(app).get('/cart/1').set("Authorization", "5e5de5796910e608706a3b54aaedf30a14654768d0006386694295c32f0433b85a6419aa19852f80ec5e47c7fc652c841148a45395bb69cc05942dc39520f5b6");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({"message": "No items in cart:1 !"});
    });

    it('should return items in cart', async () => {
      redisClient.SMEMBERS.mockImplementation(() => Promise.resolve(['{"productId":"aaav","quantity":"10"}']))
      const response = await request(app).get('/cart/1').set("Authorization", "5e5de5796910e608706a3b54aaedf30a14654768d0006386694295c32f0433b85a6419aa19852f80ec5e47c7fc652c841148a45395bb69cc05942dc39520f5b6");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{productId: "aaav", quantity: "10"}]);
    });
  });

  describe('POST /cart', () => {
    it('should add a product to the cart', async () => {
      const response = await request(app)
        .post('/cart')
        .set("Authorization", signRequest({method: "POST", path: "/cart", body: {userId: "1", productId: 'zxcaaav', quantity: '7' }}))
        .send({userId: "1", productId: 'zxcaaav', quantity: '7' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Product added to cart' });
    });

    it('should NOT add a product to the cart (already in cart)', async () => {
      redisClient.SMEMBERS.mockImplementation(() => Promise.resolve(['{"productId":"aaav","quantity":"10"}']))
      const response = await request(app)
        .post('/cart')
        .set("Authorization", signRequest({method: "POST", path: "/cart", body: {userId: "1", productId: 'aaav', quantity: '10' }}))
        .send({userId: "1", productId: 'aaav', quantity: '10' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Already in database!' });
    });
  });

  describe('PUT /cart/:userId', () => {
    it('should update the quantity of a product in the cart', async () => {
      redisClient.SMEMBERS.mockImplementation(() => Promise.resolve(['{"productId":"aaav","quantity":"10"}']))
      const response = await request(app)
        .put('/cart/1')
        .set('Authorization', signRequest({method: "PUT", path: "/cart/1", body: {userId: "1", productId: 'aaav', quantity: '10' }}))
        .send({userId: "1", productId: 'aaav', quantity: '10' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Product quantity changed!' });
    });

    it('should NOT update the quantity of a product in the cart (not in cart)', async () => {
      const response = await request(app)
        .put('/cart/1')
        .set('Authorization', "7597972b1b575b2ad1512205b19b791972125b42bc37693f01faeb44920ccb023866df7fdb5204123748fe2e150112dae118b8a8e0fc05de8068b6ee6995eac9")
        .send({ userId: '1', productId: 'zxfsafasafscaav', quantity: 10 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ "error": "Cannot change because product with id:zxfsafasafscaav is not in cart!" });
    });
  });

  describe('DELETE /cart/:userId', () => {
    it('should remove a product from the cart', async () => {
      redisClient.SMEMBERS.mockImplementation(() => Promise.resolve(['{"productId":"aaav","quantity":"10"}']))
      const response = await request(app)
        .delete('/cart/1')
        .set('Authorization', signRequest({method: "DELETE", path: "/cart/1", body: {userId: "1", productId: 'aaav', quantity: '10' }}))
        .send({userId: "1", productId: 'aaav', quantity: '10' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Product removed succesfully!' });
    });

    it('should NOT remove a product from the cart (does not exist)', async () => {
      redisClient.sRem.mockImplementation(() => Promise.reject());
      const response = await request(app)
        .delete('/cart/1')
        .set("Authorization", "4fc3045e853593ea4d45c7e5b16e77e0f69418869a58ef9898e47bca2aff7cf1016f23ebb64b34dffd8a53cd3eb72f1360f3145dcc820d398481da475b2c6459")
        .send({ productId: 'asdf' });

      // expect(response.status).toBe(500);
      expect(response.body).toEqual({ "error": "Product does not exist" });
    });
  });

  // Helper function to mock load balancer signing
  function signRequest(request) {
    const priv = new Uint8Array([
      147, 146, 165,  12,  47,  69,   7,
      101, 133, 107, 108, 217, 124,  40,
      188, 158, 192,  51, 159, 124,  46,
      224, 151, 222,  64, 199, 221, 193,
      105, 255,  25, 194
    ])
    msg = request.method + request.path + (JSON.stringify(request.body) || "") 
    hexMsg = Buffer.from(msg).toString('hex')

    const sig = secp256k1.sign(hexMsg, priv).toCompactHex();

    return sig
  }
});
