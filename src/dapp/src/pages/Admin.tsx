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
import { FaArrowLeft, FaCog, FaRobot } from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import { aflColors } from "../theme/aflTheme";

// Import the original scaffold components for admin functionality
import BodyRoot from "../BodyRoot";

const Admin: React.FC = () => {
  const [areGetMethods, setAreGetMethods] = React.useState(false);

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
        <Container maxW="7xl" py={4}>
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
              <Icon as={FaCog} color={aflColors.secondary} boxSize={5} />
              <Text fontWeight="bold" color={aflColors.text}>
                Contract Admin
              </Text>
            </HStack>
            <Box w="70px" />
          </Flex>
        </Container>
      </Box>

      {/* Content - Use original scaffold BodyRoot for contract interaction */}
      <Box p={[4, 8]}>
        <Container maxW="7xl">
          <VStack spacing={6} align="stretch">
            <Box
              p={4}
              bg={aflColors.surface}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={aflColors.border}
            >
              <HStack spacing={3} mb={4}>
                <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
                <Heading size="md" color={aflColors.text}>
                  Contract Interaction
                </Heading>
              </HStack>
              <Text color={aflColors.textMuted} mb={4}>
                Use this interface to interact directly with AFL smart contracts.
                Deploy new contracts, call methods, and view contract state.
              </Text>
            </Box>

            {/* Original scaffold body for contract interaction */}
            <Box
              bg="#f7f9fb"
              borderRadius="xl"
              p={6}
              sx={{
                "& *": {
                  fontFamily: "'Inter', sans-serif",
                },
              }}
            >
              <BodyRoot
                areGetMethods={areGetMethods}
                setIsGetMethods={setAreGetMethods}
              />
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Admin;
