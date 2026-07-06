import { useContext } from "react";
import { AuthContext } from "@/lib/auth-context";

export function useAuth() {
  return useContext(AuthContext);
}
