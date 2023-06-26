require('dotenv').config();

const util = require('./util')
const net = require('net');
const { secp256k1 } =  require('@noble/curves/secp256k1');
const { json } = require('stream/consumers');
const { request } = require('http');

// const priv = secp256k1.utils.randomPrivateKey();
// const pub = secp256k1.getPublicKey(priv);
const priv = new Uint8Array([
  147, 146, 165,  12,  47,  69,   7,
  101, 133, 107, 108, 217, 124,  40,
  188, 158, 192,  51, 159, 124,  46,
  224, 151, 222,  64, 199, 221, 193,
  105, 255,  25, 194
])
const pub = new Uint8Array([
  3, 220, 176,  74, 186, 168, 174, 173,
  46, 174, 204, 159, 206, 132, 254,  84,
  30, 149,   2, 162, 226,  29,  54, 178,
  72, 223,  78, 159,  78,  37,  60, 216,
  167
])
console.log(priv)
console.log(pub)
// const msg = new Uint8Array(32).fill(1);
// const sig = secp256k1.sign(msg, priv);
// const isValid = secp256k1.verify(sig, msg, pub) === true;

// Load the initial service URLs and weights from environment variables
const services = [
  { url: process.env.SERVICE_1_URL, weight: parseInt(process.env.SERVICE_1_WEIGHT) },
  { url: process.env.SERVICE_2_URL, weight: parseInt(process.env.SERVICE_2_WEIGHT) },
  // Add more services as needed
];
const totalWeight = services.reduce((sum, { weight }) => sum + weight, 0);
var arrServiceIndices = []
for (let i = 0; i < services.length; i++) {
    arrServiceIndices = arrServiceIndices.concat(Array(services[i].weight).fill(i))
}
// console.log(arrServiceIndices)

// // Define the Weighted Round Robin algorithm to distribute requests
// let currentServiceIndex = 0;

function getNextService() {
  // Implement the Weighted Round Robin algorithm here
  // Return the next service based on the weights
    rnd = util.getRandomInt(totalWeight)

    return services[arrServiceIndices[rnd]]
}

// Create a TCP server
const server = net.createServer((conn) => {
  // Handle incoming HTTP requests
  console.log('Client connected!');

  conn.on('data', (data) => {
    var request = data

    // // Get the next service using the Weighted Round Robin algorithm
    // const nextService = getNextService();

    // // Forward the HTTP request to the next service
    forwardHttpRequest(request, conn);
  });

});

// server.on('data', (data) => {
//   // Parse the HTTP request
//   // header = JSON.parse(data.substring(data.indexOf("\n") + 1, data.lastIndexOf("\n")))
//   // console.log(header)
//   // var parsed = parseRequest(
//   //   Buffer.from(`GET / HTTP/1.1
//   // Host: www.example.com
  
//   // `)
//   // );
  

//   // console.log(parsed.body);

//   // console.log(parsed);
//   // console.log(parseRequest(data))
//   // const request = parseHttpRequest(data);
//   request = data

//   // Get the next service using the Weighted Round Robin algorithm
//   const nextService = getNextService();

//   // Forward the HTTP request to the next service
//   forwardHttpRequest(request, nextService);
// });

// Start the TCP server
server.listen(3000, () => {
	console.log('Load Balancer started on port 3000');
  	// for (let i = 0; i < 100; i++) {
    // 	console.log(getNextService())
	// }
});

// Helper functions for parsing and forwarding HTTP requests
// Implement these functions according to the requirements of the task
function parseHttpRequest(requestData) {
  // Parse the HTTP request and return the necessary information
  // console.log("typeof", toType(requestData))
  requestRaw = requestData.toString()

  request.raw = requestRaw

  request.method = requestRaw.substring(
    0,
    requestRaw.indexOf(" ")
  )
  contentLength = parseInt(requestRaw.substring(
    requestRaw.indexOfEnd("Content-Length: "),
    requestRaw.indexOf("\n", requestRaw.indexOf("Content-Length: "))
  ))
  
  // m = /\n\s*/.exec(requestRaw)
  // bodyStartIndex = m.index + m[0].length
  // console.log(bodyStartIndex)

  request.path = requestRaw.split(' ')[1]
  // console.log("requestData.path", requestData.path)

  request.body = null
  if (request.method != "GET") {
    request.body = requestRaw.substring(
      requestRaw.indexOfEnd("Content-Length: " + contentLength)
    ).trim()
  } else {
    request.body = ""
  }
  

  console.log(requestRaw)
  // console.log(request.method)
  // console.log(request.body)
  // console.log(contentLength)
  return request
}

function forwardHttpRequest(request, conn) {
  // Forward the HTTP request to the specified service
  const client = net.createConnection({ port: 4001 }, () => {
    // 'connect' listener.
    console.log('Connected to service!');
    reqObj = parseHttpRequest(request)
    reqSigned = signMessage(reqObj)

    console.log("reqObj:", reqObj.body, "\n")
    // console.log(request.toString());
    client.write(reqSigned);
  });

  

  client.on('data', (data) => {
    conn.write(data.toString());
    // console.log(data.toString());
    client.end();
  });

  client.on('end', () => {
    console.log('Disconnected from service!');
  }); 
}

String.prototype.indexOfEnd = function(string) {
  var io = this.indexOf(string);
  return io == -1 ? -1 : io + string.length;
}


function signMessage(reqObj) {

  // reqObj = reqObj.raw
  msg = reqObj.method + reqObj.path + (JSON.stringify(JSON.parse(reqObj.body)) || "") 

  hexMsg = Buffer.from(msg).toString('hex')
  console.log("Hex msg: ", hexMsg)
  const sig = secp256k1.sign(hexMsg, priv).toCompactHex();

  // sigSerialized = JSON.stringify(sig, (key, value) =>
  //                               typeof value === 'bigint'
  //                                   ? value.toString()
  //                                   : value // return everything else unchanged
  //                               )
  
  // hexSigSerialized = Buffer.from(sigSerialized).toString('hex')

  // console.log("Sig:", hexSigSerialized)

  // console.log(hexSigSerialized)
  authHeader = "Authorization: " + sig
  var request = reqObj.raw
  // console.log("Request: ", request)
  request = request.split("\n")
  // console.log("Request: ", request)
  request.splice(1, 0, authHeader)
  request = request.join("\n")
  console.log("Request: ", request)

  return request
}