# BHMS Tenant Homepage (Client)

This frontend is built with React + Vite and Tailwind CSS v4.

## Quick Start

1. Start the API server (see server folder):

```bash
cd ../server
npm run dev
```

2. Run the client:

```bash
cd ../client
npm run dev
```

By default the client fetches from `http://localhost:3000`. To change, create `.env` and set:

```bash
VITE_API_URL=http://localhost:3000
```

## Features

- Tenant Homepage layout with tile grid and right notifications pane.
- Notifications are fetched from `GET /api/notifications?userId=<id>&q=<search>`.
- Styling matches the provided design with clean slate/blue accents.
