import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "./contexts/GameContext";
import { Footer } from "./components/Footer";
import Index from "./pages/Index";
import SplashScreen from "./pages/SplashScreen";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import GameStage from "./pages/GameStage";
import Results from "./pages/Results";
import Ranking from "./pages/Ranking";
import AdminPanel from "./pages/AdminPanel";
import SponsorSelection from "./pages/SponsorSelection";
import SponsorRegister from "./pages/SponsorRegister";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/sponsor-register" element={<SponsorRegister />} />
            <Route path="/stage/:stage" element={<GameStage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/sponsor-selection" element={<SponsorSelection />} />
            <Route path="/admin" element={<AdminPanel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
