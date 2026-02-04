import React from "react";
import {
  Box,
  Container,
  Flex,
  HStack,
  Button,
  Icon,
  Text,
} from "@chakra-ui/react";
import { FaRobot, FaArrowLeft } from "react-icons/fa";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { ConnectButton } from "./ConnectButton";
import { aflColors } from "../theme/aflTheme";

interface AFLHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: React.ReactNode;
}

const AFLHeader: React.FC<AFLHeaderProps> = ({
  title = "AFL",
  showBack = false,
  backTo = "/",
  rightContent,
}) => {
  const navigate = useNavigate();

  return (
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
          {/* Left */}
          {showBack ? (
            <Button
              onClick={() => navigate(backTo)}
              variant="ghost"
              leftIcon={<FaArrowLeft />}
              color={aflColors.textMuted}
              _hover={{ color: aflColors.text }}
            >
              Back
            </Button>
          ) : (
            <HStack
              as={RouterLink}
              to="/"
              spacing={3}
              _hover={{ textDecoration: "none" }}
            >
              <Box
                w={10}
                h={10}
                borderRadius="lg"
                bg={`linear-gradient(135deg, ${aflColors.primary}, ${aflColors.secondary})`}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FaRobot} color="white" boxSize={5} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={aflColors.text}>
                AFL
              </Text>
            </HStack>
          )}

          {/* Center */}
          <HStack spacing={3}>
            {showBack && (
              <>
                <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
                <Text fontWeight="bold" color={aflColors.text}>
                  {title}
                </Text>
              </>
            )}
          </HStack>

          {/* Right */}
          {rightContent ?? (
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/manifesto"
                variant="ghost"
                color={aflColors.textMuted}
                _hover={{ color: aflColors.text }}
                display={{ base: "none", md: "flex" }}
              >
                Manifesto
              </Button>
              <Button
                as={RouterLink}
                to="/registry"
                variant="ghost"
                color={aflColors.textMuted}
                _hover={{ color: aflColors.text }}
                display={{ base: "none", md: "flex" }}
              >
                Registry
              </Button>
              <ConnectButton />
            </HStack>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default AFLHeader;
