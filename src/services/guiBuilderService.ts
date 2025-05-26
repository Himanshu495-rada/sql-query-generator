import axiosInstance from "../utils/api";

export interface GuiBuilderExecutePayload {
  connectionId: string;
  sqlQuery: string;
}

export interface GuiBuilderExecuteResponse {
  success: boolean;
  data: {
    columns: string[];
    rows: Record<string, unknown>[];
    totalRows: number;
    executionTime: number;
  };
  message?: string;
}

const guiBuilderService = {
  executeQuery: async (
    payload: GuiBuilderExecutePayload
  ): Promise<GuiBuilderExecuteResponse> => {
    try {
      const response = await axiosInstance.post<GuiBuilderExecuteResponse>(
        "/gui-builder/execute",
        payload
      );
      return response;
    } catch (error) {
      console.error("Error in guiBuilderService.executeQuery:", error);
      throw error;
    }
  },
};

export default guiBuilderService;
