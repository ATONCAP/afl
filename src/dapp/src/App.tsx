import { Box, ChakraProvider } from "@chakra-ui/react";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { THEME, useTonConnectUI } from "@tonconnect/ui-react";
import { aflTheme, aflColors } from "./theme/aflTheme";

// Pages
import AFLLanding from "./components/AFLLanding";
import Manifesto from "./pages/Manifesto";
import Registry from "./pages/Registry";
import AgentPage from "./pages/AgentPage";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  const [tcUI, setTcUIOptions] = useTonConnectUI();

  React.useEffect(() => {
    tcUI.connector.restoreConnection();
    setTcUIOptions({
      uiPreferences: {
        theme: THEME.DARK,
        borderRadius: "m",
        colorsSet: {
          [THEME.DARK]: {
            accent: aflColors.primary,
            background: {
              primary: aflColors.dark,
              secondary: aflColors.surface,
              segment: aflColors.surfaceLight,
            },
            text: {
              primary: aflColors.text,
              secondary: aflColors.textMuted,
            },
          },
        },
      },
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<AFLLanding />} />
      <Route path="/manifesto" element={<Manifesto />} />
      <Route path="/registry" element={<Registry />} />
      <Route path="/agent/:address" element={<AgentPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/*" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={aflTheme}>
        <BrowserRouter>
          <Box minH="100vh" bg={aflColors.dark}>
            <AppContent />
          </Box>
        </BrowserRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
