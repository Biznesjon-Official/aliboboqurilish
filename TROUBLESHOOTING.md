# Troubleshooting Guide

## Common Issues

### MongoDB Connection Issues

#### Error: "connect ECONNREFUSED"
```
Solution:
1. Check MongoDB Atlas connection string
2. Verify IP whitelist in MongoDB Atlas
3. Check network connectivity
4. Verify credentials
```

#### Error: "Authentication failed"
```
Solution:
1. Check username and password
2. Verify database name
3. Check special characters in password (URL encode if needed)
4. Verify user has access to database
```

#### Error: "Timeout"
```
Solution:
1. Increase timeout in connection string
2. Check network latency
3. Verify MongoDB Atlas cluster status
4. Check firewall rules
```

### Server Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :5001

# Kill process
kill -9 <PID>

# Or use different port
PORT=5002 npm start
```

#### High Memory Usage
```bash
# Check memory
pm2 monit

# Restart process
pm2 restart alibobo

# Check for memory leaks
node --inspect server.js
```

#### Server Not Starting
```bash
# Check logs
pm2 logs

# Check environment variables
echo $MONGODB_URI

# Verify dependencies
npm list

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Authentication Issues

#### "Invalid token" Error
```
Solution:
1. Check token format (Bearer <token>)
2. Verify JWT_SECRET matches
3. Check token expiration
4. Verify Authorization header
```

#### "Admin access required" Error
```
Solution:
1. Verify user role is 'admin'
2. Check token contains correct role
3. Verify admin middleware is applied
4. Check authorization header
```

### CORS Issues

#### "CORS blocked origin"
```
Solution:
1. Add origin to ALLOWED_ORIGINS
2. Check origin header in request
3. Verify CORS middleware is applied
4. Check credentials flag
```

#### "Preflight request failed"
```
Solution:
1. Check OPTIONS method is allowed
2. Verify allowed headers
3. Check max-age setting
4. Test with curl
```

### Rate Limiting Issues

#### "Too many requests" (429)
```
Solution:
1. Wait for rate limit window to reset
2. Check rate limit configuration
3. Verify IP is not blocked
4. Check for bot traffic
```

### File Upload Issues

#### "File too large"
```
Solution:
1. Check MAX_FILE_SIZE setting
2. Verify file size
3. Check multer configuration
4. Increase limit if needed
```

#### "Invalid file type"
```
Solution:
1. Check ALLOWED_IMAGE_TYPES
2. Verify file MIME type
3. Check file extension
4. Validate file content
```

### SSL/Certificate Issues

#### "Certificate not found"
```bash
# Check certificate
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

#### "Certificate expired"
```bash
# Check expiration
sudo certbot certificates

# Renew
sudo certbot renew
```

### Nginx Issues

#### "502 Bad Gateway"
```
Solution:
1. Check backend server is running
2. Verify Nginx upstream configuration
3. Check Nginx logs: /var/log/nginx/error.log
4. Verify port configuration
```

#### "Connection refused"
```bash
# Check Nginx status
sudo systemctl status nginx

# Check configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Performance Issues

#### Slow API Responses
```
Solution:
1. Check database query performance
2. Verify indexes are created
3. Check network latency
4. Monitor server resources
5. Check for slow queries in logs
```

#### High CPU Usage
```bash
# Check processes
top

# Profile with Node.js
node --prof server.js
node --prof-process isolate-*.log > profile.txt
```

### Logging Issues

#### Logs not appearing
```
Solution:
1. Check LOG_LEVEL setting
2. Verify log directory exists
3. Check file permissions
4. Verify logger is initialized
```

#### Log file too large
```bash
# Implement log rotation
sudo apt-get install logrotate

# Configure rotation
sudo nano /etc/logrotate.d/alibobo
```

## Debugging

### Enable Debug Mode
```bash
DEBUG=* npm start
```

### Check Environment Variables
```bash
env | grep MONGODB
env | grep JWT
```

### Test Database Connection
```bash
mongosh "mongodb+srv://..."
```

### Test API Endpoint
```bash
curl -X GET http://localhost:5001/api/health
```

### Check Network
```bash
# Test connectivity
ping mongodb.com

# Check DNS
nslookup mongodb.com

# Check ports
netstat -tuln | grep 5001
```

## Logs

### View Logs
```bash
# PM2 logs
pm2 logs

# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Search Logs
```bash
grep "error" logs/app.log
grep "mongodb" logs/app.log
```

## Monitoring

### Check Service Status
```bash
pm2 status
pm2 monit
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

### Check Network
```bash
netstat -tuln
```

## Recovery

### Restart Services
```bash
# Restart backend
pm2 restart alibobo

# Restart Nginx
sudo systemctl restart nginx

# Restart all
pm2 restart all
```

### Restore from Backup
```bash
# List backups
ls -la backups/

# Restore
mongorestore --uri "mongodb+srv://..." --dir backup-2024-01-01
```

### Clear Cache
```bash
cd backend
npm run cache:clear
```

## Getting Help

1. Check logs for error messages
2. Search documentation
3. Check GitHub issues
4. Contact support team

## Support Contacts

- Email: support@aliboboqurilish.uz
- Slack: #support
- GitHub: Issues
