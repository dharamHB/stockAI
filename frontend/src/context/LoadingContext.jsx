import React, { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
      {isLoading && <Loader />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Animated Rings */}
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>

        {/* Glowing Dot */}
        <div className="absolute top-[26px] w-3 h-3 bg-primary-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)] animate-pulse"></div>

        <p className="mt-4 text-sm font-medium text-gray-700 tracking-wide animate-pulse">
          Processing...
        </p>
      </div>
    </div>
  );
};
