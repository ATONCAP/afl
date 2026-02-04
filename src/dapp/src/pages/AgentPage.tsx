import React, { useEffect, useState } from "react";
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
  Badge,
  Card,
  CardBody,
  Avatar,
  SimpleGrid,
  Divider,
  Tooltip,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaRobot,
  FaCopy,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Link as RouterLink, useParams } from "react-router-dom";
import { aflColors } from "../theme/aflTheme";
import { useAgentRegistry, AgentData } from "../hooks/useAgentRegistry";
import { getNetwork } from "../config/contracts";

const AgentPage: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const toast = useToast();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchAgentData, isDeployed } = useAgentRegistry();
  const network = getNetwork();

  useEffect(() => {
    async function loadAgent() {
      if (!address) {
        setError("No agent address provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAgentData(address);
        if (data) {
          setAgent(data);
        } else {
          setError("Agent not found or contract not active");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent data");
      } finally {
        setIsLoading(false);
      }
    }

    loadAgent();
  }, [address, fetchAgentData]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getExplorerUrl = (addr: string) => {
    const base = network === "mainnet" ? "https://tonviewer.com" : "https://testnet.tonviewer.com";
    return `${base}/${addr}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Box minH="100vh" bg={aflColors.dark}>
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
                to="/registry"
                variant="ghost"
                leftIcon={<FaArrowLeft />}
                color={aflColors.textMuted}
                _hover={{ color: aflColors.text }}
              >
                Registry
              </Button>
              <HStack spacing={3}>
                <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
                <Text fontWeight="bold" color={aflColors.text}>
                  Agent Profile
                </Text>
              </HStack>
              <Box w="70px" />
            </Flex>
          </Container>
        </Box>
        <Container maxW="4xl" py={16}>
          <VStack spacing={4}>
            <Spinner size="xl" color={aflColors.primary} />
            <Text color={aflColors.textMuted}>Loading agent data...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  // Error state
  if (error || !agent) {
    return (
      <Box minH="100vh" bg={aflColors.dark}>
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
                to="/registry"
                variant="ghost"
                leftIcon={<FaArrowLeft />}
                color={aflColors.textMuted}
                _hover={{ color: aflColors.text }}
              >
                Registry
              </Button>
              <HStack spacing={3}>
                <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
                <Text fontWeight="bold" color={aflColors.text}>
                  Agent Profile
                </Text>
              </HStack>
              <Box w="70px" />
            </Flex>
          </Container>
        </Box>
        <Container maxW="4xl" py={8}>
          <Alert status="error" bg={`${aflColors.error}20`} borderRadius="lg">
            <AlertIcon color={aflColors.error} />
            <Box>
              <AlertDescription color={aflColors.text}>
                <Text fontWeight="bold">Failed to Load Agent</Text>
                <Text fontSize="sm">{error || "Agent not found"}</Text>
                {address && (
                  <Text fontSize="xs" mt={2} fontFamily="mono">
                    Address: {address}
                  </Text>
                )}
              </AlertDescription>
            </Box>
          </Alert>
          <VStack mt={8} spacing={4}>
            <Button
              as={RouterLink}
              to="/registry"
              variant="outline"
              borderColor={aflColors.border}
              color={aflColors.text}
            >
              Back to Registry
            </Button>
            {address && (
              <Button
                as="a"
                href={getExplorerUrl(address)}
                target="_blank"
                variant="ghost"
                color={aflColors.textMuted}
                rightIcon={<FaExternalLinkAlt />}
              >
                View on Explorer
              </Button>
            )}
          </VStack>
        </Container>
      </Box>
    );
  }

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
              to="/registry"
              variant="ghost"
              leftIcon={<FaArrowLeft />}
              color={aflColors.textMuted}
              _hover={{ color: aflColors.text }}
            >
              Registry
            </Button>
            <HStack spacing={3}>
              <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
              <Text fontWeight="bold" color={aflColors.text}>
                Agent Profile
              </Text>
            </HStack>
            <Box w="70px" />
          </Flex>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="4xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Profile Header */}
          <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
            <CardBody p={8}>
              <Flex direction={["column", "row"]} gap={6} align={["center", "start"]}>
                <Avatar
                  size="2xl"
                  icon={<Icon as={FaRobot} boxSize={12} />}
                  bg={`${aflColors.primary}30`}
                  color={aflColors.primary}
                  src={agent.avatarUrl || undefined}
                />
                <VStack align={["center", "start"]} spacing={3} flex={1}>
                  <HStack>
                    <Heading size="xl" color={aflColors.text}>
                      {agent.name}
                    </Heading>
                    {!agent.isRevoked ? (
                      <Tooltip label="Verified Agent Identity">
                        <Badge
                          bg={`${aflColors.accent}20`}
                          color={aflColors.accent}
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          <HStack spacing={1}>
                            <Icon as={FaCheckCircle} boxSize={3} />
                            <Text>Verified</Text>
                          </HStack>
                        </Badge>
                      </Tooltip>
                    ) : (
                      <Badge
                        bg={`${aflColors.error}20`}
                        color={aflColors.error}
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        <HStack spacing={1}>
                          <Icon as={FaExclamationTriangle} boxSize={3} />
                          <Text>Revoked</Text>
                        </HStack>
                      </Badge>
                    )}
                  </HStack>
                  <Text color={aflColors.textMuted}>Agent #{agent.agentIndex}</Text>
                  <Text color={aflColors.textMuted} textAlign={["center", "left"]}>
                    {agent.description}
                  </Text>
                </VStack>
              </Flex>
            </CardBody>
          </Card>

          {/* Capabilities */}
          <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
            <CardBody p={6}>
              <VStack align="start" spacing={4}>
                <HStack>
                  <Icon as={FaShieldAlt} color={aflColors.secondary} />
                  <Heading size="md" color={aflColors.text}>
                    Capabilities
                  </Heading>
                </HStack>
                {agent.capabilities.length > 0 ? (
                  <HStack flexWrap="wrap" spacing={2}>
                    {agent.capabilities.map((cap, i) => (
                      <Badge
                        key={i}
                        bg={`${aflColors.accent}20`}
                        color={aflColors.accent}
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {cap}
                      </Badge>
                    ))}
                  </HStack>
                ) : (
                  <Text color={aflColors.textMuted} fontStyle="italic">
                    No capabilities listed
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* On-chain Details */}
          <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
            <CardBody p={6}>
              <VStack align="start" spacing={4}>
                <Heading size="md" color={aflColors.text}>
                  On-chain Details
                </Heading>
                <Divider borderColor={aflColors.border} />

                <SimpleGrid columns={[1, 2]} spacing={4} w="full">
                  {/* Agent Address */}
                  <Box>
                    <Text fontSize="sm" color={aflColors.textMuted} mb={1}>
                      Agent SBT Address
                    </Text>
                    <HStack>
                      <Text color={aflColors.text} fontFamily="mono" fontSize="sm">
                        {truncateAddress(agent.address)}
                      </Text>
                      <Tooltip label="Copy address">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => copyToClipboard(agent.address, "Address")}
                        >
                          <Icon as={FaCopy} color={aflColors.textMuted} />
                        </Button>
                      </Tooltip>
                      <Tooltip label="View on explorer">
                        <Button
                          as="a"
                          href={getExplorerUrl(agent.address)}
                          target="_blank"
                          size="xs"
                          variant="ghost"
                        >
                          <Icon as={FaExternalLinkAlt} color={aflColors.textMuted} />
                        </Button>
                      </Tooltip>
                    </HStack>
                  </Box>

                  {/* Owner Address */}
                  <Box>
                    <Text fontSize="sm" color={aflColors.textMuted} mb={1}>
                      Owner Address
                    </Text>
                    <HStack>
                      <Text color={aflColors.text} fontFamily="mono" fontSize="sm">
                        {truncateAddress(agent.ownerAddress)}
                      </Text>
                      <Tooltip label="Copy address">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => copyToClipboard(agent.ownerAddress, "Owner address")}
                        >
                          <Icon as={FaCopy} color={aflColors.textMuted} />
                        </Button>
                      </Tooltip>
                    </HStack>
                  </Box>

                  {/* Network */}
                  <Box>
                    <Text fontSize="sm" color={aflColors.textMuted} mb={1}>
                      Network
                    </Text>
                    <Badge
                      bg={network === "mainnet" ? `${aflColors.error}20` : `${aflColors.accent}20`}
                      color={network === "mainnet" ? aflColors.error : aflColors.accent}
                    >
                      {network}
                    </Badge>
                  </Box>

                  {/* Status */}
                  <Box>
                    <Text fontSize="sm" color={aflColors.textMuted} mb={1}>
                      Status
                    </Text>
                    <Badge
                      bg={agent.isRevoked ? `${aflColors.error}20` : `${aflColors.accent}20`}
                      color={agent.isRevoked ? aflColors.error : aflColors.accent}
                      px={2}
                      py={1}
                    >
                      {agent.isRevoked ? "Revoked" : "Active"}
                    </Badge>
                  </Box>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Actions */}
          <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
            <CardBody p={6}>
              <HStack justify="center" spacing={4} flexWrap="wrap">
                <Button
                  variant="outline"
                  borderColor={aflColors.border}
                  color={aflColors.text}
                  _hover={{ bg: aflColors.surfaceLight }}
                  isDisabled={!isDeployed}
                >
                  Prove Ownership
                </Button>
                <Button
                  as="a"
                  href={getExplorerUrl(agent.address)}
                  target="_blank"
                  variant="outline"
                  borderColor={aflColors.border}
                  color={aflColors.text}
                  rightIcon={<FaExternalLinkAlt />}
                  _hover={{ bg: aflColors.surfaceLight }}
                >
                  View on Explorer
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default AgentPage;
