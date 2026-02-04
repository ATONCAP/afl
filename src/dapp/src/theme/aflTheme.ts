import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const aflColors = {
  primary: "#00D9FF",      // Electric cyan
  secondary: "#7C3AED",    // Deep purple
  accent: "#10B981",       // Neon green
  dark: "#0A0A0F",         // Background
  surface: "#1A1A24",      // Cards
  surfaceLight: "#2A2A34", // Lighter surface
  text: "#FFFFFF",
  textMuted: "#A0A0B0",
  border: "#3A3A44",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

export const aflTheme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: aflColors.dark,
        color: aflColors.text,
      },
    },
  },
  colors: {
    brand: {
      50: "#E6FCFF",
      100: "#B3F5FF",
      200: "#80EEFF",
      300: "#4DE7FF",
      400: "#1AE0FF",
      500: aflColors.primary,
      600: "#00AED9",
      700: "#0082A3",
      800: "#00576D",
      900: "#002B36",
    },
    purple: {
      50: "#F5F3FF",
      100: "#EDE9FE",
      200: "#DDD6FE",
      300: "#C4B5FD",
      400: "#A78BFA",
      500: aflColors.secondary,
      600: "#6D28D9",
      700: "#5B21B6",
      800: "#4C1D95",
      900: "#2E1065",
    },
    green: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      200: "#A7F3D0",
      300: "#6EE7B7",
      400: "#34D399",
      500: aflColors.accent,
      600: "#059669",
      700: "#047857",
      800: "#065F46",
      900: "#064E3B",
    },
    surface: {
      50: "#F7F7F8",
      100: "#EBEBED",
      200: "#D4D4D8",
      300: "#A1A1AA",
      400: "#71717A",
      500: aflColors.surfaceLight,
      600: aflColors.surface,
      700: "#15151D",
      800: "#10101A",
      900: aflColors.dark,
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "semibold",
        borderRadius: "lg",
      },
      variants: {
        primary: {
          bg: aflColors.primary,
          color: aflColors.dark,
          _hover: {
            bg: "#00C4E6",
            transform: "translateY(-2px)",
            boxShadow: `0 4px 20px ${aflColors.primary}40`,
          },
          _active: {
            bg: "#00AED9",
          },
        },
        secondary: {
          bg: aflColors.secondary,
          color: "white",
          _hover: {
            bg: "#6D28D9",
            transform: "translateY(-2px)",
            boxShadow: `0 4px 20px ${aflColors.secondary}40`,
          },
        },
        ghost: {
          color: aflColors.textMuted,
          _hover: {
            bg: aflColors.surface,
            color: aflColors.text,
          },
        },
        outline: {
          borderColor: aflColors.border,
          color: aflColors.text,
          _hover: {
            bg: aflColors.surface,
            borderColor: aflColors.primary,
          },
        },
      },
      defaultProps: {
        variant: "primary",
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: aflColors.surface,
          borderRadius: "xl",
          borderWidth: "1px",
          borderColor: aflColors.border,
        },
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: aflColors.surface,
            borderColor: aflColors.border,
            _hover: {
              bg: aflColors.surfaceLight,
            },
            _focus: {
              bg: aflColors.surfaceLight,
              borderColor: aflColors.primary,
            },
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Textarea: {
      variants: {
        filled: {
          bg: aflColors.surface,
          borderColor: aflColors.border,
          _hover: {
            bg: aflColors.surfaceLight,
          },
          _focus: {
            bg: aflColors.surfaceLight,
            borderColor: aflColors.primary,
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Heading: {
      baseStyle: {
        color: aflColors.text,
      },
    },
    Text: {
      baseStyle: {
        color: aflColors.text,
      },
    },
    Badge: {
      variants: {
        brand: {
          bg: `${aflColors.primary}20`,
          color: aflColors.primary,
        },
        agent: {
          bg: `${aflColors.accent}20`,
          color: aflColors.accent,
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tab: {
            color: aflColors.textMuted,
            _selected: {
              color: aflColors.primary,
              borderColor: aflColors.primary,
            },
          },
        },
      },
    },
  },
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
});

// Export themed versions for send/get method distinction
export const sendTheme = extendTheme(aflTheme, {
  colors: {
    brand: aflTheme.colors.brand,
  },
});

export const getTheme = extendTheme(aflTheme, {
  colors: {
    brand: aflTheme.colors.green,
  },
});

export default aflTheme;
