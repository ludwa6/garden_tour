# BioBlitz App Architecture Discussion

**Participants:** Walter Ludwick & ChatGPT (GPT-5)  
**Date Range:** August 2025  
**Topic:** Planning the architecture for a PWA-based BioBlitz biodiversity catalog app with iNaturalist integration.

---

## Key Points

- **Long-term goal:** Integrate with iNaturalist database.
- **Initial platform choice:** Progressive Web App (PWA) for cross-platform ease.
- **GPS dependency:** Concerns about requiring GPS on all devices; alternative approach suggested:
  - QR codes on signposts, beds, and individual plants for location tagging.
- **Backend approach:**
  - API-first design.
  - Synchronization with iNaturalist via their public API.
  - Offline-first capabilities for spotty field connectivity.

---

## Architecture Overview

1. **Frontend (PWA)**
   - Device camera support for photo capture.
   - QR code scanning for location and species hints.
   - Offline data capture and sync.

2. **Backend API**
   - Species observation submission endpoint.
   - Queue for offline sync and retries.
   - Integration layer for iNaturalist API.

3. **Database**
   - Stores:
     - User observations
     - Media assets
     - Location tags (GPS or QR-based)

4. **Integration Layer**
   - iNaturalist API connector.
   - Data mapping for species metadata.

5. **QR Code System**
   - Unique codes per garden location or plant.
   - Links to prefilled observation templates.

---

## Future Enhancements
- AI-assisted species ID.
- Data dashboards for biodiversity metrics.
- Community leaderboards.
