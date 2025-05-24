import axiosInstance from '../utils/api';

export interface GenerateQueryPayload {
  prompt: string;
  playgroundId?: string;
  connectionId: string;
  enforceDQL?: boolean;
}

// Based on the sample response provided by the user
export interface ApiQueryResponseData {
  id: string;
  playgroundId: string | null;
  userId?: string;
  connectionId?: string;
  sandboxDbId: string | null;
  prompt: string;
  sqlQuery: string; 
  //explanation: string;
  result: any | null; 
  error: any | null; 
  executionTime: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateQueryApiResponse {
  success: boolean;
  data: {
    query: ApiQueryResponseData;
  };
  message?: string;
}

// Interface for the parsed data within the sqlQuery field
export interface ParsedSqlData {
  query: string;
  explanation: string;
}

const queryService = {
  generateQuery: async (
    payload: GenerateQueryPayload
  ): Promise<GenerateQueryApiResponse> => {
    try {
      const response = await axiosInstance.post<
        GenerateQueryApiResponse
      >('/queries/generate', payload);
      return response;
    } catch (error) {
      console.error('Error in queryService.generateQuery:', error);
      throw error;
    }
  },

  executeQuery: async (
    queryId: string,
    sqlQuery: string
  ): Promise<any> => {
    try {
      const response = await axiosInstance.post('/queries/execute', {
        queryId,
        sqlQuery,
      });
      return response;
    } catch (error) {
      console.error('Error in queryService.executeQuery:', error);
      throw error;
    }
  },

  // TODO: Add other query-related API functions here (e.g., executeQuery, saveQuery)
};

export default queryService;
