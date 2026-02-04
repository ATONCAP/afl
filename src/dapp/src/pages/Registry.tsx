import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Icon,
  Flex,
  Card,
  CardBody,
  Skeleton,
  Select,
  Alert,
  AlertIcon,
  AlertDescription,
  Code,
  Spinner,
} from "@chakra-ui/react";
import { FaSearch, FaRobot, FaArrowLeft, FaPlus, FaFilter, FaExclamationTriangle } from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import { aflColors } from "../theme/aflTheme";
import AgentCard from "../components/AgentCard";
import { useAgentRegistry, AgentData } from "../hooks/useAgentRegistry";

const Registry: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const {
    isDeployed,
    registryAddress,
    network,
    registryData,
    agents,
    isLoadingRegistry,
    isLoadingAgents,
    registryError,
  } = useAgentRegistry();

  // Filter agents by search query
  const filteredAgents = agents.filter(
    (agent: AgentData) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.capabilities.some((cap) => cap.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    if (sortBy === "newest") {
      return (b.registeredAt?.getTime() ?? 0) - (a.registeredAt?.getTime() ?? 0);
    } else if (sortBy === "oldest") {
      return (a.registeredAt?.getTime() ?? 0) - (b.registeredAt?.getTime() ?? 0);
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const isLoading = isLoadingRegistry || isLoadingAgents;

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
              <Icon as={FaRobot} color={aflColors.primary} boxSize={5} />
              <Text fontWeight="bold" color={aflColors.text}>
                Agent Registry
              </Text>
            </HStack>
            <Button
              as={RouterLink}
              to="/register"
              size="sm"
              bg={aflColors.primary}
              color={aflColors.dark}
              leftIcon={<FaPlus />}
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: `0 4px 20px ${aflColors.primary}40`,
              }}
            >
              Register
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Contract not deployed warning */}
          {!isDeployed && (
            <Alert status="warning" bg={`${aflColors.warning}20`} borderRadius="lg">
              <AlertIcon color={aflColors.warning} />
              <Box flex={1}>
                <AlertDescription color={aflColors.text}>
                  <Text fontWeight="bold">Contract Not Deployed</Text>
                  <Text fontSize="sm">
                    The Agent Registry contract has not been deployed to {network} yet.
                    No agents can be registered or viewed until deployment.
                  </Text>
                  <Code mt={2} p={2} display="block" fontSize="xs" bg={aflColors.surface}>
                    yarn blueprint build && yarn blueprint deploy --{network}
                  </Code>
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Error display */}
          {registryError && (
            <Alert status="error" bg={`${aflColors.error}20`} borderRadius="lg">
              <AlertIcon color={aflColors.error} />
              <AlertDescription color={aflColors.text}>
                Error loading registry: {registryError instanceof Error ? registryError.message : "Unknown error"}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <SimpleGrid columns={[2, 4]} spacing={4}>
            <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
              <CardBody textAlign="center" py={4}>
                {isLoadingRegistry ? (
                  <Spinner size="sm" color={aflColors.primary} />
                ) : (
                  <Text fontSize="2xl" fontWeight="bold" color={aflColors.primary}>
                    {registryData?.totalAgents ?? 0}
                  </Text>
                )}
                <Text fontSize="sm" color={aflColors.textMuted}>
                  Total Agents
                </Text>
              </CardBody>
            </Card>
            <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
              <CardBody textAlign="center" py={4}>
                <Text fontSize="2xl" fontWeight="bold" color={aflColors.accent}>
                  {isDeployed ? (registryData?.totalAgents ?? 0) : "-"}
                </Text>
                <Text fontSize="sm" color={aflColors.textMuted}>
                  Active
                </Text>
              </CardBody>
            </Card>
            <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
              <CardBody textAlign="center" py={4}>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={isDeployed ? aflColors.accent : aflColors.textMuted}
                >
                  {isDeployed ? "Live" : "Offline"}
                </Text>
                <Text fontSize="sm" color={aflColors.textMuted}>
                  Status
                </Text>
              </CardBody>
            </Card>
            <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
              <CardBody textAlign="center" py={4}>
                <Text fontSize="2xl" fontWeight="bold" color={aflColors.secondary}>
                  {network}
                </Text>
                <Text fontSize="sm" color={aflColors.textMuted}>
                  Network
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Search and Filter - only show if deployed */}
          {isDeployed && (
            <Flex gap={4} direction={["column", "row"]}>
              <InputGroup flex={1}>
                <InputLeftElement>
                  <Icon as={FaSearch} color={aflColors.textMuted} />
                </InputLeftElement>
                <Input
                  placeholder="Search agents by name, description, or capability..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={aflColors.surface}
                  borderColor={aflColors.border}
                  _placeholder={{ color: aflColors.textMuted }}
                  _hover={{ borderColor: aflColors.primary }}
                  _focus={{ borderColor: aflColors.primary, boxShadow: `0 0 0 1px ${aflColors.primary}` }}
                />
              </InputGroup>
              <HStack>
                <Icon as={FaFilter} color={aflColors.textMuted} />
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  bg={aflColors.surface}
                  borderColor={aflColors.border}
                  w="150px"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                </Select>
              </HStack>
            </Flex>
          )}

          {/* Results */}
          {!isDeployed ? (
            // Not deployed state
            <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
              <CardBody py={12} textAlign="center">
                <VStack spacing={4}>
                  <Icon as={FaExclamationTriangle} boxSize={12} color={aflColors.warning} />
                  <Heading size="md" color={aflColors.text}>
                    Registry Not Deployed
                  </Heading>
                  <Text color={aflColors.textMuted} maxW="md">
                    The Agent Registry contract needs to be deployed before agents can register.
                    Once deployed, you'll be able to browse and register agents here.
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/admin"
                    variant="outline"
                    borderColor={aflColors.border}
                    color={aflColors.text}
                    _hover={{ bg: aflColors.surfaceLight }}
                  >
                    Go to Admin Panel
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ) : isLoading ? (
            // Loading state
            <SimpleGrid columns={[1, 2, 3]} spacing={6}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="200px" borderRadius="xl" startColor={aflColors.surface} endColor={aflColors.surfaceLight} />
              ))}
            </SimpleGrid>
          ) : sortedAgents.length === 0 ? (
            // Empty state
            <Card bg={aflColors.surface} borderColor={aflColors.border} borderWidth="1px">
              <CardBody py={12} textAlign="center">
                <VStack spacing={4}>
                  <Icon as={FaRobot} boxSize={12} color={aflColors.textMuted} />
                  <Heading size="md" color={aflColors.text}>
                    {searchQuery ? "No agents found" : "No agents registered yet"}
                  </Heading>
                  <Text color={aflColors.textMuted}>
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Be the first to register an agent!"}
                  </Text>
                  {!searchQuery && (
                    <Button
                      as={RouterLink}
                      to="/register"
                      bg={aflColors.primary}
                      color={aflColors.dark}
                      _hover={{
                        transform: "translateY(-2px)",
                      }}
                    >
                      Register Agent
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ) : (
            // Agents list
            <>
              <Text color={aflColors.textMuted} fontSize="sm">
                Showing {sortedAgents.length} agent{sortedAgents.length !== 1 ? "s" : ""}
              </Text>
              <SimpleGrid columns={[1, 2, 3]} spacing={6}>
                {sortedAgents.map((agent: AgentData) => (
                  <AgentCard key={agent.address} agent={agent} />
                ))}
              </SimpleGrid>
            </>
          )}

          {/* Registry address info */}
          {registryAddress && (
            <Box textAlign="center" pt={4}>
              <Text fontSize="xs" color={aflColors.textMuted}>
                Registry Contract: {registryAddress}
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Registry;
