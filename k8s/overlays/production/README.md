# Production Overlay

## Configuration

This overlay configures the CRM for production deployment with:

- 3 replicas for API and Web
- 2 replicas for Worker
- Production-grade resource limits
- Strict security headers (HSTS, CSP)
- Production secrets (managed via SealedSecrets)

## Files

- `kustomization.yaml` - Kustomize configuration
- `production-secrets.env` - Production secrets template (use SealedSecrets!)
- `nginx-production.conf` - Production Nginx config with strict CSP/HSTS

## Deployment

```bash
# Build and apply
kustomize build . | kubectl apply -f -

# Or via ArgoCD (preferred)
kubectl apply -f ../../argocd/application-production.yaml
```

## Secrets Management

**NEVER** commit real secrets to this overlay. Use:

1. **SealedSecrets** (recommended) - Encrypt secrets with kubeseal
2. **External Secrets Operator** - Sync from Vault/AWS Secrets Manager
3. **Vault Agent Injector** - Sidecar injection

## Resource Limits (Production)

| Component | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit |
| --------- | -------- | ----------- | --------- | -------------- | ------------ |
| API       | 3        | 500m        | 2000m     | 1Gi            | 2Gi          |
| Web       | 3        | 100m        | 500m      | 128Mi          | 512Mi        |
| Worker    | 2        | 250m        | 1000m     | 512Mi          | 2Gi          |

## Security Hardening

- HSTS with preload
- Strict CSP (no 'unsafe-inline' scripts)
- Rate limiting (30 req/s API, 15/min login)
- Secure cookies (Secure, HttpOnly, SameSite=Lax)
- Non-root containers (UID 1000)
- Read-only root filesystem (where possible)
- Drop ALL capabilities
