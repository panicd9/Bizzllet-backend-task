const loadBalancer = require("./loadBalancer")

// Start the TCP server
loadBalancer.server.listen(3000, () => {
	console.log("Load Balancer started on port 3000");
});