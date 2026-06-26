# 🌿 Garden Tour App - User Guide

## Welcome to Quinta Vale da Lama Field Guide

This interactive web application helps you explore and document the botanical diversity of Quinta Vale da Lama. Whether you're a visitor, researcher, or nature enthusiast, this app transforms your garden exploration into an engaging digital experience.

## 🌟 Core Features

### **Interactive Garden Map**
- **Real-time observations** from iNaturalist project #197410
- **Smart clustering** shows observation density across the garden
- **Time filters** to view observations from today, this week, or all time
- **Garden perimeter** outlined on the map from a KML boundary file

### **Offline-Ready Experience**
- **Service Worker** caches content for offline viewing
- **Progressive Web App (PWA)** can be installed on mobile devices
- **Local storage** preserves your notes and trip plans between visits

### **Personal Documentation Tools**
- **Trip Planner**: Save interesting observations to your personal collection
- **Nature Journaling**: Browse, search, and filter your saved notes by date or photo
- **Export Options**: Download your journal as a formatted text file
- **Photo Integration**: Attach your own photos to observation notes

### **QR Code System**
- **Physical Integration**: QR codes can be placed throughout the garden
- **Instant Access**: Scan a code to jump directly to that species' detail page
- **Admin Tools**: Generate and manage QR codes for garden staff

## 📱 How to Use the App

### Getting Started
1. **Open the app** in any modern web browser
2. **Install as PWA** for an app-like experience on mobile devices (use your browser's "Add to Home Screen" option)

### Navigating the App
A fixed navigation bar at the bottom of most pages gives you quick access to all sections:

| Tab | What it does |
|---|---|
| 🏠 Home | Main map and observation list |
| 📷 QR Admin | Generate QR codes for garden signage |
| 🗺 Trip Plan | Your saved observations |
| 📓 User Journals | Your notes, with search and filters |
| 🔧 Admin | POI registry management |

### Exploring the Garden
1. **Browse the map** to see where observations have been recorded
2. **Use time filters** (Today / This Week / All) to focus on recent activity
3. **Click a map marker** to see the species name, observed date, and a link to iNaturalist
4. **Scan a QR code** on a garden sign to open that species' full detail page — or open a detail page directly via URL (`poi/detail.html?obs=<id>`)

> Clicking a map marker or observation card in the list does not yet navigate to the in-app detail page — that navigation is planned for a future update (see #8).

### On a Species Detail Page
1. **Read species information** pulled live from iNaturalist
2. **Tap ⭐ Save for Offline** to cache the page and its image for use without internet
3. **Tap 📝 Add Note** to record what you noticed or felt at that spot
4. **Attach a photo** you took at the location (optional)
5. **Check "Share this note with the Garden"** to send your note to the garden team (optional)
6. **Tap 💾 Save Note** — your note is added to My Trip Plan and My Journals

### Your Trip Plan
- View all observations you have saved, with photos and notes
- Remove individual items or clear the whole plan
- Export your plan as a text file to keep after your visit

### My Journals
- Shows only your saved entries that include notes (not bare saves)
- **Search** by species name or note text
- **Filter** by All, With Photos, or Recent (last 7 days)
- **Export** your full journal as a formatted text file
- Delete individual entries

### Administrative Features
- **QR Admin**: Select an observation from the current map view and generate a QR code linking to its detail page. Requires visiting the Home page first to load observation data.
- **Admin Dashboard**: View and manage the POI registry stored in your browser. Delete entries and download an updated `index.json`.

## 🔧 Accessibility Features

- **Mobile-first design** works on phones and tablets
- **Offline capability** ensures access even without internet
- **ARIA labels** on map and live regions support screen readers
- **Touch-friendly** interface designed for field use

## 🌐 Technical Details for Users

### Browser Support
- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile browsers** optimised for iOS and Android

### Data Privacy
- **Local storage only** — your personal notes stay on your device
- **Optional sharing** — you control when to share notes with the garden via the checkbox on each detail page
- **iNaturalist integration** uses public observation data only

### Network Requirements
- **Initial load** requires an internet connection
- **Offline browsing** available after first visit (Service Worker caches key assets)
- **Observation data** refreshes automatically when connected

## 🚀 Getting the Most from Your Visit

### Before Your Visit
- **Install the app** on your phone for easy access offline
- **Review recent observations** to see what others have found this week

### During Your Visit
- **Scan QR codes** on garden signs to jump straight to species detail pages
- **Take notes immediately** while observations are fresh
- **Save for Offline** on detail pages if cell coverage is poor in the garden

### After Your Visit
- **Export your journal** to preserve your experience as a text file
- **Share notable discoveries** with the garden community via the sharing checkbox

## 🔍 Advanced Features

### For Researchers
- **Full iNaturalist integration** provides scientific names and observation data
- **Date filtering** for seasonal studies
- **Export capabilities** for further analysis

### For Garden Staff
- **QR code generation** for physical garden integration
- **Admin dashboard** for POI registry management
- **Visitor note sharing** — guests can opt in to share notes; a dedicated staff aggregation view is planned (see #12)

### For Educators
- **Visual learning** through species photos and maps
- **Digital journaling** develops observation skills
- **Scientific vocabulary** integrated throughout the interface
- **Gamification** (points and badges for exploration milestones) is planned (see #9)

## 📞 Support and Feedback

For technical issues or suggestions about the app, contact the garden staff or visit the project repository. The app is designed to be intuitive, but if you encounter any difficulties, help is available.

Remember: This app enhances your garden experience but doesn't replace the joy of direct observation and connection with nature. Take time to look up from your screen and truly experience the living garden around you! 🌱
