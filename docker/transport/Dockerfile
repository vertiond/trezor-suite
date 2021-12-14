## Use a proxy or fallback to no proxy at all (direct access to Docker Hub).
# ARG CI_DOCKER_PROXY=""
# FROM ${CI_DOCKER_PROXY}cypress/included:8.3.0

FROM node:14

RUN apt-get update && apt-get -y --no-install-recommends install \
    ca-certificates \
    curl \
    git-all

# RUN npm install -g yarn

