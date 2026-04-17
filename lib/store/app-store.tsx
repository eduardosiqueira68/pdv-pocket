import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
interface StoreInfo {
  name: string;
  currency: string;
}

interface AppState {
  isOnboarded: boolean;
  store: StoreInfo | null;
  isLoading: boolean;
}

type AppAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ONBOARDED"; payload: { store: StoreInfo } }
  | { type: "UPDATE_STORE"; payload: StoreInfo }
  | { type: "LOAD_STATE"; payload: { isOnboarded: boolean; store: StoreInfo | null } };

const initialState: AppState = {
  isOnboarded: false,
  store: null,
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ONBOARDED":
      return { ...state, isOnboarded: true, store: action.payload.store, isLoading: false };
    case "UPDATE_STORE":
      return { ...state, store: action.payload };
    case "LOAD_STATE":
      return {
        ...state,
        isOnboarded: action.payload.isOnboarded,
        store: action.payload.store,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  completeOnboarding: (storeName: string) => Promise<void>;
  updateStoreName: (name: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "@pdvpocket_store";

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        dispatch({
          type: "LOAD_STATE",
          payload: { isOnboarded: true, store: data },
        });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const completeOnboarding = useCallback(async (storeName: string) => {
    const store: StoreInfo = { name: storeName, currency: "BRL" };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    dispatch({ type: "SET_ONBOARDED", payload: { store } });
  }, []);

  const updateStoreName = useCallback(async (name: string) => {
    const store: StoreInfo = { name, currency: "BRL" };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    dispatch({ type: "UPDATE_STORE", payload: store });
  }, []);

  return (
    <AppContext.Provider value={{ state, completeOnboarding, updateStoreName }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
