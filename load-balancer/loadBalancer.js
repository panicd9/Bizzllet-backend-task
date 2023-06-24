require('dotenv').config();

const util = require('./util')
const net = require('net');

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
    request = data

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
  requestRaw = requestData.toString()

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
  request.body = requestRaw.substring(
    requestRaw.indexOfEnd("Content-Length: " + contentLength)
  ).trim()

  // console.log(requestRaw)
  // console.log(request.method)
  console.log(request.body)
  // console.log(contentLength)
  return request
}

function forwardHttpRequest(request, conn) {
  // Forward the HTTP request to the specified service
  const client = net.createConnection({ port: 4001 }, () => {
    // 'connect' listener.
    console.log('Connected to service!');
    client.write(request);
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

// String.prototype.indexOfEnd = function(string) {
//   var io = this.indexOf(string);
//   return io == -1 ? -1 : io + string.length;
// }