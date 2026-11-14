# Inkwell — Next.js Full-Stack Modern Blog Platform

This is the modernized, full-stack Next.js (App Router) version of the Inkwell Blog Platform, consolidating the previous React/Vite frontend and Express backend into an ultra-fast, SEO-optimized, and secure monolith.

---

## 🚀 Key Improvements & Architecture

1. **Next.js App Router (Full-Stack Monolith)**
   - **Zero CORS Friction**: Frontend and API routes live under the same domain.
   - **Native Vercel Deployment**: No more serverless filesystem bugs or dual server configurations.
   - **Direct Server Component DB Queries**: Blog posts load instantly with pre-rendered HTML without client-side fetch waterfalls.

2. **Search Engine & Social Media Optimization (SEO)**
   - **Dynamic Metadata (`generateMetadata`)**: Automatically generates custom Open Graph images, Twitter Cards, canonical links, and article meta tags for every blog post.
   - **Google Rich Snippets**: Injects JSON-LD `BlogPosting` structured schema.
   - **Dynamic Sitemaps**: `sitemap.ts` dynamically indexes all published articles.

3. **Security & Vulnerability Fixes**
   - **Stored XSS Elimination**: All TipTap rich-text content is sanitized via `DOMPurify` before rendering.
   - **`httpOnly` Auth Cookies**: Access tokens are kept safe in `SameSite=Lax` cookies, removing exposure to `localStorage` theft.
   - **Strict IDOR Ownership Checks**: Users can only edit or delete their own articles.
   - **Duplicate Like Protection**: Unique compound constraint `@@unique([userId, blogId])` prevents users from repeatedly liking posts.
   - **Zero Console / Debugger Leaks**: Removed `console.log(otpCode)` and `debugger;` statements.

4. **100% Code Reuse from Your Original Work**
   - **TipTap Rich Text Editor**: Heading 1/2/3, inline marks, code blocks with Lowlight syntax highlighting, custom alignments, lists, blockquotes, link modals, and image uploads.
   - **Inkwell Design System**: Custom floating background blobs, purple accent gradients, dark/light theme switching, custom buttons, floating-label controlled text and password inputs, and 6-digit OTP fields.
   - **Full Lifecycle Features**: Draft saving, publishing, search filtering, tag filters, view counters, like toggling, and article management dashboard.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Sync Database
```bash
npx prisma generate
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
"# blog-planform" 
