# SoraIDE

**Next-generation collaborative code editor with real-time multi-file editing**

[![License](https://img.shields.io/github/license/judge0/ide?color=2185d0&style=flat-square)](./LICENSE)

---

## 🚀 About SoraIDE

SoraIDE is a modern, collaborative online IDE built for real-time pair programming and code execution. Built on top of the Judge0 IDE foundation, it adds:

- **Real-time Collaboration** - Multiple developers editing simultaneously with Liveblocks + Yjs CRDT
- **Multi-file Projects** - Full project support with file trees and tabs
- **Live Previews** - Instant HTML/CSS/JS preview with shareable URLs
- **Code Execution** - Run code in 10+ languages via self-hosted Piston
- **Modern Stack** - Next.js 14, Monaco Editor, Firebase Auth, TypeScript

---

## 📦 Architecture

**Monorepo Structure:**
- `apps/ide` - Next.js 14 frontend with Monaco editor
- `apps/api` - Express API server (code execution, auth)
- `apps/preview` - Preview server for shareable HTML/CSS/JS outputs
- `packages/types` - Shared TypeScript definitions
- `packages/utils` - Shared utilities (validation, rate limiting, security)

**Tech Stack:**
- **Frontend**: Next.js 14 (App Router), Monaco Editor, Tailwind CSS
- **Collaboration**: Liveblocks, Yjs, y-monaco
- **Backend**: Express, Firebase Admin, Piston (code execution)
- **Database**: Firebase Firestore, Firebase Auth
- **Deployment**: Vercel (frontend), Render (backend), Docker (Piston)

---

## 🏁 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker (for Piston)
- Firebase project
- Liveblocks account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/soraide.git
cd soraide

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and Liveblocks credentials

# Start Piston (code execution engine)
pnpm docker:piston

# Start development servers
pnpm dev:all
```

Visit:
- IDE: http://localhost:3000
- API: http://localhost:4000
- Preview: http://localhost:5000

---

## 📖 Documentation

- [Phase 0 Complete](./PHASE_0_COMPLETE.md) - Foundation setup details
- [Environment Setup](./.env.example) - Required environment variables
- [Firebase Security Rules](./firestore.rules) - Database security
- [Deployment Guide](./render.yaml) - Production deployment config

---

## 🛠️ Development

### Available Commands

**Development:**
```bash
pnpm dev:ide         # Start Next.js IDE only
pnpm dev:api         # Start API server only
pnpm dev:preview     # Start preview server only
pnpm dev:backend     # Start API + Preview together
pnpm dev:all         # Start everything
```

**Building:**
```bash
pnpm build           # Build all packages and apps
pnpm build:packages  # Build shared packages (types, utils)
pnpm build:apps      # Build all apps (ide, api, preview)
```

**Docker:**
```bash
pnpm docker:piston   # Start Piston container
pnpm docker:down     # Stop all containers
pnpm docker:logs     # View Piston logs
```

**Firebase:**
```bash
pnpm firebase:emulators  # Start local Firebase emulators
pnpm firebase:deploy     # Deploy to Firebase
```

**Cleanup:**
```bash
pnpm clean:all   # Remove all build outputs
pnpm clean:deep  # Remove build outputs + node_modules
```

---

## 🗺️ Roadmap

### ✅ Phase 0: Foundation (Complete)
- [x] Monorepo setup with pnpm workspaces
- [x] Next.js 14 app with Monaco editor
- [x] Express API + Preview servers
- [x] Firebase + Liveblocks configuration
- [x] Render deployment setup

### 🚧 Phase 1: Core IDE (In Progress)
- [ ] File tree UI with CRUD operations
- [ ] Multi-file tabs and editor
- [ ] In-memory file system
- [ ] Resizable panel layout

### 📋 Phase 2: Collaboration
- [ ] Liveblocks integration
- [ ] Real-time cursor tracking
- [ ] Presence avatars
- [ ] Yjs document synchronization

### 📋 Phase 3: Auth & Persistence
- [ ] Firebase Authentication
- [ ] Firestore project storage
- [ ] User management
- [ ] Project sharing

### 📋 Phase 4: Code Execution
- [ ] Piston integration
- [ ] Multi-language support
- [ ] Output panel
- [ ] Rate limiting

### 📋 Phase 5: Previews
- [ ] Client-side iframe preview
- [ ] Server-side preview generation
- [ ] Shareable preview URLs
- [ ] Session cleanup

### 📋 Phase 6: Deployment
- [ ] Render production deployment
- [ ] Vercel frontend deployment
- [ ] Environment configuration
- [ ] Monitoring setup

---

## 🔒 Security

- **Authentication**: Firebase Auth (Google OAuth, Email/Password)
- **Authorization**: Firestore security rules (owner/collaborator model)
- **Code Execution**: Piston sandboxing (Linux namespaces, cgroups)
- **Preview Security**: CSP headers, sandboxed iframes
- **Rate Limiting**: Per-user quotas (50 runs/hour for free tier)
- **Input Validation**: Filename sanitization, size limits, XSS prevention

See [firestore.rules](./firestore.rules) and [storage.rules](./storage.rules) for details.

---

## 💰 Cost Estimate

**MVP (First 3 months):**
- Render (API + Preview + Piston): ~$23.50/month
- Vercel (Frontend): $0 (Hobby tier)
- Firebase: ~$0-5/month (free tier)
- Liveblocks: $0 (50 MAU free)
- **Total: ~$25-30/month**

**At 500 users:** ~$70/month
**At 5,000 users:** ~$730/month

---

## 🤝 Contributing

Contributions welcome! Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Built on top of [Judge0 IDE](https://github.com/judge0/ide) - special thanks to the Judge0 team for the excellent foundation.

Technologies:
- [Next.js](https://nextjs.org/) - React framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [Liveblocks](https://liveblocks.io/) - Real-time collaboration infrastructure
- [Firebase](https://firebase.google.com/) - Authentication and database
- [Piston](https://github.com/engineer-man/piston) - Code execution engine
- [Render](https://render.com/) - Backend hosting

---

## 📞 Support

- 📧 Email: support@soraide.dev
- 💬 Discord: [Join our community](https://discord.gg/soraide)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/soraide/issues)

---

**Built with ❤️ by Akeil**
