# Stage 1: Build React Vite TypeScript application
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ENV VITE_API_BASE_URL=http://localhost:8000/api/v1
RUN npm run build

# Stage 2: Serve via Nginx lightweight server
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
