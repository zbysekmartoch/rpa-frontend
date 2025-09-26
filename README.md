# Frontend for Retail prices analyzer (RPA) project 

RPA is advanced scalable tool used by Czech Competition Authority for price analysis and detection of anticompetitive behavior.


## Features

- 🔐 User authentication
- 🛒 Product and basket management
- 📊 Analysis creation and execution
- 📈 Analysis results visualization
- 🌍 Multi-language support (Czech, Slovak, English)
- 📱 Responsive design

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **AG-Grid** - Data grids
- **React JSON Schema Form** - Dynamic forms
- **Context API** - State management

## Quick Start

### Prerequisites
- Node.js (18+)
- npm or yarn

### Installation and Running

```bash
# Clone repository
git clone https://github.com/zbysekmartoch/rpa-frontend.git
cd rpa-frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Configuration

1. Copy `.env.example` to `.env`
2. Set backend API URL:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── auth/           # Authentication components
│   └── ui/             # UI components
├── context/            # React contexts
│   ├── AuthContext.jsx
│   └── LanguageContext.jsx
├── tabs/               # Main application pages
│   ├── ProductsTab.jsx
│   ├── BasketsTab.jsx
│   ├── AnalysesTab.jsx
│   ├── ResultsTab.jsx
│   └── SettingsTab.jsx
├── schemas/            # JSON schemas for forms
├── i18n/              # Language files
├── lib/               # Utility functions
└── main.jsx           # Main entry point
```

## Localization

The application supports three languages:
- 🇨🇿 Czech (default)
- 🇸🇰 Slovak
- 🇬🇧 English

Language is automatically detected from browser settings, but can be changed in Settings.

## Backend API

Frontend communicates with REST API backend. Expected endpoints:

- `GET /api/v1/products` - Product list
- `GET /api/v1/baskets` - Basket list
- `POST /api/v1/analyses` - Create analysis
- `GET /api/v1/results` - Results list

## Development

### Adding New Language

1. Add translations to `src/i18n/translations.js`
2. Update `LanguageSelector.jsx`
3. Add language detection to `LanguageContext.jsx`

### Adding New Page

1. Create component in `src/tabs/`
2. Add tab to `App.jsx`
3. Add navigation translations

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Linting
```

## Third-party Components

- **AG-Grid Community** - Data tables
- **React JSON Schema Form** - Forms from JSON schemas
- **Material-UI Icons** - Icons

## License

MIT License

## Author

Zbyšek Martoch - [GitHub](https://github.com/zbysekmartoch)
