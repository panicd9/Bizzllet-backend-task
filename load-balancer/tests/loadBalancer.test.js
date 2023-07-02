const loadBalancer = require('../loadBalancer')
const { secp256k1 } = require("@noble/curves/secp256k1");

test('Weighted round robin', () => {
    const { services, arrServiceIndices, totalWeight } = loadBalancer.initWRR()

    expect(services).toEqual([ { url: 'cart-1:4001', weight: 2 }, { url: 'cart-2:4001', weight: 5 } ])
    expect(arrServiceIndices).toEqual([0, 0, 1, 1, 1, 1, 1])
    expect(totalWeight).toBe(7)
})


test('Parsing HTTP GET request', () => {
    var request = 'GET /cart/1 HTTP/1.1\n' +
    'User-Agent: PostmanRuntime/7.29.2\n' +
    'Accept: */*\n' +
    'Postman-Token: 8bfba605-a4ae-47cb-b588-4cca34178410\n' +
    'Host: localhost:3000\n' +
    'Accept-Encoding: gzip, deflate, br\n' +
    'Connection: keep-alive'

    var parsedReq = loadBalancer.parseHttpRequest(request)
    console.log("parsed: ", parsedReq)
    expect(parsedReq).toEqual({
        path: '/cart/1',
        body: '{}',
        method: 'GET',
        raw: request.toString()
      })
})

test('Parsing HTTP POST request', () => {
    var request = 'POST /cart HTTP/1.1\n' +
    'Content-Type: application/json\n' +
    'User-Agent: PostmanRuntime/7.29.2\n' +
    'Accept: */*\n' +
    'Postman-Token: a7e12e7c-4f23-423d-8cbb-d6696d81b7d8\n' +
    'Host: localhost:3000\n' +
    'Accept-Encoding: gzip, deflate, br\n' +
    'Connection: keep-alive\n' +
    'Content-Length: 71\n' +
    '\n' +
    '{\n' +
    '    "userId": "1",\n' +
    '    "productId": "aaav",\n' +
    '    "quantity": "2"\n' +
    '    }'

    var parsedReq = loadBalancer.parseHttpRequest(request)
    console.log("Parsed: ", parsedReq)
    expect(parsedReq).toEqual({
        path: '/cart',
        body: '{\n    "userId": "1",\n    "productId": "aaav",\n    "quantity": "2"\n    }',
        method: 'POST',
        raw: request.toString()
      })
})

test('Parsing HTTP PUT request', () => {
    var request = `PUT /cart/1 HTTP/1.1
    Content-Type: application/json
    User-Agent: PostmanRuntime/7.29.2
    Accept: */*
    Postman-Token: a7aa1283-e2c6-45f5-ba54-57ab0004dc21
    Host: localhost:3000
    Accept-Encoding: gzip, deflate, br
    Connection: keep-alive
    Content-Length: 72
     
    {
    "userId": "1",
    "productId": "zxcv",
    "quantity": "10"
    }`

    var parsedReq = loadBalancer.parseHttpRequest(request)
    console.log("Parsed: ", parsedReq)
    expect(parsedReq).toEqual({
        path: '/cart/1',
        body: '{\n    "userId": "1",\n    "productId": "zxcv",\n    "quantity": "10"\n    }',
        method: 'PUT',
        raw: request.toString()
      })
})

test('Parsing HTTP DELETE request', () => {
    var request = `DELETE /cart/1 HTTP/1.1
    Content-Type: application/json
    User-Agent: PostmanRuntime/7.29.2
    Accept: */*
    Postman-Token: c7329f26-0bea-46ae-9634-9a03d4c001a9
    Host: localhost:3000
    Accept-Encoding: gzip, deflate, br
    Connection: keep-alive
    Content-Length: 29
     
    {
    "productId": "aaav"
    }`

    var parsedReq = loadBalancer.parseHttpRequest(request)
    console.log("Parsed: ", parsedReq)
    expect(parsedReq).toEqual({
        path: '/cart/1',
        body: '{\n    "productId": "aaav"\n    }',
        method: 'DELETE',
        raw: request.toString()
      })
})

test('Sign request without body', () => {
    var request = 'GET /cart/1 HTTP/1.1\n' +
    'User-Agent: PostmanRuntime/7.29.2\n' +
    'Accept: */*\n' +
    'Postman-Token: 8bfba605-a4ae-47cb-b588-4cca34178410\n' +
    'Host: localhost:3000\n' +
    'Accept-Encoding: gzip, deflate, br\n' +
    'Connection: keep-alive'

    date = new Date()
    reqObj = loadBalancer.parseHttpRequest(request)
    signedRequest = loadBalancer.signMessage(reqObj)

    expected = `GET /cart/1 HTTP/1.1
Authorization: ${signRequest(reqObj, date)}\r
Date: ${date.toString()}\r
User-Agent: PostmanRuntime/7.29.2
Accept: */*
Postman-Token: 8bfba605-a4ae-47cb-b588-4cca34178410
Host: localhost:3000
Accept-Encoding: gzip, deflate, br
Connection: keep-alive`

    expect(signedRequest).toEqual(expected)
})

test('Sign request with body', () => {
    var request = 'POST /cart HTTP/1.1\n' +
    'Content-Type: application/json\n' +
    'User-Agent: PostmanRuntime/7.29.2\n' +
    'Accept: */*\n' +
    'Postman-Token: a7e12e7c-4f23-423d-8cbb-d6696d81b7d8\n' +
    'Host: localhost:3000\n' +
    'Accept-Encoding: gzip, deflate, br\n' +
    'Connection: keep-alive\n' +
    'Content-Length: 71\n' +
    '\n' +
    '{\n' +
    '    "userId": "1",\n' +
    '    "productId": "aaav",\n' +
    '    "quantity": "2"\n' +
    '    }'

    reqObj = loadBalancer.parseHttpRequest(request)
    signedRequest = loadBalancer.signMessage(reqObj)

    expected = `POST /cart HTTP/1.1
Authorization: ${signRequest(reqObj, date)}\r
Date: ${date.toString()}\r
Content-Type: application/json
User-Agent: PostmanRuntime/7.29.2
Accept: */*
Postman-Token: a7e12e7c-4f23-423d-8cbb-d6696d81b7d8
Host: localhost:3000
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Length: 71

{
    "userId": "1",
    "productId": "aaav",
    "quantity": "2"
    }`
    
    expect(signedRequest).toEqual(expected)

    
})


afterAll(() => {
    loadBalancer.server.close()
})

function signRequest(request, date) {
    const priv = new Uint8Array([
      147, 146, 165,  12,  47,  69,   7,
      101, 133, 107, 108, 217, 124,  40,
      188, 158, 192,  51, 159, 124,  46,
      224, 151, 222,  64, 199, 221, 193,
      105, 255,  25, 194
    ])
    msg = date.toString() + request.method + request.path + (JSON.stringify(request.body) || "") 
    hexMsg = Buffer.from(msg).toString('hex')

    const sig = secp256k1.sign(hexMsg, priv).toCompactHex();

    return sig
  }