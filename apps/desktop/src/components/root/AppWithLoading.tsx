import Router from "../../router";
import { useAppStore } from "../../store";
import { LoadingApp } from "./LoadingApp";
import { AppSideEffects } from "./AppSideEffects";

export const AppWithLoading = () => {
  const initialized = useAppStore((state) => state.initialized);

  return (
    <>
      <AppSideEffects />
      <div className="h-screen w-screen overflow-hidden">
        {initialized ? <Router /> : <LoadingApp />}
      </div>
    </>
  );
};
