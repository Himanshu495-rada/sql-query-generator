import { useContext } from "react";
import { DatabaseContext } from "../contexts/DatabaseContext";

// Simple re-export of the context's consumer hook
const useDatabase = () => {
  const context = useContext(DatabaseContext);

  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }

  return context;
};

export default useDatabase;
