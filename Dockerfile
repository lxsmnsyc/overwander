# The app server. `pnpm build` runs on the host, which has more memory
# than Docker's VM and reads .env for the VITE_ variables, so the image
# only packages its output.
#
# Nitro traces what the server imports into .output, so nothing else is needed
FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY .output ./.output
# The server migrates on start, from the same files the repository holds
COPY db/migrations ./db/migrations
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
