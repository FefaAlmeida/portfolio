FROM nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94
COPY deploy/demo/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/public/matmov.png /usr/share/nginx/html/matmov.png
COPY frontend/public/demos/landing-v3/index.html frontend/public/demos/landing-v3/*.css frontend/public/demos/landing-v3/script.js frontend/public/demos/landing-v3/original-dialogs.js frontend/public/demos/landing-v3/bubbles.js /usr/share/nginx/html/
COPY frontend/public/demos/landing-v3/assets/*.jpg frontend/public/demos/landing-v3/assets/*.jpeg frontend/public/demos/landing-v3/assets/*.png frontend/public/demos/landing-v3/assets/*.svg frontend/public/demos/landing-v3/assets/*.woff2 /usr/share/nginx/html/assets/
