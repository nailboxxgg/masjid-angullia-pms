# Masjid Angullia Portal

A comprehensive digital management system designed for Masjid Angullia to streamline community engagement, donations, event management, and administrative operations.

## 🚀 Features

- **Community Portal**: Central hub for updates, prayer times, and mosque info.
- **Admin Dashboard**: secure administrative interface for managing mosque operations.
- **Donation Management**: Streamlined process for handling and tracking donations.
- **Events System**: Tools for organizing and promoting community events.
- **Family Management**: Database for managing community family records.
- **Feedback System**: Channel for community members to provide feedback.
- **Responsive Design**: precise visual experience across mobile, tablet, and desktop.
- **Dark Mode Support**: Built-in dark theme for comfortable viewing in low light.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database / Backend**: [Firebase](https://firebase.google.com/)
- **Fonts**: 
  - English: [Inter](https://fonts.google.com/specimen/Inter) & [Outfit](https://fonts.google.com/specimen/Outfit)
  - Arabic: [Scheherazade New](https://fonts.google.com/specimen/Scheherazade+New)

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd masjid-angullia-pms
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your Firebase configuration and other environment variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Running Locally

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
src/
├── app/                  # App Router pages and layouts
│   ├── (auth)/          # Authentication routes
│   ├── admin/           # Admin dashboard routes
│   ├── donations/       # Public donation routes
│   ├── feedback/        # Feedback routes
│   └── updates/         # Updates/News routes
├── components/           # Reusable UI components
│   ├── layout/          # Layout components (Navbar, Footer, etc.)
│   └── modules/         # Feature-specific components (families, etc.)
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## 📄 License

[MIT License](LICENSE)
