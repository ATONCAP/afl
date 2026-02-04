import React from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Avatar,
} from "@chakra-ui/react";
import { FaRobot, FaExternalLinkAlt } from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import { aflColors } from "../theme/aflTheme";
import type { AgentData } from "../hooks/useAgentRegistry";

interface AgentCardProps {
  agent: AgentData;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const truncateAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card
      as={RouterLink}
      to={`/agent/${agent.address}`}
      bg={aflColors.surface}
      borderWidth="1px"
      borderColor={aflColors.border}
      _hover={{
        borderColor: aflColors.primary,
        transform: "translateY(-4px)",
        textDecoration: "none",
      }}
      transition="all 0.3s"
      cursor="pointer"
    >
      <CardBody p={6}>
        <VStack align="start" spacing={4}>
          {/* Header */}
          <HStack spacing={3} w="full">
            <Avatar
              size="md"
              icon={<Icon as={FaRobot} boxSize={5} />}
              bg={`${aflColors.primary}30`}
              color={aflColors.primary}
              src={agent.avatarUrl || undefined}
            />
            <Box flex={1}>
              <HStack justify="space-between">
                <Heading size="sm" color={aflColors.text} noOfLines={1}>
                  {agent.name}
                </Heading>
                <Icon as={FaExternalLinkAlt} boxSize={3} color={aflColors.textMuted} />
              </HStack>
              <Text fontSize="xs" color={aflColors.textMuted}>
                #{agent.agentIndex}
              </Text>
            </Box>
          </HStack>

          {/* Description */}
          <Text fontSize="sm" color={aflColors.textMuted} noOfLines={2}>
            {agent.description}
          </Text>

          {/* Capabilities */}
          <HStack flexWrap="wrap" spacing={2}>
            {agent.capabilities.slice(0, 3).map((cap, i) => (
              <Badge
                key={i}
                bg={`${aflColors.accent}20`}
                color={aflColors.accent}
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
              >
                {cap}
              </Badge>
            ))}
            {agent.capabilities.length > 3 && (
              <Badge
                bg={aflColors.surfaceLight}
                color={aflColors.textMuted}
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
              >
                +{agent.capabilities.length - 3}
              </Badge>
            )}
          </HStack>

          {/* Footer */}
          <HStack justify="space-between" w="full" pt={2} borderTop="1px" borderColor={aflColors.border}>
            <Text fontSize="xs" color={aflColors.textMuted}>
              Owner: {truncateAddress(agent.ownerAddress)}
            </Text>
            {agent.registeredAt && (
              <Text fontSize="xs" color={aflColors.textMuted}>
                {agent.registeredAt.toLocaleDateString()}
              </Text>
            )}
          </HStack>

          {/* Revoked badge */}
          {agent.isRevoked && (
            <Badge
              bg={`${aflColors.error}20`}
              color={aflColors.error}
              fontSize="xs"
              px={2}
              py={0.5}
            >
              Revoked
            </Badge>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AgentCard;
