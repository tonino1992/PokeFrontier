FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node *.mjs package.json ./
COPY --chown=node:node public ./public
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV HOST=0.0.0.0 PORT=3100 DATA_DIR=/app/data GAME_PROFILE=live
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3100/api/health').then(r=>r.json()).then(s=>{if(!s.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
