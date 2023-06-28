FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Expose the port
EXPOSE 4001

# Start the Load Balancer service
CMD [ "node", "server.js" ]