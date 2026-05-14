# Factory Layout Tool

A powerful, visual tool for designing, managing, and reviewing factory floor layouts. This application provides a seamless Admin-Developer feedback loop, an auto-layout engine for various workcenter configurations, and precise coordinate controls.

## Features

- **Interactive Layout Editor**: A blueprint-style visual interface with centered workstation labels and robust boundary constraints.
- **Auto-Layout Engine**: Automatically arrange workstations in U-Shape, Inverted U-Shape, L-Shape, or Straight line configurations.
- **Admin Review Mode**: A dedicated mode for admins to review designs, provide persistent feedback via comments, and manage permissions.
- **Developer Workflow**: Includes version history management, allowing developers to save drafts, revert changes, and promote layouts for administrative review.
- **Coordinate Control**: A sidebar-based CSV editor for precise manual coordinate adjustments, seamlessly mapped to the canvas.

## Tech Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Language**: TypeScript

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://npmjs.com/) or [pnpm](https://pnpm.io/)

## Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd factory-layout-tool
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or if using pnpm
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`.

## Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to catch and fix code issues.

## Usage Guide

### Developer Mode
- Drag and drop workcenters on the grid to adjust the layout.
- Use the sidebar to manually edit coordinates via the integrated CSV data structure.
- Utilize the **Auto-Layout** feature to instantly arrange workcenters into predefined shapes.
- Save drafts and submit versions for Admin review.

### Admin Mode
- Access the `/admin` route (or through the UI toggle) to enter Admin Review mode.
- Review submitted layout drafts.
- Add feedback comments directly onto the layout grid.
- Approve or reject layout submissions.

## Deployment

This Next.js application can be easily deployed on [Vercel](https://vercel.com/):
1. Push your code to a GitHub repository.
2. Import the repository in Vercel.
3. Vercel will automatically detect the Next.js framework and configure the build settings.
4. Click "Deploy".
