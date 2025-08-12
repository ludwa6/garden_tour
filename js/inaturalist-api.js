
// iNaturalist API Integration
class iNaturalistAPI {
  constructor() {
    this.baseURL = 'https://api.inaturalist.org/v1';
    this.projectId = '199442'; // Your ERC Vale da Lama project ID
    this.username = 'walt_vdl';
  }

  // Read operations (no auth needed)
  async getProjectObservations(page = 1, perPage = 20) {
    const url = `${this.baseURL}/observations?project_id=${this.projectId}&page=${page}&per_page=${perPage}&order=desc&order_by=observed_on`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error fetching project observations:', error);
      return [];
    }
  }

  async getProjectSpecies() {
    const url = `${this.baseURL}/observations/species_counts?project_id=${this.projectId}&order=desc&order_by=count`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error fetching project species:', error);
      return [];
    }
  }

  async getTaxonInfo(taxonId) {
    const url = `${this.baseURL}/taxa/${taxonId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results[0];
    } catch (error) {
      console.error('Error fetching taxon info:', error);
      return null;
    }
  }

  async searchTaxa(query) {
    const url = `${this.baseURL}/taxa?q=${encodeURIComponent(query)}&rank=species,genus&is_active=true`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error searching taxa:', error);
      return [];
    }
  }

  // Generate URLs for user actions (no auth required)
  getNewObservationURL(taxonId = null, lat = null, lng = null) {
    let url = `https://www.inaturalist.org/observations/new?project_id=${this.projectId}`;
    
    if (taxonId) {
      url += `&taxon_id=${taxonId}`;
    }
    
    if (lat && lng) {
      url += `&latitude=${lat}&longitude=${lng}`;
    }
    
    return url;
  }

  getProjectURL() {
    return `https://www.inaturalist.org/projects/erc-vale-da-lama`;
  }

  // For future OAuth implementation
  async authenticateUser() {
    // This would redirect to iNaturalist OAuth flow
    const clientId = 'YOUR_CLIENT_ID'; // You'll need to register an app
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = 'write';
    
    const authURL = `https://www.inaturalist.org/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    window.location.href = authURL;
  }
}

// Export for use in other modules
window.iNatAPI = new iNaturalistAPI();
