# Chotolate

**Chotolate** is a dynamic spatial management tool designed for the logistics of dorm move-in days. It transforms complicated coordination into a visual, drag-and-drop experience, allowing organizers to manage staff and newcomers with ease across multiple locations.

## 🚀 Core Features

- **Spatial Organization**: Represent physical locations as resizable "Containers" and individuals as interactive "Tiles."
- **Staff & Newcomer Distinction**: Distinct visual styles and behaviors for different person types.
- **House System**: A coordination system designed for use in a dorm with four specific houses (spice-themed):
  - **P** - Paprika (Red)
  - **T** - Turmeric (Yellow)
  - **R** - Rosemary (Blue)
  - **B** - Basil (Green)
  - *First real-world usage scheduled for the end of March 2026.*
- **Fluid Drag & Drop**: Built on `@dnd-kit` for a responsive and performant user experience.
- **Bi-lingual Support**: Full localization for English and Japanese to support a multi-national dorm community.
- **Persistence & Data Portability**: Local storage persistence with the ability to export/import board states via CSV.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS with CSS Variables for theme management.

## 🏃 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/chotolate.git
   cd chotolate
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🗺 Roadmap & Future Vision

Chotolate is currently an MVP focused on solo coordination. We have plans to evolve it into a professional logistics platform:

- **Realtime Collaboration**: Implementing shared viewership so staff on the ground can view updates in realtime from their mobile devices.
- **Multi-domain Expansion**: Generalizing the architecture to support various scenarios such as large-scale event management and multi-position staff tracking.
- **Enterprise Backend**: Attaching a secure backend to support multi-organization multi-tenancy, allowing different groups to manage their own private instances.
- **Mobile Native experience**: Enhancing the mobile UI to provide a "pwa-plus" experience for staff in the field.

## 📄 License

This project is private and proprietary.
