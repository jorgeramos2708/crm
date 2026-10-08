#!/bin/bash
# Install ArgoCD in Kubernetes cluster
# Run once per cluster

set -e

echo "🚀 Installing ArgoCD..."

# Create namespace
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "⏳ Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
echo "🔑 Getting initial admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "Admin password: $ARGOCD_PASSWORD"

# Expose ArgoCD (optional - for local access)
echo "🌐 Port-forwarding ArgoCD UI (run in background)..."
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

echo "✅ ArgoCD installed!"
echo "📋 Access: https://localhost:8080"
echo "👤 Username: admin"
echo "🔑 Password: $ARGOCD_PASSWORD"
echo ""
echo "📋 Next steps:"
echo "1. Login to ArgoCD UI"
echo "2. Apply project: kubectl apply -f argocd/project.yaml"
echo "3. Apply applications: kubectl apply -f argocd/application-staging.yaml"
echo "4. Apply production: kubectl apply -f argocd/application-production.yaml"