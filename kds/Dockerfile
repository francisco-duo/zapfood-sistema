FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 5176

CMD ["npm", "run", "dev", "--", "--host"]
