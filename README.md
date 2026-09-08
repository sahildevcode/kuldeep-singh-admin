# Artist Kuldeep Singh - Studio Owner Admin Console

Dedicated, standalone private studio administration portal for **Artist Kuldeep Singh**.

## 🛡️ Architecture & Security
- **Independent Repository**: Separated completely from the public student/customer website (`artist-kuldeep-singh`).
- **Private Access Only**: Authentication barrier for studio owner (`admin@kuldeepsingh.art`).
- **Zero Public Exposure**: Students and buyers on the public website have no access to administrative tools, database controls, or live management portals.

## 🎨 Features
1. **Paintings & Store Management**: Upload new artworks, adjust medium/dimensions/pricing, mark as sold, and manage inventory.
2. **Masterclasses & Lecture Studio**: Add courses, syllabus modules, Bunny/Cloudflare streaming lectures, and update durations.
3. **Live Class Studio**: Configure Google Meet / live broadcasting link with live countdown and live badge status.
4. **Orders & Art Collectors**: View collector purchases, delivery addresses, and update shipping tracking status.
5. **Students & Progress**: Track student enrollments, module completion rates, and manage student access.
6. **About Artist & Bio**: Customize artist photo, bio description, and 12-year exhibition/awards timeline.

## 🚀 Local Development
```bash
npm install
npm run dev -- --port 5174
```
Server runs on `http://localhost:5174/`.

## 🌐 Netlify Deployment
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **SPA Rewrites**: Handled automatically via `netlify.toml`
