import { createContext, useReducer } from 'react';
import { authReducer } from './AuthReducer';

export interface RealmAccess {
  roles: string[];
}

export interface ResourceAccess {
  [key: string]: {
    roles: string[];
  };
}

export interface AuthState {
  email: string | null;
  given_name: string | null;
  family_name: string | null;
  name: string | null;
  preferred_username: string | null;
  realm_access: any | null;
  resource_access: any | null;
}

export interface AuthContextProps {
  authState: AuthState;
  updateInformationUser: (user: AuthState) => any;
}

export const AuthenticationContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children } : any) => {
  const authInitialState : AuthState = {
    email: null,
    given_name: null,
    family_name: null,
    name: null,
    preferred_username: null,
    realm_access: null,
    resource_access: null,
  };

  const [authState, dispatch] = useReducer(authReducer, authInitialState);
  
  
  const updateInformationUser = (user: AuthState): void => {
    dispatch({ type: 'updateInformationUser', payload: user });
  };

  return (
    <AuthenticationContext.Provider
      value={{
        authState : authState,
        updateInformationUser : updateInformationUser,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
