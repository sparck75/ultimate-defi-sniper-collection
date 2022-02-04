FROM node:16.8.0-alpine3.13 AS base

ENV NODE_ENV production

WORKDIR /app

COPY ./dist ./

USER node

CMD ["pcs-prediction-bot"]
