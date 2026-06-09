# Kubernetes deployment

This repository ships a Helm chart in `k8s/helm/farmdb` and an Argo CD Application manifest in `k8s/argocd/farmdb-application.yaml`.

## Release flow

1. `semantic-release` creates a new version.
2. Docker image `carbonbitshq/farmdb:<version>` is published.
3. Workflow `update-infra-charts.yml` copies this chart to `carbonbits/infra-charts` and opens a PR with:
   - updated chart `version`
   - updated chart `appVersion`
   - updated image `tag`
4. After the PR is merged in `infra-charts`, Argo CD syncs and deploys the new release.

## Required GitHub settings

- Secret `GH_APP_PRIVATE_KEY` (base64 encoded private key)
- Secret `GH_APP_ID` (GitHub App client id)
- The GitHub App must have access to both:
  - `carbonbits/farmdb`
  - `carbonbits/infra-charts`

## Apply Argo CD application

```bash
kubectl apply -f k8s/argocd/farmdb-application.yaml
```
