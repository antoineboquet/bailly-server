FROM node:18.7-alpine3.15
ENV NODE_ENV=production
ARG port=3000
EXPOSE $port
WORKDIR /bailly
COPY . .
RUN npm install --omit=dev
CMD npm start
