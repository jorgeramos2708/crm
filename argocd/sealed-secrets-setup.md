# SealedSecrets Setup

#

# 1. Install SealedSecrets controller:

# kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml

#

# 2. Generate sealed secrets for each environment:

# kubeseal --format yaml --controller-name=sealed-secrets --controller-namespace=kube-system < staging-secrets.yaml > sealed-staging-secrets.yaml

# kubeseal --format yaml --controller-name=sealed-secrets --controller-namespace=kube-system < production-secrets.env > sealed-production-secrets.yaml

#

# 3. Apply sealed secrets:

# kubectl apply -f sealed-staging-secrets.yaml -n crm-staging

# kubectl apply -f sealed-production-secrets.yaml -n crm-production

---

# Example: SealedSecret for Staging (generated with kubeseal)

# apiVersion: bitnami.com/v1alpha1

# kind: SealedSecret

# metadata:

# name: crm-secrets

# namespace: crm-staging

# spec:

# encryptedData:

# DATABASE_URL: AgBy3...

# POSTGRES_PASSWORD: AgBy3...

# REDIS_PASSWORD: AgBy3...

# JWT_SECRET: AgBy3...

# SESSION_SECRET: AgBy3...

# MICROSOFT_CRYPTO_KEY: AgBy3...

# STRIPE_SECRET_KEY: AgBy3...

# STRIPE_WEBHOOK_SECRET: AgBy3...

# GOOGLE_CLIENT_SECRET: AgBy3...

# MICROSOFT_CLIENT_SECRET: AgBy3...

# CLEARBIT_API_KEY: AgBy3...

# APOLLO_API_KEY: AgBy3...

# SENTRY_DSN: AgBy3...

# SLACK_WEBHOOK_URL: AgBy3...

# SMTP_PASS: AgBy3...

# STRIPE_WEBHOOK_SECRET: AgBy3...

# SENTRY_DSN: AgBy3...

---

# Example: SealedSecret for Production

# apiVersion: bitnami.com/v1alpha1

# kind: SealedSecret

# metadata:

# name: crm-secrets

# namespace: crm-production

# spec:

# encryptedData:

# DATABASE_URL: AgBy3...

# POSTGRES_PASSWORD: AgBy3...

# REDIS_PASSWORD: AgBy3...

# JWT_SECRET: AgBy3...

# SESSION_SECRET: AgBy3...

# MICROSOFT_CRYPTO_KEY: AgBy3...

# STRIPE_SECRET_KEY: AgBy3...

# STRIPE_WEBHOOK_SECRET: AgBy3...

# GOOGLE_CLIENT_SECRET: AgBy3...

# MICROSOFT_CLIENT_SECRET: AgBy3...

# CLEARBIT_API_KEY: AgBy3...

# APOLLO_API_KEY: AgBy3...

# SENTRY_DSN: AgBy3...

# SLACK_WEBHOOK_URL: AgBy3...

# SMTP_PASS: AgBy3...

# STRIPE_WEBHOOK_SECRET: AgBy3...

# SENTRY_DSN: AgBy3...
