# Production Deployment Checklist

## Pre-Deployment

- [ ] All environment variables configured
- [ ] Database credentials secured
- [ ] JWT secret generated and stored
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Backup strategy planned
- [ ] Monitoring setup planned
- [ ] Team access configured

## Security

- [ ] No hardcoded credentials in code
- [ ] `.env` files in `.gitignore`
- [ ] CORS origins whitelisted
- [ ] Rate limiting configured
- [ ] Helmet security headers enabled
- [ ] HTTPS enforced
- [ ] Admin credentials changed
- [ ] Database user permissions restricted
- [ ] API keys rotated
- [ ] Firewall rules configured

## Infrastructure

- [ ] Server provisioned
- [ ] Node.js installed (v18+)
- [ ] MongoDB Atlas configured
- [ ] Nginx installed and configured
- [ ] PM2 installed
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backup storage configured
- [ ] Monitoring tools installed

## Application

- [ ] Dependencies installed
- [ ] Frontend built
- [ ] Database indexes created
- [ ] Environment variables set
- [ ] PM2 ecosystem configured
- [ ] Nginx reverse proxy configured
- [ ] Health check endpoint working
- [ ] Error logging configured
- [ ] Performance monitoring enabled

## Testing

- [ ] Health check passes
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] File uploads working
- [ ] Real-time updates working
- [ ] Error handling tested
- [ ] Rate limiting tested
- [ ] CORS working correctly

## Monitoring & Alerts

- [ ] Error tracking configured (Sentry)
- [ ] Log aggregation setup
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert notifications setup
- [ ] Dashboard created
- [ ] Backup verification scheduled

## Documentation

- [ ] Deployment guide updated
- [ ] API documentation current
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Team trained on deployment
- [ ] Runbooks created for common issues

## Post-Deployment

- [ ] Verify all services running
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Test critical user flows
- [ ] Verify backups working
- [ ] Document any issues
- [ ] Schedule follow-up review

## Rollback Plan

- [ ] Previous version tagged
- [ ] Rollback procedure documented
- [ ] Database backup available
- [ ] Team trained on rollback
- [ ] Communication plan ready

## Sign-Off

- [ ] QA approved
- [ ] Product owner approved
- [ ] DevOps approved
- [ ] Security review passed
- [ ] Performance acceptable

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Approved By:** _______________
**Notes:** _______________
