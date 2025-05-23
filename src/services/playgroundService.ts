import api from "../utils/api";
import { DatabaseConnection } from './databaseService';

// Types for playground operations
export interface PlaygroundConnection {
  playgroundId: string;
  connectionId: string;
  createdAt: string;
  connection: DatabaseConnection;
}

export interface Playground {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  connections: PlaygroundConnection[];
}

export interface QueryHistoryItem {
  id: string;
  prompt: string;
  sql: string;
  timestamp: Date;
  hasError: boolean;
  error?: string;
  rowCount?: number;
  executionTime?: number;
  explanation?: string;
}

/**
 * Service for managing SQL playgrounds
 */
class PlaygroundService {
  /**
   * Get all playgrounds for the current user
   */
  async getPlaygrounds(): Promise<Playground[]> {
    try {
      console.log('Fetching playgrounds from API...');
      const response = await api.get('playgrounds');
      
      console.log('API Response:', response);
      
      // The server returns playgrounds in this format: 
      // {success: true, data: {playgrounds: [...]}} or directly in response
      
      let playgroundsData = null;
      
      // Direct check for the exact format shown in the API response
      if (response?.success === true && response?.data?.playgrounds && Array.isArray(response.data.playgrounds)) {
        // Format: {success: true, data: {playgrounds: [...]}}  
        playgroundsData = response.data.playgrounds;
        console.log('Found playgrounds in success.data.playgrounds format', playgroundsData);
      }
      // Check other possible formats
      else if (response?.data?.success === true && response?.data?.data?.playgrounds) {
        // Axios might wrap response in data property: {data: {success: true, data: {playgrounds: [...]}}}
        playgroundsData = response.data.data.playgrounds;
        console.log('Found playgrounds in nested data.data.playgrounds');
      } 
      else if (Array.isArray(response?.data)) {
        // Direct array in data
        playgroundsData = response.data;
        console.log('Found array in data field');
      }
      else if (Array.isArray(response)) {
        // Direct array response
        playgroundsData = response;
        console.log('Found direct array of playgrounds');
      }
      
      // If we found playground data, format it for our UI
      if (playgroundsData && Array.isArray(playgroundsData) && playgroundsData.length > 0) {
        console.log(`Successfully loaded ${playgroundsData.length} playgrounds from API:`, playgroundsData);
        
        // Convert API data to our Playground interface
        return playgroundsData.map((pg: any) => ({
          id: pg.id,
          name: pg.name,
          databaseId: pg.connections && pg.connections.length > 0 ? 
            pg.connections[0]?.connectionId : null,
          currentSql: pg.currentSql || '',
          currentPrompt: pg.currentPrompt || '',
          currentExplanation: pg.currentExplanation || '',
          history: Array.isArray(pg.history) ? pg.history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp || Date.now()),
          })) : [],
          lastUpdated: new Date(pg.updatedAt || pg.createdAt || Date.now())
        }));
      }
      
      console.warn('API did not return valid playground data, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
      return []; // Return empty array on error to prevent UI breakage
    }
  }

  /**
   * Get a playground by ID
   */
  async getPlayground(id: string): Promise<Playground | null> {
    try {
      console.log(`Fetching playground with ID ${id}`);
      const response = await api.get(`playgrounds/${id}`);
      
      // Check if API returned valid data in the expected format
      if (response?.success === true && response?.data?.playground) {
        const playgroundData = response.data.playground;
        
        // Format the playground data to match the Playground interface
        return {
          id: playgroundData.id,
          name: playgroundData.name,
          description: playgroundData.description,
          userId: playgroundData.userId,
          createdAt: playgroundData.createdAt,
          updatedAt: playgroundData.updatedAt,
          connections: playgroundData.connections || []
        };
      }
      
      console.warn(`No playground found with ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error fetching playground with ID ${id}:`, error);
      return null; // Return null on error
    }
  }

  /**
   * Create a new playground
   */
  async createPlayground(name: string, databaseId: string | null = null): Promise<Playground | null> {
    try {
      console.log(`Creating playground: ${name}`);
      const response = await api.post('playgrounds', { name, databaseId });
      
      // Check if API returned valid data
      if (response?.data?.success === true && response?.data?.data?.playground) {
        const playgroundData = response.data.data.playground;
        
        // Format the playground data to match the Playground interface
        return {
          id: playgroundData.id,
          name: playgroundData.name,
          databaseId: playgroundData.connections && playgroundData.connections.length > 0 ? 
            playgroundData.connections[0]?.connectionId : null,
          currentSql: '',
          currentPrompt: '',
          currentExplanation: '',
          history: [],
          lastUpdated: new Date(playgroundData.updatedAt || playgroundData.createdAt || Date.now()),
        };
      }
      
      console.warn('Failed to create playground');
      return null;
    } catch (error) {
      console.error('Error creating playground:', error);
      return null; // Return null on error
    }
  }

  /**
   * Update a playground
   */
  async updatePlayground(id: string, updates: Partial<Playground>): Promise<Playground | null> {
    try {
      console.log(`Updating playground with ID ${id}`);
      const response = await api.put(`playgrounds/${id}`, updates);
      
      // Check if API returned valid data
      if (response?.data?.success === true && response?.data?.data?.playground) {
        const playgroundData = response.data.data.playground;
        
        // Format the playground data to match the Playground interface
        return {
          id: playgroundData.id,
          name: playgroundData.name,
          databaseId: playgroundData.connections && playgroundData.connections.length > 0 ? 
            playgroundData.connections[0]?.connectionId : null,
          currentSql: playgroundData.currentSql || '',
          currentPrompt: playgroundData.currentPrompt || '',
          currentExplanation: playgroundData.currentExplanation || '',
          history: Array.isArray(playgroundData.history) ? playgroundData.history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp || Date.now()),
          })) : [],
          lastUpdated: new Date(playgroundData.updatedAt || playgroundData.createdAt || Date.now()),
        };
      }
      
      console.warn(`Failed to update playground with ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error updating playground with ID ${id}:`, error);
      return null; // Return null on error
    }
  }

  /**
   * Delete a playground
   */
  async deletePlayground(id: string): Promise<boolean> {
    try {
      console.log(`Deleting playground with ID ${id}`);
      // Use the correct method name 'del' instead of 'delete'
      const response = await api.del(`playgrounds/${id}`);
      
      return response?.data?.success === true;
    } catch (error) {
      console.error(`Error deleting playground with ID ${id}:`, error);
      return false; // Return false on error
    }
  }

  /**
   * Add a connection to a playground
   */
  async addConnectionToPlayground(playgroundId: string, connectionId: string): Promise<Playground> {
    try {
      const response = await api.post(`playgrounds/${playgroundId}/connections`, { connectionId });
      return response.data.playground;
    } catch (error) {
      console.error('Error adding connection to playground:', error);
      throw error;
    }
  }
}

export default new PlaygroundService();
