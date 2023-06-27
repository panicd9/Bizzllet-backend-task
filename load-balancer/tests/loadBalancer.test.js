const loadBalancer = require('../loadBalancer')

test('Weighted round robin', () => {
    const { services, arrServiceIndices, totalWeight } = loadBalancer.initWRR()

    expect(services).toEqual([ { url: 'url1', weight: 3 }, { url: 'url2', weight: 5 } ])
    expect(arrServiceIndices).toEqual([0, 0, 0, 1, 1, 1, 1, 1])
    expect(totalWeight).toBe(8)
})

test('Is server listening?', () => {
    expect(loadBalancer.server.listening).toBeTruthy()
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

    reqObj = loadBalancer.parseHttpRequest(request)
    signedRequest = loadBalancer.signMessage(reqObj)

    expected = `GET /cart/1 HTTP/1.1
Authorization: 5e5de5796910e608706a3b54aaedf30a14654768d0006386694295c32f0433b85a6419aa19852f80ec5e47c7fc652c841148a45395bb69cc05942dc39520f5b6
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
Authorization: bb8485001bf0c19834b2110dac57e2c622ae1cee5597dc1e053abd9e430813df1f1008ccb45c5ad5b5ebc2688490960f78c691ecd8cf8899b1c9953dfd197bc8
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