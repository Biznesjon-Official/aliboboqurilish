# Security Guidelines

## Environment Variables

### Never Commit Secrets
- Database credentials
- API keys
- JWT secrets
- Telegram tokens
- Any sensitive data

### Use .env Files
```bash
# .env files are in .gitignore
cp backend/.env.example backend/.env
# Edit with actual values
```

### Rotate Secrets Regularly
- JWT_SECRET every 3 months
- Database passwords every 6 months
- API keys when compromised

## Authentication

### JWT Tokens
- Tokens expire after 7 days
- Refresh tokens should be implemented for long-lived sessions
- Store tokens securely on client (httpOnly cookies recommended)

### Password Security
- Minimum 8 characters
- Use bcrypt for hashing (not SHA256 in production)
- Implement password reset flow
- Rate limit login attempts

### Admin Access
- Use strong passwords
- Enable 2FA if available
- Audit admin actions
- Limit admin user count

## API Security

### CORS
- Whitelist only trusted domains
- Never use `*` in production
- Validate origin header

### Rate Limiting
- 100 requests per 15 minutes per IP
- Adjust based on your traffic
- Implement per-user limits for authenticated endpoints

### Input Validation
- Validate all user inputs
- Sanitize database queries
- Validate file uploads
- Check file types and sizes

### Output Encoding
- Encode JSON responses
- Prevent XSS attacks
- Use Content-Type headers

## Database Security

### MongoDB Atlas
- Enable IP whitelist
- Use strong passwords
- Enable encryption at rest
- Enable encryption in transit (TLS)
- Regular backups

### Connection String
- Never hardcode in code
- Use environment variables
- Rotate credentials regularly
- Use connection pooling

### Data Protection
- Encrypt sensitive fields
- Implement field-level access control
- Audit data access
- Regular security audits

## HTTPS/SSL

### Certificate Management
- Use Let's Encrypt (free)
- Auto-renew certificates
- Monitor expiration dates
- Use strong cipher suites

### HSTS
- Enable HTTP Strict Transport Security
- Set max-age to 1 year
- Include subdomains

## File Upload Security

### Validation
- Check file type (MIME type)
- Validate file size (max 50MB)
- Scan for malware
- Store outside web root

### Storage
- Use unique filenames
- Store in separate directory
- Implement access controls
- Regular cleanup of old files

## Logging & Monitoring

### What to Log
- Authentication attempts
- API errors
- Database errors
- Security events
- Admin actions

### What NOT to Log
- Passwords
- API keys
- Credit card numbers
- Personal information
- Sensitive data

### Log Storage
- Centralized logging
- Encrypted storage
- Regular backups
- Retention policy

## Dependency Security

### Keep Dependencies Updated
```bash
npm audit
npm update
npm audit fix
```

### Review Dependencies
- Check for known vulnerabilities
- Use security scanning tools
- Monitor for updates
- Test before updating

### Lock Versions
- Use package-lock.json
- Commit lock file
- Consistent versions across environments

## Infrastructure Security

### Server Hardening
- Disable unnecessary services
- Use firewall rules
- Keep OS updated
- Regular security patches

### Network Security
- Use VPN for admin access
- Implement DDoS protection
- Monitor network traffic
- Regular penetration testing

### Backup Security
- Encrypt backups
- Store off-site
- Test restore procedures
- Regular backup verification

## Incident Response

### Security Breach
1. Isolate affected systems
2. Assess damage
3. Notify users if needed
4. Implement fixes
5. Document lessons learned

### Compromised Credentials
1. Rotate immediately
2. Audit access logs
3. Check for unauthorized changes
4. Notify team
5. Update documentation

## Compliance

### Data Protection
- GDPR compliance
- Data retention policies
- User consent management
- Privacy policy

### Audit Trail
- Log all admin actions
- Maintain audit logs
- Regular audits
- Document compliance

## Security Checklist

- [ ] No hardcoded secrets
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backups tested
- [ ] Dependencies updated
- [ ] Security headers set
- [ ] Error handling secure
- [ ] File uploads validated
- [ ] Database secured

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

## Reporting Security Issues

If you discover a security vulnerability, please email security@aliboboqurilish.uz instead of using the issue tracker.

## Support

For security questions, contact the security team.
