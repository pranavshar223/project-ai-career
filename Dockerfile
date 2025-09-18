# 1. Base Image: Start from an official, lightweight Node.js version 18 image.
FROM node:20-slim

# 2. Working Directory: Set the working directory inside the container to /app.
WORKDIR /app

# 3. Copy Dependency Files: Copy package.json and package-lock.json.
COPY package*.json ./

# 4. Install Dependencies: Install production dependencies.
RUN npm ci --only=production

# 5. Copy Backend Code: Copy your server's source code into the container.
COPY ./server ./server

# 6. Expose Port: Inform Docker that the container listens on port 8080.
EXPOSE 8080

# 7. Start Command: Define the command to run your server.
CMD [ "node", "server/index.js" ]