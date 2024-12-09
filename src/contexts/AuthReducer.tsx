import { AuthState } from "./AuthContext ";


type AuthAction =
  | { type: "updateInformationUser"; payload: AuthState }; // Define payload type more specifically

export const authReducer = (
  state: AuthState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case "updateInformationUser":
      return {
        ...state,
        ...action.payload, 
      };

    default:
      return state;
  }
};
