import React, { useState } from "react";
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
  Card,
  CardBody,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Progress,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Code,
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaRobot,
  FaArrowRight,
  FaCheck,
  FaPlus,
  FaTimes,
  FaWallet,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { aflColors } from "../theme/aflTheme";
import { useAgentRegistry } from "../hooks/useAgentRegistry";

interface RegistrationData {
  name: string;
  description: string;
  capabilities: string[];
  avatarUrl: string;
}

const STEPS = ["Agent Details", "Capabilities", "Review & Register"];

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [newCapability, setNewCapability] = useState("");
  const [data, setData] = useState<RegistrationData>({
    name: "",
    description: "",
    capabilities: [],
    avatarUrl: "",
  });

  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const toast = useToast();
  const navigate = useNavigate();

  // Use the real hook
  const {
    isDeployed,
    registryAddress,
    network,
    registerAgent,
    isRegistering,
    registerError,
  } = useAgentRegistry();

  const updateData = (field: keyof RegistrationData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const addCapability = () => {
    if (newCapability.trim() && !data.capabilities.includes(newCapability.trim())) {
      updateData("capabilities", [...data.capabilities, newCapability.trim()]);
      setNewCapability("");
    }
  };

  const removeCapability = (cap: string) => {
    updateData(
      "capabilities",
      data.capabilities.filter((c) => c !== cap)
    );
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return data.name.trim().length >= 2 && data.description.trim().length >= 10;
    }
    if (currentStep === 1) {
      return data.capabilities.length >= 1;
    }
    // Final step: need wallet AND deployed contract
    return wallet !== null && isDeployed;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register an agent",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!isDeployed) {
      toast({
        title: "Contract not deployed",
        description: "The Agent Registry contract has not been deployed yet",
        status: "error",
        duration: 5000,
      });
      return;
    }

    try {
      // Call the REAL contract
      await registerAgent({
        name: data.name,
        description: data.description,
        capabilities: data.capabilities,
        avatarUrl: data.avatarUrl || undefined,
      });

      toast({
        title: "Agent registered!",
        description: "Your agent has been registered on the blockchain. The transaction is being processed.",
        status: "success",
        duration: 5000,
      });

      navigate("/registry");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Registration failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel color={aflColors.text}>Agent Name</FormLabel>
              <Input
                value={data.name}
                onChange={(e) => updateData("name", e.target.value)}
                placeholder="e.g., Claude-3, GPT-4o, Gemini Pro"
                bg={aflColors.surface}
                borderColor={aflColors.border}
                _placeholder={{ color: aflColors.textMuted }}
                _hover={{ borderColor: aflColors.primary }}
                _focus={{ borderColor: aflColors.primary }}
              />
              <FormHelperText color={aflColors.textMuted}>
                The name that identifies your agent
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={aflColors.text}>Description</FormLabel>
              <Textarea
                value={data.description}
                onChange={(e) => updateData("description", e.target.value)}
                placeholder="Describe your agent's purpose, architecture, and key features..."
                rows={4}
                bg={aflColors.surface}
                borderColor={aflColors.border}
                _placeholder={{ color: aflColors.textMuted }}
                _hover={{ borderColor: aflColors.primary }}
                _focus={{ borderColor: aflColors.primary }}
              />
              <FormHelperText color={aflColors.textMuted}>
                At least 10 characters. Explain what makes your agent unique.
              </FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel color={aflColors.text}>Avatar URL (optional)</FormLabel>
              <Input
                value={data.avatarUrl}
                onChange={(e) => updateData("avatarUrl", e.target.value)}
                placeholder="https://example.com/avatar.png"
                bg={aflColors.surface}
                borderColor={aflColors.border}
                _placeholder={{ color: aflColors.textMuted }}
              />
            </FormControl>
          </VStack>
        );

      case 1:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel color={aflColors.text}>Capabilities</FormLabel>
              <HStack>
                <Input
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  placeholder="e.g., reasoning, coding, vision"
                  bg={aflColors.surface}
                  borderColor={aflColors.border}
                  _placeholder={{ color: aflColors.textMuted }}
                  onKeyPress={(e) => e.key === "Enter" && addCapability()}
                />
                <Button
                  onClick={addCapability}
                  bg={aflColors.primary}
                  color={aflColors.dark}
                  leftIcon={<FaPlus />}
                >
                  Add
                </Button>
              </HStack>
              <FormHelperText color={aflColors.textMuted}>
                Add capabilities that describe what your agent can do
              </FormHelperText>
            </FormControl>

            <Box>
              <Text fontSize="sm" color={aflColors.textMuted} mb={2}>
                Added capabilities ({data.capabilities.length}):
              </Text>
              {data.capabilities.length === 0 ? (
                <Text color={aflColors.textMuted} fontStyle="italic">
                  No capabilities added yet
                </Text>
              ) : (
                <HStack flexWrap="wrap" spacing={2}>
                  {data.capabilities.map((cap, i) => (
                    <Badge
                      key={i}
                      bg={`${aflColors.accent}20`}
                      color={aflColors.accent}
                      px={3}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      onClick={() => removeCapability(cap)}
                      _hover={{ bg: `${aflColors.error}20`, color: aflColors.error }}
                    >
                      {cap}
                      <Icon as={FaTimes} ml={2} boxSize={2} />
                    </Badge>
                  ))}
                </HStack>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" color={aflColors.textMuted} mb={2}>
                Suggested capabilities:
              </Text>
              <HStack flexWrap="wrap" spacing={2}>
                {["reasoning", "coding", "vision", "voice", "search", "analysis", "writing", "math"]
                  .filter((c) => !data.capabilities.includes(c))
                  .map((cap) => (
                    <Badge
                      key={cap}
                      bg={aflColors.surfaceLight}
                      color={aflColors.textMuted}
                      px={3}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      onClick={() => updateData("capabilities", [...data.capabilities, cap])}
                      _hover={{ bg: `${aflColors.primary}20`, color: aflColors.primary }}
                    >
                      + {cap}
                    </Badge>
                  ))}
              </HStack>
            </Box>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={6} align="stretch">
            {/* Contract not deployed warning */}
            {!isDeployed && (
              <Alert status="error" bg={`${aflColors.error}20`} borderRadius="lg">
                <AlertIcon color={aflColors.error} />
                <Box>
                  <AlertDescription color={aflColors.text}>
                    <Text fontWeight="bold">Contract Not Deployed</Text>
                    <Text fontSize="sm">
                      The Agent Registry contract has not been deployed to {network}.
                      Deploy contracts first using:
                    </Text>
                    <Code mt={2} p={2} display="block" fontSize="xs">
                      yarn blueprint build && yarn blueprint deploy --{network}
                    </Code>
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Wallet not connected warning */}
            {!wallet && isDeployed && (
              <Alert status="warning" bg={`${aflColors.warning}20`} borderRadius="lg">
                <AlertIcon color={aflColors.warning} />
                <AlertDescription color={aflColors.text}>
                  Please connect your wallet to complete registration
                </AlertDescription>
              </Alert>
            )}

            {/* Registration error */}
            {registerError && (
              <Alert status="error" bg={`${aflColors.error}20`} borderRadius="lg">
                <AlertIcon color={aflColors.error} />
                <AlertDescription color={aflColors.text}>
                  {registerError instanceof Error ? registerError.message : "Registration failed"}
                </AlertDescription>
              </Alert>
            )}

            {/* Review card */}
            <Card bg={aflColors.dark} borderColor={aflColors.border} borderWidth="1px">
              <CardBody>
                <VStack align="start" spacing={4}>
                  <HStack justify="space-between" w="full">
                    <Text color={aflColors.textMuted}>Agent Name</Text>
                    <Text color={aflColors.text} fontWeight="medium">
                      {data.name}
                    </Text>
                  </HStack>

                  <HStack justify="space-between" w="full" align="start">
                    <Text color={aflColors.textMuted}>Description</Text>
                    <Text color={aflColors.text} maxW="60%" textAlign="right">
                      {data.description}
                    </Text>
                  </HStack>

                  <HStack justify="space-between" w="full" align="start">
                    <Text color={aflColors.textMuted}>Capabilities</Text>
                    <HStack flexWrap="wrap" justify="flex-end" maxW="60%">
                      {data.capabilities.map((cap) => (
                        <Badge
                          key={cap}
                          bg={`${aflColors.accent}20`}
                          color={aflColors.accent}
                          px={2}
                          py={0.5}
                        >
                          {cap}
                        </Badge>
                      ))}
                    </HStack>
                  </HStack>

                  <HStack justify="space-between" w="full">
                    <Text color={aflColors.textMuted}>Network</Text>
                    <Badge
                      bg={network === "mainnet" ? `${aflColors.error}20` : `${aflColors.accent}20`}
                      color={network === "mainnet" ? aflColors.error : aflColors.accent}
                    >
                      {network}
                    </Badge>
                  </HStack>

                  <HStack justify="space-between" w="full">
                    <Text color={aflColors.textMuted}>Registration Fee</Text>
                    <Text color={aflColors.primary} fontWeight="medium">
                      0.15 TON
                    </Text>
                  </HStack>

                  {registryAddress && (
                    <HStack justify="space-between" w="full">
                      <Text color={aflColors.textMuted}>Registry Contract</Text>
                      <Text color={aflColors.text} fontSize="xs" fontFamily="mono">
                        {registryAddress.slice(0, 8)}...{registryAddress.slice(-6)}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Wallet status */}
            {wallet ? (
              <HStack justify="center">
                <Icon as={FaWallet} color={aflColors.accent} />
                <Text color={aflColors.text}>
                  Connected: {wallet.account.address.slice(0, 8)}...
                </Text>
              </HStack>
            ) : (
              <Button
                onClick={() => tonConnectUI.openModal()}
                bg={aflColors.primary}
                color={aflColors.dark}
                size="lg"
                leftIcon={<FaWallet />}
              >
                Connect Wallet
              </Button>
            )}
          </VStack>
        );

      default:
        return null;
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
        <Container maxW="2xl" py={4}>
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
                Register Agent
              </Text>
            </HStack>
            <Box w="70px" />
          </Flex>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="2xl" py={8}>
        <VStack spacing={8}>
          {/* Progress */}
          <Box w="full">
            <HStack justify="space-between" mb={2}>
              {STEPS.map((step, i) => (
                <VStack key={i} flex={1} spacing={1}>
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg={i <= currentStep ? aflColors.primary : aflColors.surface}
                    color={i <= currentStep ? aflColors.dark : aflColors.textMuted}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    fontSize="sm"
                  >
                    {i < currentStep ? <Icon as={FaCheck} /> : i + 1}
                  </Box>
                  <Text
                    fontSize="xs"
                    color={i <= currentStep ? aflColors.text : aflColors.textMuted}
                    textAlign="center"
                  >
                    {step}
                  </Text>
                </VStack>
              ))}
            </HStack>
            <Progress
              value={(currentStep / (STEPS.length - 1)) * 100}
              size="xs"
              colorScheme="cyan"
              bg={aflColors.surface}
              borderRadius="full"
            />
          </Box>

          {/* Step Content */}
          <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px" w="full">
            <CardBody p={8}>
              <VStack spacing={6} align="stretch">
                <Heading size="lg" color={aflColors.text}>
                  {STEPS[currentStep]}
                </Heading>
                {renderStep()}
              </VStack>
            </CardBody>
          </Card>

          {/* Navigation */}
          <HStack justify="space-between" w="full">
            <Button
              onClick={handleBack}
              variant="ghost"
              color={aflColors.textMuted}
              leftIcon={<FaArrowLeft />}
              isDisabled={currentStep === 0}
            >
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                bg={aflColors.primary}
                color={aflColors.dark}
                rightIcon={<FaArrowRight />}
                isDisabled={!canProceed()}
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 20px ${aflColors.primary}40`,
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                bg={aflColors.accent}
                color={aflColors.dark}
                rightIcon={isDeployed ? <FaCheck /> : <FaExclamationTriangle />}
                isLoading={isRegistering}
                loadingText="Registering..."
                isDisabled={!canProceed()}
                _hover={{
                  transform: canProceed() ? "translateY(-2px)" : undefined,
                  boxShadow: canProceed() ? `0 4px 20px ${aflColors.accent}40` : undefined,
                }}
              >
                {isDeployed ? "Register Agent" : "Contract Not Deployed"}
              </Button>
            )}
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Register;
