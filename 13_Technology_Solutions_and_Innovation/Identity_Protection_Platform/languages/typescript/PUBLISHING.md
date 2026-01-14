# Publishing @justice/identity-protection-blockchain to NPM

## Prerequisites

1. **NPM Account**: Create account at https://www.npmjs.com
2. **Node.js**: Version 18+ installed
3. **Git**: Repository initialized and pushed to GitHub
4. **Package Name**: Ensure `@justice/identity-protection-blockchain` is available

## Step-by-Step Publishing Instructions

### 1. Initial Setup

```bash
# Navigate to package directory
cd E:\Justice\Decentralized\Modules

# Install dependencies
npm install

# Login to NPM
npm login
```

### 2. Pre-publish Checklist

```bash
# Build the package
npm run build

# Run tests
npm test

# Check package contents
npm pack --dry-run

# Verify package structure
ls -la dist/
```

### 3. First-Time Publishing

```bash
# Check if package name is available
npm view @justice/identity-protection-blockchain

# If available, publish
npm publish --access public

# If you get 402 Payment Required, use scoped package
npm publish --access public
```

### 4. Version Management

```bash
# Patch version (1.0.0 -> 1.0.1)
npm version patch
npm publish

# Minor version (1.0.1 -> 1.1.0)
npm version minor
npm publish

# Major version (1.1.0 -> 2.0.0)
npm version major
npm publish
```

### 5. Alternative: Manual Version Publishing

```bash
# Set version manually in package.json, then:
npm run build
npm test
npm publish
```

## Automated Publishing (Recommended)

### GitHub Actions Setup

1. **Create NPM Token**:
   - Go to https://www.npmjs.com/settings/tokens
   - Create "Automation" token
   - Copy the token

2. **Add GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and Variables → Actions
   - Add secret: `NPM_TOKEN` with your NPM token value

3. **Trigger Automated Publishing**:
   ```bash
   # Create a GitHub release
   git tag v1.0.0
   git push origin v1.0.0
   
   # Or use GitHub Actions manual trigger
   # Go to Actions tab → Publish to NPM → Run workflow
   ```

## Verification Commands

```bash
# Check if package was published
npm view @justice/identity-protection-blockchain

# Test installation
npm install @justice/identity-protection-blockchain

# Check package info
npm info @justice/identity-protection-blockchain
```

## Package Usage After Publishing

Users can install with:
```bash
npm install @justice/identity-protection-blockchain
```

And use in their projects:
```typescript
import { JusticeBlockchain } from '@justice/identity-protection-blockchain';

const justice = new JusticeBlockchain();
await justice.initialize('private-key');
```

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Package name already taken
   ```bash
   # Change name in package.json to something unique
   "name": "@your-username/identity-protection-blockchain"
   ```

2. **402 Payment Required**: Need to publish as scoped package
   ```bash
   npm publish --access public
   ```

3. **Build Errors**: Check TypeScript compilation
   ```bash
   npx tsc --noEmit  # Check for type errors
   npm run build     # Full build
   ```

4. **Test Failures**: Fix tests before publishing
   ```bash
   npm test
   npm run test:coverage
   ```

### Package Size Optimization

```bash
# Check package size
npm pack
tar -tzf justice-identity-protection-blockchain-1.0.0.tgz

# Optimize by updating .npmignore
# Only include dist/, README.md, LICENSE, package.json
```

## Beta/Alpha Releases

```bash
# Publish beta version
npm version prerelease --preid=beta
npm publish --tag beta

# Install beta version
npm install @justice/identity-protection-blockchain@beta
```

## Registry Management

```bash
# Check current registry
npm config get registry

# Set to NPM registry
npm config set registry https://registry.npmjs.org/

# Use .npmrc for project-specific settings (already configured)
```

## Post-Publishing Steps

1. **Update README badges**: Add NPM version badge
2. **Documentation**: Update installation instructions
3. **GitHub Release**: Create release notes
4. **Announce**: Share on social media, Discord, etc.
5. **Monitor**: Check download stats and issues

## Security Considerations

- Never commit `.env` files with private keys
- Use GitHub Secrets for NPM tokens
- Enable 2FA on your NPM account
- Regularly audit dependencies with `npm audit`
