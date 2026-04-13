# Sentilytics - Frontend

A modern, animated React frontend for the Audio-Based Intent Prediction system. This application provides a stunning user interface for uploading audio files and visualizing AI-powered analysis results.

## Features

✨ **Modern UI/UX**
- Beautiful gradient backgrounds with animated particles
- Glass-morphism design elements
- Smooth animations using Framer Motion
- Responsive design for all devices

🎯 **Core Functionality**
- Drag & drop audio file upload
- Real-time processing stage visualization
- Interactive data visualizations (charts, graphs)
- Comprehensive results display with multiple views
- Transcript viewer with search functionality

📊 **Data Visualization**
- Circular progress indicators
- Bar charts for conversation metrics
- Radar charts for engagement analysis
- Color-coded intent and interest levels

🎨 **Visual Effects**
- Animated particle background
- Gradient text effects
- Glow effects on interactive elements
- Smooth page transitions
- Hover animations

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Recharts** - Data visualization
- **React Dropzone** - File upload
- **Lucide React** - Icon library
- **Axios** - HTTP client

## Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:8000`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Backend Configuration

The frontend is configured to proxy API requests to the backend. Make sure your backend is running on `http://localhost:8000`.

### Enable CORS in Backend

Add CORS middleware to your FastAPI backend (`audio_based_intent_predection/app/main.py`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Project Structure

```
sentilytics/
├── src/
│   ├── components/
│   │   ├── Header.jsx                 # App header with branding
│   │   ├── ParticlesBackground.jsx    # Animated particle effect
│   │   ├── UploadSection.jsx          # File upload interface
│   │   ├── ProcessingStages.jsx       # Processing visualization
│   │   ├── ResultsDisplay.jsx         # Main results container
│   │   ├── MetricsCard.jsx            # Conversation metrics
│   │   ├── InsightsChart.jsx          # Data visualizations
│   │   ├── FeaturesList.jsx           # Features and objections
│   │   ├── RecommendationsList.jsx    # AI recommendations
│   │   └── TranscriptView.jsx         # Transcript viewer
│   ├── App.jsx                        # Main app component
│   ├── main.jsx                       # App entry point
│   └── index.css                      # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features Breakdown

### Upload Section
- Drag & drop file upload
- File type validation (WAV, MP3, M4A, AAC, OGG)
- File size display
- Error handling

### Processing Stages
1. Uploading - File transfer to server
2. Transcribing - Speech-to-text conversion
3. AI Analysis - GPT-4 conversation analysis
4. ML Processing - Machine learning predictions
5. Generating Insights - Recommendation generation
6. Complete - Results ready

### Results Display

**Overview Tab:**
- Intent classification with confidence score
- Interest level indicator
- Enrollment probability
- Conversation metrics cards
- Interactive charts (bar & radar)
- Summary text

**Features Tab:**
- Student objections list
- Reasons for interest
- Detailed conversation features

**Recommendations Tab:**
- Follow-up priority indicator
- Actionable recommendations
- Pro tips for admissions team

**Transcript Tab:**
- Full conversation transcript
- Search functionality
- Copy to clipboard
- Download as text file
- Speaker identification

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
colors: {
  primary: { /* your colors */ },
  accent: { /* your colors */ }
}
```

### Animations
Modify animation durations in `tailwind.config.js`:
```javascript
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  // Add your custom animations
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lazy loading for components
- Optimized animations
- Efficient re-renders with React
- Code splitting with Vite

## Troubleshooting

**CORS Errors:**
- Ensure backend has CORS middleware configured
- Check backend is running on port 8000

**File Upload Issues:**
- Verify file format is supported
- Check file size limits
- Ensure backend endpoint is accessible

**Styling Issues:**
- Clear browser cache
- Rebuild with `npm run build`
- Check Tailwind CSS configuration

## Future Enhancements

- Real-time audio recording
- Multiple file upload
- Historical analysis dashboard
- Export reports as PDF
- User authentication
- Dark/light theme toggle
- Multi-language support

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
