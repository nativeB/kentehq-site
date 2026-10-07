FROM nginx:1.27-alpine
COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Runs at container start (official nginx image executes /docker-entrypoint.d/*.sh); writes config.js from env.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-analytics-config.sh
EXPOSE 80
