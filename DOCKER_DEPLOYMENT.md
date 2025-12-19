# Docker Deployment Guide for MPS Frontend

## Overview

This guide explains how to deploy the MPS Frontend using Docker with Nginx proxy for Socket.IO connections.

## Architecture

- **Next.js App**: Runs on port 3000 inside container
- **Nginx**: Acts as reverse proxy on port 80/443, proxies Socket.IO to backend
- **Socket.IO Proxy**: Nginx forwards `/socket.io/` requests to backend at `192.168.117.210:3019`

## Files Created

- `Dockerfile`: Builds and runs Next.js app
- `docker-compose.yml`: Orchestrates Next.js and Nginx containers
- `nginx.conf`: Nginx configuration with Socket.IO proxy
- `.dockerignore`: Excludes unnecessary files from build
- `src/lib/socket.ts`: Client-side Socket.IO connection utility

## Deployment Steps

### 1. Build and Run

```bash
cd Frontend
docker-compose up --build -d
```

### 2. Access the Application

- Frontend: http://localhost:3000
- Socket.IO: Automatically proxied via `/socket.io/` path

### 3. Environment Variables

Environment variables are set in `docker-compose.yml`. Update them for production:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `JWT_SECRET`: JWT secret key
- `DEFAULT_USER_PASSWORD`: Default user password

### 4. SSL Configuration (Production)

For production deployment with SSL, you can modify `nginx.conf` to add HTTPS configuration. Since you're using Cloudflare tunnel, SSL is handled externally.

### 5. Production Deployment

For production with Cloudflare tunnel:

- Run the containers locally on port 3000
- Configure Cloudflare tunnel to expose localhost:3000
- Socket.IO will work through the tunnel since it uses the current domain
- Update backend IP in `nginx.conf` if needed for production environment

## Socket.IO Integration

The client connects to Socket.IO using the current domain. Nginx proxies these requests to the backend.

Example usage in React components:

```typescript
import { socket } from '@/lib/socket'

useEffect(() => {
  socket.on('event', (data) => {
    // Handle event
  })

  return () => {
    socket.off('event')
  }
}, [])
```

## Troubleshooting

- Check container logs: `docker-compose logs`
- Ensure backend is running and accessible at the configured IP/port
- Verify firewall allows connections to backend port 3019
