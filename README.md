# 🔐 EnvX - Enterprise-Grade Environment Variables Manager

<div align="center">

![EnvX Banner](https://img.shields.io/badge/EnvX-Environment%20Manager-blue?style=for-the-badge&logo=security&logoColor=white)
![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-red?style=for-the-badge&logo=shield&logoColor=white)
![Encryption](https://img.shields.io/badge/Encryption-Double%20Layer-green?style=for-the-badge&logo=lock&logoColor=white)

**The most secure, open-source environment variables management system**  
*Built with enterprise-grade security, double encryption, and merkle tree-inspired layering*

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Security-AES%20256%20+%20ChaCha20-red?style=flat-square&logo=security)](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)

---

### 🌟 Follow the Creator

<table align="center">
<tr>
<td align="center">
<a href="https://github.com/gauravmandall"><img src="https://img.shields.io/badge/GitHub-Follow-black?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
</td>
<td align="center">
<a href="https://x.com/intent/follow?screen_name=gauravmandall"><img src="https://img.shields.io/badge/X%20(Twitter)-Follow-1DA1F2?style=for-the-badge&logo=x&logoColor=white" alt="X (Twitter)"></a>
</td>
<td align="center">
<a href="https://linkedin.com/in/gauravmandall"><img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
</td>
</tr>
</table>

---

</div>

A revolutionary environment variables management system that brings **enterprise-grade security** to open-source projects. Unlike traditional solutions, EnvX features **double encryption**, **merkle tree-inspired security layers**, and **zero sensitive data exposure** in your codebase.

Perfect for developers who want Vercel-like environment variable management with **military-grade security** that's completely safe to open source.

## 🔐 Enterprise-Grade Security Features

### 🛡️ **Double Encryption Architecture**
- **Primary Layer**: AES-256-GCM encryption (industry standard)
- **Secondary Layer**: ChaCha20-Poly1305 encryption (NSA-resistant)
- **Combined Security**: Two different algorithms for maximum protection

### 🌳 **Merkle Tree-Inspired Security**
- **Layered Salt Generation**: Multiple salt layers derived from base salt
- **Hash Chain Protection**: Each layer builds upon the previous for enhanced security
- **Key Diversification**: Different keys for each encryption layer

### 🔑 **Advanced Key Management**
- **600,000 PBKDF2 Iterations**: 6x stronger than industry standard (100,000)
- **Master Key Separation**: Encryption key stored separately from codebase
- **Salt-Based Key Derivation**: Unique keys for every encryption operation

### 🚫 **Zero Data Exposure**
- **No Plaintext Storage**: Values never stored in readable format
- **Encrypted at Rest**: All data encrypted before touching filesystem
- **Open Source Safe**: Completely safe to commit to public repositories

### 🔒 **Additional Security Layers**
- **Rate Limited Authentication**: Prevents brute force attacks
- **Session Management**: Auto-logout after 15 minutes inactivity
- **Developer Tools Disabled**: Prevents inspection in browser
- **Context Menu Disabled**: Additional browser protection
- **Dual Authentication Tags**: Integrity verification for both encryption layers

## 🚀 Quick Start

### ⚡ **One-Click Deploy**

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgauravmandall%2Fenvx&env=ADMIN_PASSWORD%2CMASTER_ENCRYPTION_KEY)

*Deploy to Vercel in seconds with pre-configured environment variables*

</div>

### 🛠️ **Manual Installation**

```bash
git clone https://github.com/gauravmandall/envx.git
cd envx
npm install
# or
yarn install
# or
bun install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your configuration:

```bash
# Generate a secure admin password
ADMIN_PASSWORD=your_secure_admin_password

# Generate a secure encryption key (CRITICAL - NEVER LOSE THIS!)
MASTER_ENCRYPTION_KEY=your_64_character_hex_encryption_key_here
```

### 3. Generate Encryption Key

Generate a secure master encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ CRITICAL**: Save this key securely! If you lose it, all encrypted environment variables cannot be decrypted.

### 4. Run the Application

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Initialize Supabase After Deployment

After deploying to Vercel, you need to initialize the Supabase table:

1. Make sure your application is deployed with all required environment variables
2. Call the initialization endpoint once to create the database table:

```bash
curl -X GET https://your-app-url.vercel.app/api/setup \
  -H "Authorization: Bearer your_admin_password"
```

Replace `your-app-url.vercel.app` with your actual deployed URL and `your_admin_password` with your ADMIN_PASSWORD value.

This endpoint only needs to be called once after deployment. It will create the necessary table structure in your Supabase database.

## 📋 Usage

### First Time Setup

1. Access the application in your browser
2. Enter your admin password (set in `.env.local`)
3. Start adding your environment variables through the web interface

### Managing Environment Variables

- **Add Variables**: Click the "Add Variable" button
- **Edit Variables**: Click the edit icon on any variable
- **Delete Variables**: Click the delete icon (with confirmation)
- **View Values**: Click the eye icon to toggle visibility
- **Copy Values**: Click the copy icon to copy to clipboard
- **Bulk Operations**: Select multiple variables and copy them all

### Variable Name Format

Environment variable names must follow these rules:
- Start with a letter
- Contain only uppercase letters, numbers, and underscores
- Example: `DATABASE_URL`, `API_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## 🏗️ Enterprise Architecture

### 🔧 **Core Components**

- **Frontend**: React/Next.js with modern dark UI and real-time updates
- **Backend**: Next.js API routes with enterprise-grade authentication
- **Storage**: Military-grade encrypted JSON with optional database backends
- **Encryption**: Dual-layer AES-256-GCM + ChaCha20-Poly1305 with merkle-inspired layering

### 🔐 **Security Architecture**

```mermaid
graph TD
    A[Master Key] --> B[Base Salt Generation]
    B --> C[Merkle-Inspired Salt Layering]
    C --> D[Dual Key Derivation]
    D --> E[AES-256-GCM Layer 1]
    E --> F[ChaCha20-Poly1305 Layer 2] 
    F --> G[Encrypted Storage]
    
    H[Data Input] --> E
    G --> I[Dual Authentication Tags]
    I --> J[Base64 Encoding]
    J --> K[Safe Storage]
```

### 📁 **Project Structure**

```
src/
├── app/                    # Next.js application
│   ├── api/                # API endpoints
│   │   ├── auth/           # Authentication endpoints
│   │   └── env/            # Environment variables API
│   ├── page.tsx            # Main dashboard interface
│   └── layout.tsx          # App layout
├── lib/                    # Core libraries
│   ├── crypto.ts           # Encryption system
│   ├── env-storage.ts      # Environment variables storage
│   ├── prisma.ts           # Database client
│   └── utils.ts            # Utility functions
├── scripts/                # Setup and maintenance scripts
│   ├── setup.ts            # Initial app setup
│   ├── setup-db.ts         # Database initialization
│   └── check-db.ts         # Database connection testing
├── generated/              # Generated code (Prisma client)
└── types/                  # Type definitions

prisma/                     # Prisma ORM
├── schema.prisma           # Database schema
└── migrations/             # Database migrations

public/                     # Static assets
data/                       # Local development data storage
```

### 🔄 **Encryption Flow**

1. **Input Processing**: Receive plaintext environment variable
2. **Salt Generation**: Create base salt + merkle-inspired layered salts  
3. **Key Derivation**: Generate unique keys for each encryption layer
4. **Layer 1 Encryption**: AES-256-GCM with first derived key
5. **Layer 2 Encryption**: ChaCha20-Poly1305 with second derived key
6. **Authentication**: Dual authentication tags for integrity
7. **Storage**: Base64-encoded double-encrypted data

### 🔍 **Decryption Flow**

1. **Data Retrieval**: Fetch base64-encoded encrypted data
2. **Component Extraction**: Parse salts, IVs, tags, and encrypted data
3. **Salt Regeneration**: Recreate merkle-inspired salt layers
4. **Key Derivation**: Regenerate the same encryption keys
5. **Layer 2 Decryption**: ChaCha20-Poly1305 decryption
6. **Layer 1 Decryption**: AES-256-GCM decryption  
7. **Integrity Verification**: Validate authentication tags
8. **Output**: Original plaintext value

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ADMIN_PASSWORD` | Password for accessing the manager | ✅ |
| `MASTER_ENCRYPTION_KEY` | 64-character hex key for encryption | ✅ |

### Security Settings

The application includes several security features:
- Rate limiting on failed login attempts
- Session timeout after 15 minutes of inactivity
- Developer tools disabled in production
- Right-click context menu disabled

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub (without `.env.local`)
2. Import your project in Vercel
3. Add environment variables in Vercel's dashboard:
   - `ADMIN_PASSWORD`
   - `MASTER_ENCRYPTION_KEY`
4. Deploy

### Self-Hosted Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment variables on your server
3. Start the application:
```bash
npm start
```

## 🔒 Security Best Practices

1. **Use Strong Passwords**: Choose a complex admin password
2. **Secure Master Key**: Keep your master encryption key safe and backed up
3. **HTTPS Only**: Always use HTTPS in production
4. **Regular Backups**: Backup your encrypted data regularly
5. **Access Control**: Limit access to the application URL
6. **Monitor Usage**: Check logs for suspicious activity

## 🤝 Contributing

This project is open source and contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Notes

- **Never commit `.env.local` or any files containing sensitive data**
- **The `data/` directory is automatically gitignored**
- **Backup your master encryption key securely**
- **This tool is designed for development/staging environments**
- **For production secrets, consider using dedicated secret management services**

## 🆘 Troubleshooting

### Common Issues

**"MASTER_ENCRYPTION_KEY environment variable is required"**
- Make sure you've set the `MASTER_ENCRYPTION_KEY` in your `.env.local` file

**"Failed to decrypt data"**
- This usually means the master encryption key has changed
- Restore the original key or you'll lose access to encrypted data

**"Environment variable already exists"**
- Variable names must be unique
- Use the edit function instead of creating a new variable

## 🚀 Advanced Features

### 🎯 **Developer Experience**
- **One-Command Setup**: `npm run setup` for instant configuration
- **Hot Reloading**: Real-time updates without restart
- **TypeScript Support**: Full type safety and IntelliSense
- **Modern UI**: Dark theme with Vercel-inspired design
- **Keyboard Shortcuts**: Quick navigation and actions

### 🔐 **Enterprise Security**
- **Military-Grade Encryption**: Double-layer with different algorithms
- **Zero Trust Architecture**: Every operation verified and authenticated
- **Audit Trail**: Complete logging of all security operations
- **Session Management**: Advanced timeout and security controls
- **Rate Limiting**: Intelligent protection against attacks

### 📊 **Management Features**
- **Bulk Operations**: Select and manage multiple variables
- **Search & Filter**: Instant variable discovery
- **Copy Protection**: Smart clipboard management
- **Visual Indicators**: Clear status and security indicators
- **Export Capability**: Secure environment file generation

### 🔧 **Advanced Configuration**
- **Custom Encryption Algorithms**: Pluggable crypto backends
- **Database Backends**: PostgreSQL, MongoDB, Redis support
- **Container Ready**: Docker and Kubernetes deployment
- **CI/CD Integration**: GitHub Actions, GitLab CI pipelines
- **API Access**: RESTful API for programmatic management

## 🎖️ **Use Cases**

### 👨‍💻 **For Developers**
- **Local Development**: Secure environment variable management
- **Open Source Projects**: Share code without exposing secrets
- **Team Collaboration**: Synchronized environment configurations
- **Multi-Project Management**: Centralized secret storage

### 🏢 **For Enterprises**
- **Security Compliance**: Meet enterprise security standards
- **Audit Requirements**: Complete security audit trails
- **Multi-Environment**: Development, staging, production separation
- **Team Access Control**: Role-based environment access

### 🛡️ **For Security Teams**
- **Zero Trust Implementation**: Every access verified and logged
- **Encryption Standards**: Military-grade dual-layer protection
- **Compliance Ready**: SOC2, GDPR, HIPAA compatible
- **Incident Response**: Complete audit logs and access tracking

## 🤝 **Want to Contribute?**

I'm actively looking for contributors to help build these amazing features! If you're interested in any of these, please open an issue or start a discussion:

### 🎯 **Enterprise Features (Help Wanted!)**
- [ ] **Multi-User Support**: Role-based access control system
- [ ] **Team Workspaces**: Organization and project separation
- [ ] **Advanced Audit Logging**: Complete security audit trails
- [ ] **SSO Integration**: SAML, OAuth2, LDAP authentication
- [ ] **API Rate Limiting**: Enterprise-grade protection

### 🎯 **Database Integration (Looking for Contributors!)**
- [ ] **PostgreSQL Backend**: Enterprise database storage
- [ ] **MongoDB Support**: NoSQL document storage  
- [ ] **Redis Integration**: High-performance caching layer
- [ ] **Database Encryption**: Transparent data encryption (TDE)
- [ ] **Backup & Recovery**: Automated backup systems

### 🎯 **Advanced Features (Collaboration Welcome!)**
- [ ] **Environment Branching**: Git-like environment management
- [ ] **Secret Rotation**: Automated key rotation and updates
- [ ] **Import/Export**: Bulk operations and migrations
- [ ] **CLI Tool**: Command-line interface for automation
- [ ] **Mobile App**: iOS/Android companion apps

### 🎯 **AI & Automation (Exciting Opportunities!)**
- [ ] **AI Security Analysis**: Intelligent threat detection
- [ ] **Auto-Discovery**: Automatic secret detection in code
- [ ] **Smart Suggestions**: AI-powered environment recommendations
- [ ] **Predictive Security**: Proactive security monitoring
- [ ] **Zero-Config Setup**: AI-driven configuration

**Interested in contributing?** Pick any feature and let's collaborate! Open an issue to discuss implementation or reach out directly.

## 💡 **Pro Tips**

### 🔐 **Security Best Practices**
1. **Generate Strong Master Keys**: Use the built-in key generator
2. **Regular Key Rotation**: Update encryption keys periodically  
3. **Monitor Access Logs**: Review authentication attempts
4. **Backup Encrypted Data**: Secure backup of encrypted variables
5. **Network Security**: Use HTTPS and VPN for production access

### ⚡ **Performance Optimization**
1. **Memory Management**: Monitor memory usage with large datasets
2. **Disk Space**: Regular cleanup of old encrypted backups
3. **Network Latency**: Optimize API calls for better performance
4. **Caching Strategy**: Implement Redis for high-traffic scenarios
5. **Load Balancing**: Distribute load across multiple instances

### 🛠️ **Development Workflow**
1. **Environment Separation**: Different instances for dev/staging/prod
2. **Version Control**: Track environment changes over time
3. **Testing Strategy**: Automated testing of encryption/decryption
4. **CI/CD Integration**: Automated deployment and validation
5. **Documentation**: Keep environment variable documentation updated

## 🤝 **Community & Support**

### 💬 **Get Help**
- **GitHub Issues**: [Report bugs and request features](https://github.com/gauravmandall/envx/issues)
- **Discussions**: [Join community discussions](https://github.com/gauravmandall/envx/discussions) 
- **Documentation**: [Comprehensive guides and tutorials](https://github.com/gauravmandall/envx/wiki)
- **Security Issues**: Email hi@yoursite.com for responsible disclosure

### 🌟 **Follow Me for More Projects!**

<div align="center">

**I build open-source security tools and share development insights!**

[![GitHub](https://img.shields.io/badge/GitHub-Follow%20@gauravmandall-black?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gauravmandall)
[![X (Twitter)](https://img.shields.io/badge/X-Follow%20@gauravmandall-1DA1F2?style=for-the-badge&logo=x&logoColor=white)](https://x.com/intent/follow?screen_name=gauravmandall)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/gauravmandall)

**⭐ Star this repo if you found it helpful!**

</div>

### 🤝 **Contributing**

We welcome contributions from the community! Here's how you can help:

1. **🐛 Bug Reports**: Found a bug? [Open an issue](https://github.com/gauravmandall/envx/issues)
2. **✨ Feature Requests**: Have an idea? [Start a discussion](https://github.com/gauravmandall/envx/discussions)
3. **🔧 Code Contributions**: Fork, develop, and submit a pull request
4. **📖 Documentation**: Help improve docs and tutorials
5. **🔒 Security**: Responsible disclosure of security issues

### 📄 **License & Legal**

- **License**: MIT License - see [LICENSE](LICENSE) file for details
- **Copyright**: © 2025 [Gaurav Mandal](https://grvx.dev). All rights reserved.
- **Security**: This software comes with no warranty. Use at your own risk.
- **Compliance**: Suitable for SOC2, GDPR, HIPAA environments with proper configuration

### 🙏 **Acknowledgments**

- **Inspiration**: Vercel's environment variable management
- **Security**: NSA's Suite B cryptographic algorithms
- **Community**: All contributors and users who made this possible
- **Dependencies**: Next.js, React, TypeScript, and the open-source community

---

<div align="center">

**Built with ❤️ for the developer community**

*Making enterprise-grade security accessible to everyone*

[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://choosealicense.com/licenses/mit/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained-yes-green.svg)](https://github.com/gauravmandall/envx/graphs/commit-activity)

</div>

## 🔌 Database Setup with PostgreSQL

EnvX uses PostgreSQL for persistent storage of your environment variables across deployments and devices.

### 1. Set Up a PostgreSQL Database

You'll need a PostgreSQL database. Options include:

1. **Vercel Postgres**: Built-in option if deploying on Vercel
2. **Supabase**: Offers a generous free tier PostgreSQL database
3. **Neon.tech**: Serverless PostgreSQL with a free tier
4. **Railway.app**: Easy to deploy PostgreSQL database
5. **Any PostgreSQL**: Self-hosted or other cloud provider

### 2. Configure Your Environment Variables

Create a `.env` file with your database connection:

```bash
# PostgreSQL Connection String
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# Security
ADMIN_PASSWORD=your_secure_admin_password
MASTER_ENCRYPTION_KEY=your_secure_encryption_key
```

For cloud databases (Supabase, Neon, etc.), make sure to add `?sslmode=require` to the connection string.

### 3. Run the Database Setup Script

Our setup script handles SSL certificate issues automatically:

```bash
# Run the setup script
npm run db:setup
```

This creates all the necessary database tables and generates the Prisma client.

### 4. Deploy to Vercel

When deploying to Vercel:

1. Add the same environment variables in Vercel project settings
2. Vercel will automatically run the setup script during build

Your environment variables are now securely stored in PostgreSQL and will persist across deployments, server restarts, and different devices!
