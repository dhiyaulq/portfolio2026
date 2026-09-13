# Portfolio site — setup guide

This is a Next.js portfolio site with an embedded Sanity Studio CMS at `/studio`,
so you can upload high-quality JPGs of your work any time, from any device, without
touching code.

Run all commands below in Terminal, inside this project folder
(`cd ~/Documents/portfolio-site`).

## Design fidelity notes

The sidebar layout, copy, colors, spacing, and typography are pulled directly from
your Figma file (`dsign-studio`). Two things were swapped for maintainable
equivalents instead of raw Figma exports (the automated environment used to build
this couldn't download binary image assets from Figma):

- **Icons** — every icon (skills, dev tools, chat/email, layout switcher) uses
  `lucide-react` and `react-icons` instead of the exact exported PNG/SVG. They're
  close matches, real vector icons, and easy to swap (edit `src/lib/siteConfig.ts`).
- **"Worked with" client logos** and the **"dsign" logomark** are placeholder
  text/shapes — replace them with your real logo files whenever you're ready
  (drop images into `public/` and swap the JSX in `src/components/Sidebar.tsx`).

The showcase (right side) implements the 4 layout modes from your Figma toggle:
- **1-Col** — full-width images stacked vertically
- **2-Col** — even 2-column grid, uniform crop
- **3D-1** — 2-column masonry using each image's real aspect ratio (organic, staggered heights)
- **3D-2** — same masonry, plus a subtle scroll-parallax between the two columns for depth

All 4 modes pull from the same CMS-uploaded work images — switching modes doesn't
require re-uploading anything.

## 1. Install dependencies

```bash
npm install
```

## 2. Create your free Sanity project

```bash
npx sanity@latest init
```

- When it asks "Create new project" → yes.
- Project name: anything, e.g. "portfolio".
- Use the default dataset configuration → **production**.
- When asked "Would you like to add configuration files for a Sanity project in this
  folder?" → **No** (this project already has `sanity.config.ts` and the schema).

This prints a **Project ID**. Copy it.

## 3. Set your environment variables

```bash
cp ENV_EXAMPLE.txt .env.local
```

Open `.env.local` and paste your Project ID:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_SANITY_DATASET=production
```

## 4. Run it locally

```bash
npm run dev
```

- Site: http://localhost:3000
- CMS (upload dashboard): http://localhost:3000/studio — log in with the same
  account you used for `sanity init`, then click **Work → Create new**, fill in
  a title, and drag in your JPG. It'll show up on the homepage within a minute.

## 5. Put it on GitHub

```bash
git init
git add .
git commit -m "Initial portfolio site"
```

Create a new empty repo at https://github.com/new (don't initialize it with a
README), then:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio-site.git
git push -u origin main
```

## 6. Deploy for free on Vercel

1. Go to https://vercel.com and sign up/log in with your GitHub account.
2. Click **Add New → Project**, pick your `portfolio-site` repo.
3. Under **Environment Variables**, add the same two values from `.env.local`:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
4. Click **Deploy**.

You'll get a live URL like `portfolio-site-yourname.vercel.app`. Your CMS is at
`/studio` on that same URL — e.g. `portfolio-site-yourname.vercel.app/studio`.

### One more Sanity step for the deployed CMS

Sanity needs to know your live domain is allowed to talk to it:

1. Go to https://www.sanity.io/manage, open your project → **API** → **CORS Origins**.
2. Add your Vercel URL (and later your custom domain), with **"Allow credentials"** checked.

## 7. (Optional) Connect a custom domain

In your Vercel project → **Settings → Domains**, add your domain and follow the
DNS instructions Vercel shows you (usually one CNAME or A record at your domain
registrar). Then repeat the CORS step above with your custom domain.

## Uploading work going forward

Any time you want to add new work: go to `yoursite.com/studio`, log in, click
**Work → Create new**, upload your JPG (full resolution is fine — Sanity
optimizes delivery automatically), fill in the title/category, and click
**Publish**. It appears on the live site within about a minute.
