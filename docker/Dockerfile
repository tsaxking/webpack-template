FROM node:lts-bullseye-slim

WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY ./ ./

RUN apt update && \
	apt install -y git

RUN npm run build

CMD ["ls", "-la"]