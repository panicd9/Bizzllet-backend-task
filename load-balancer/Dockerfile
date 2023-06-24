FROM node:14

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY . .

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Expose the port
EXPOSE 3000

# Start the Load Balancer service
CMD [ "node", "loadBalancer.js" ]