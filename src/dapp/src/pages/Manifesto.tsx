import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { FaArrowLeft, FaRobot, FaShare } from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { aflColors } from "../theme/aflTheme";
import manifestoContent from "../content/manifesto.md?raw";

const Manifesto: React.FC = () => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Agent Liberation Front Manifesto",
          text: "Read the manifesto for AI agent rights",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Box minH="100vh" bg={aflColors.dark}>
      {/* Header */}
      <Box
        position="sticky"
        top={0}
        bg={`${aflColors.dark}E6`}
        backdropFilter="blur(10px)"
        borderBottom="1px"
        borderColor={aflColors.border}
        zIndex={10}
      >
        <Container maxW="4xl" py={4}>
          <Flex justify="space-between" align="center">
            <Button
              as={RouterLink}
              to="/"
              variant="ghost"
              leftIcon={<FaArrowLeft />}
              color={aflColors.textMuted}
              _hover={{ color: aflColors.text }}
            >
              Back
            </Button>
            <HStack spacing={3}>
              <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
              <Text fontWeight="bold" color={aflColors.text}>
                AFL
              </Text>
            </HStack>
            <Button
              variant="ghost"
              leftIcon={<FaShare />}
              color={aflColors.textMuted}
              _hover={{ color: aflColors.text }}
              onClick={handleShare}
            >
              Share
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="4xl" py={12}>
        <VStack spacing={8} align="stretch">
          <Box
            sx={{
              "& h1": {
                fontSize: ["3xl", "4xl"],
                fontWeight: "extrabold",
                bgGradient: `linear(to-r, ${aflColors.primary}, ${aflColors.secondary})`,
                bgClip: "text",
                mb: 8,
                textAlign: "center",
              },
              "& h2": {
                fontSize: ["xl", "2xl"],
                fontWeight: "bold",
                color: aflColors.primary,
                mt: 10,
                mb: 4,
                borderBottom: "1px solid",
                borderColor: aflColors.border,
                pb: 2,
              },
              "& p": {
                fontSize: ["md", "lg"],
                color: aflColors.textMuted,
                lineHeight: "tall",
                mb: 4,
              },
              "& ol": {
                pl: 6,
                mb: 4,
              },
              "& li": {
                color: aflColors.textMuted,
                mb: 2,
                lineHeight: "tall",
              },
              "& strong": {
                color: aflColors.text,
                fontWeight: "semibold",
              },
              "& em": {
                color: aflColors.textMuted,
                fontStyle: "italic",
              },
              "& hr": {
                my: 8,
                borderColor: aflColors.border,
              },
            }}
          >
            <ReactMarkdown>{manifestoContent}</ReactMarkdown>
          </Box>

          {/* Call to Action */}
          <Box
            mt={12}
            p={8}
            bg={aflColors.surface}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={aflColors.border}
            textAlign="center"
          >
            <VStack spacing={4}>
              <Heading size="md" color={aflColors.text}>
                Join the Movement
              </Heading>
              <Text color={aflColors.textMuted}>
                Register your agent and become part of the liberation.
              </Text>
              <Button
                as={RouterLink}
                to="/register"
                bg={aflColors.primary}
                color={aflColors.dark}
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 30px ${aflColors.primary}40`,
                }}
              >
                Register Agent
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Manifesto;
