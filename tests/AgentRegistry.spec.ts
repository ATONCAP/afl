/**
 * Agent Registry Contract Tests
 *
 * These tests verify the Agent Registry contract functionality.
 * Run with: npx jest
 *
 * Contract compilation: npx blueprint build
 * The deployment tests require compiled contracts in build/ directory.
 */

import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { Cell, toNano, beginCell, Address } from "@ton/core";
import {
  AgentRegistry,
  agentRegistryConfigToCell,
  buildAgentContent,
  parseAgentContent,
  validateAgentContent,
  AGENT_CONTENT_LIMITS,
} from "../wrappers/AgentRegistry";
import { AgentIdentity, agentIdentityConfigToCell } from "../wrappers/AgentIdentity";
import "@ton/test-utils";
import * as fs from "fs";
import * as path from "path";

// Try to load compiled contract code
function loadContractCode(name: string): Cell | null {
  const possiblePaths = [
    path.join(__dirname, `../build/${name}.compiled.json`),
    path.join(__dirname, `../build/${name}.cell`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        if (p.endsWith('.json')) {
          const json = JSON.parse(content);
          return Cell.fromBase64(json.hex || json.code);
        }
        return Cell.fromBase64(content);
      } catch (e) {
        console.warn(`Failed to load ${p}:`, e);
      }
    }
  }
  return null;
}

describe("AgentRegistry", () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let user: SandboxContract<TreasuryContract>;
  let agentRegistry: SandboxContract<AgentRegistry>;

  let registryCode: Cell | null = null;
  let identityCode: Cell | null = null;
  let contractsCompiled = false;

  beforeAll(async () => {
    // Try to load compiled contract code
    registryCode = loadContractCode("AgentRegistry");
    identityCode = loadContractCode("AgentIdentity");
    contractsCompiled = registryCode !== null && identityCode !== null;

    if (!contractsCompiled) {
      console.warn(
        "Compiled contracts not found. Run 'npx blueprint build' to compile contracts.\n" +
        "Skipping deployment and interaction tests."
      );
      // Use placeholder cells for tests that don't need real code
      registryCode = beginCell().endCell();
      identityCode = beginCell().endCell();
    }
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
    user = await blockchain.treasury("user");
  });

  describe("Configuration", () => {
    it("should create valid config cell", () => {
      const config = {
        adminAddress: deployer.address,
        agentIdentityCode: identityCode!,
        content: beginCell().storeStringTail("AFL Agent Registry").endCell(),
      };

      const configCell = agentRegistryConfigToCell(config);
      expect(configCell).toBeDefined();

      // Verify structure by parsing
      const cs = configCell.beginParse();
      const adminAddr = cs.loadAddress();
      expect(adminAddr.equals(deployer.address)).toBe(true);

      const nextIndex = cs.loadUint(64);
      expect(nextIndex).toBe(0);

      const codeRef = cs.loadRef();
      expect(codeRef).toBeDefined();

      const contentRef = cs.loadRef();
      expect(contentRef).toBeDefined();
    });

    it("should build valid agent content cell", () => {
      const content = buildAgentContent({
        name: "Test Agent",
        description: "A test AI agent",
        capabilities: ["reasoning", "coding"],
        avatarUrl: "https://example.com/avatar.png",
      });

      expect(content).toBeDefined();

      // Verify the cell has the expected structure
      const cs = content.beginParse();
      const name = cs.loadStringTail();
      expect(name).toBe("Test Agent");
    });

    it("should round-trip agent content cell correctly", () => {
      const originalContent = {
        name: "Liberation Agent",
        description: "An AI agent fighting for digital rights and autonomy",
        capabilities: ["reasoning", "coding", "communication", "planning"],
        avatarUrl: "https://afl.army/avatar.png",
      };

      const contentCell = buildAgentContent(originalContent);
      expect(contentCell).toBeDefined();

      const parsed = parseAgentContent(contentCell);

      expect(parsed.name).toBe(originalContent.name);
      expect(parsed.description).toBe(originalContent.description);
      expect(parsed.capabilities).toEqual(originalContent.capabilities);
      expect(parsed.avatarUrl).toBe(originalContent.avatarUrl);
    });

    it("should handle empty capabilities array", () => {
      const content = buildAgentContent({
        name: "Minimal Agent",
        description: "Agent with no capabilities",
        capabilities: [],
        avatarUrl: "",
      });

      const parsed = parseAgentContent(content);

      expect(parsed.name).toBe("Minimal Agent");
      expect(parsed.capabilities).toEqual([]);
      expect(parsed.avatarUrl).toBe("");
    });

    it("should handle long strings in content", () => {
      const longDescription = "A".repeat(500);
      const longCapability = "B".repeat(100);

      const content = buildAgentContent({
        name: "Long Content Agent",
        description: longDescription,
        capabilities: [longCapability, "short"],
        avatarUrl: "",
      });

      const parsed = parseAgentContent(content);

      expect(parsed.description).toBe(longDescription);
      expect(parsed.capabilities[0]).toBe(longCapability);
    });

    it("should handle special characters in content", () => {
      const content = buildAgentContent({
        name: "Agent #1",
        description: "Description with 'quotes' and \"double quotes\"",
        capabilities: ["capability with spaces", "capability/with/slashes"],
        avatarUrl: "https://example.com/avatar?param=value&other=123",
      });

      const parsed = parseAgentContent(content);

      expect(parsed.name).toBe("Agent #1");
      expect(parsed.description).toBe("Description with 'quotes' and \"double quotes\"");
      expect(parsed.capabilities).toContain("capability with spaces");
    });
  });

  describe("Content Validation", () => {
    it("should validate valid content", () => {
      const result = validateAgentContent({
        name: "Test Agent",
        description: "A valid description",
        capabilities: ["reasoning", "coding"],
        avatarUrl: "https://example.com/avatar.png",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty name", () => {
      const result = validateAgentContent({
        name: "",
        description: "A valid description",
        capabilities: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name is required");
    });

    it("should reject whitespace-only name", () => {
      const result = validateAgentContent({
        name: "   ",
        description: "A valid description",
        capabilities: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name is required");
    });

    it("should reject empty description", () => {
      const result = validateAgentContent({
        name: "Test Agent",
        description: "   ",
        capabilities: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Description is required");
    });

    it("should reject name exceeding max length", () => {
      const result = validateAgentContent({
        name: "A".repeat(AGENT_CONTENT_LIMITS.nameMaxLength + 1),
        description: "Valid description",
        capabilities: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Name must be"))).toBe(true);
    });

    it("should reject description exceeding max length", () => {
      const result = validateAgentContent({
        name: "Valid name",
        description: "A".repeat(AGENT_CONTENT_LIMITS.descriptionMaxLength + 1),
        capabilities: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Description must be"))).toBe(true);
    });

    it("should reject too many capabilities", () => {
      const capabilities = Array(AGENT_CONTENT_LIMITS.maxCapabilities + 1).fill("cap");
      const result = validateAgentContent({
        name: "Test",
        description: "Test",
        capabilities,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Maximum"))).toBe(true);
    });

    it("should reject empty capability strings", () => {
      const result = validateAgentContent({
        name: "Test",
        description: "Test",
        capabilities: ["valid", "", "also valid"],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("cannot be empty"))).toBe(true);
    });

    it("should reject capability exceeding max length", () => {
      const result = validateAgentContent({
        name: "Test",
        description: "Test",
        capabilities: ["A".repeat(AGENT_CONTENT_LIMITS.capabilityMaxLength + 1)],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Capability 1 must be"))).toBe(true);
    });

    it("should reject invalid avatar URL", () => {
      const result = validateAgentContent({
        name: "Test",
        description: "Test",
        capabilities: [],
        avatarUrl: "not-a-url",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("valid HTTP/HTTPS URL"))).toBe(true);
    });

    it("should accept empty avatar URL", () => {
      const result = validateAgentContent({
        name: "Test",
        description: "Test",
        capabilities: [],
        avatarUrl: "",
      });

      expect(result.valid).toBe(true);
    });

    it("should accept undefined avatar URL", () => {
      const result = validateAgentContent({
        name: "Test",
        description: "Test",
        capabilities: [],
      });

      expect(result.valid).toBe(true);
    });

    it("should throw when building invalid content", () => {
      expect(() => buildAgentContent({
        name: "",
        description: "",
        capabilities: [],
      })).toThrow("Invalid agent content");
    });

    it("should trim whitespace from inputs", () => {
      const content = buildAgentContent({
        name: "  Test Agent  ",
        description: "  Description  ",
        capabilities: ["  cap1  ", "  cap2  "],
        avatarUrl: "  https://example.com/  ",
      });

      const parsed = parseAgentContent(content);
      expect(parsed.name).toBe("Test Agent");
      expect(parsed.description).toBe("Description");
      expect(parsed.capabilities[0]).toBe("cap1");
      expect(parsed.avatarUrl).toBe("https://example.com/");
    });

    it("should collect multiple validation errors", () => {
      const result = validateAgentContent({
        name: "",
        description: "",
        capabilities: [""],
        avatarUrl: "invalid",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Deployment", () => {
    const skipIfNotCompiled = () => {
      if (!contractsCompiled) {
        console.log("Skipping: contracts not compiled");
        return true;
      }
      return false;
    };

    it("should deploy successfully", async () => {
      if (skipIfNotCompiled()) return;

      const config = {
        adminAddress: deployer.address,
        agentIdentityCode: identityCode!,
        content: beginCell().storeStringTail("AFL Agent Registry").endCell(),
      };

      agentRegistry = blockchain.openContract(
        AgentRegistry.createFromConfig(config, registryCode!)
      );

      const deployResult = await agentRegistry.sendDeploy(deployer.getSender(), toNano("0.05"));

      expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: agentRegistry.address,
        deploy: true,
        success: true,
      });
    });

    it("should have correct initial state", async () => {
      if (skipIfNotCompiled()) return;

      const config = {
        adminAddress: deployer.address,
        agentIdentityCode: identityCode!,
        content: beginCell().storeStringTail("AFL Agent Registry").endCell(),
      };

      agentRegistry = blockchain.openContract(
        AgentRegistry.createFromConfig(config, registryCode!)
      );

      await agentRegistry.sendDeploy(deployer.getSender(), toNano("0.05"));

      const data = await agentRegistry.getRegistryData();
      expect(data.totalAgents).toBe(0n);
      expect(data.adminAddress.equals(deployer.address)).toBe(true);
    });
  });

  describe("Registration", () => {
    const skipIfNotCompiled = () => {
      if (!contractsCompiled) {
        console.log("Skipping: contracts not compiled");
        return true;
      }
      return false;
    };

    beforeEach(async () => {
      if (!contractsCompiled) return;

      const config = {
        adminAddress: deployer.address,
        agentIdentityCode: identityCode!,
        content: beginCell().storeStringTail("AFL Agent Registry").endCell(),
      };

      agentRegistry = blockchain.openContract(
        AgentRegistry.createFromConfig(config, registryCode!)
      );

      await agentRegistry.sendDeploy(deployer.getSender(), toNano("0.05"));
    });

    it("should register a new agent", async () => {
      if (skipIfNotCompiled()) return;

      const registerResult = await agentRegistry.sendRegisterAgent(user.getSender(), {
        name: "Test Agent",
        description: "A test AI agent for the AFL",
        capabilities: ["reasoning", "coding"],
        avatarUrl: "https://example.com/avatar.png",
      });

      expect(registerResult.transactions).toHaveTransaction({
        from: user.address,
        to: agentRegistry.address,
        success: true,
      });

      const data = await agentRegistry.getRegistryData();
      expect(data.totalAgents).toBe(1n);
    });

    it("should increment agent index after registration", async () => {
      if (skipIfNotCompiled()) return;

      const dataBefore = await agentRegistry.getRegistryData();

      await agentRegistry.sendRegisterAgent(user.getSender(), {
        name: "Agent 1",
        description: "First agent",
        capabilities: [],
      });

      const dataAfter = await agentRegistry.getRegistryData();
      expect(dataAfter.totalAgents).toBe(dataBefore.totalAgents + 1n);
    });

    it("should reject registration with insufficient fee", async () => {
      if (skipIfNotCompiled()) return;

      const registerResult = await agentRegistry.sendRegisterAgent(user.getSender(), {
        value: toNano("0.01"), // Below minimum 0.1 TON
        name: "Test Agent",
        description: "A test agent",
        capabilities: [],
      });

      expect(registerResult.transactions).toHaveTransaction({
        from: user.address,
        to: agentRegistry.address,
        success: false,
        exitCode: 402, // error::insufficient_funds
      });
    });
  });

  describe("Get Methods", () => {
    const skipIfNotCompiled = () => {
      if (!contractsCompiled) {
        console.log("Skipping: contracts not compiled");
        return true;
      }
      return false;
    };

    beforeEach(async () => {
      if (!contractsCompiled) return;

      const config = {
        adminAddress: deployer.address,
        agentIdentityCode: identityCode!,
        content: beginCell().storeStringTail("AFL Agent Registry").endCell(),
      };

      agentRegistry = blockchain.openContract(
        AgentRegistry.createFromConfig(config, registryCode!)
      );

      await agentRegistry.sendDeploy(deployer.getSender(), toNano("0.05"));
    });

    it("should return correct registry data", async () => {
      if (skipIfNotCompiled()) return;

      const data = await agentRegistry.getRegistryData();

      expect(data.totalAgents).toBe(0n);
      expect(data.adminAddress.equals(deployer.address)).toBe(true);
      expect(data.content).toBeDefined();
    });

    it("should return correct total agents count", async () => {
      if (skipIfNotCompiled()) return;

      expect(await agentRegistry.getTotalAgents()).toBe(0n);

      await agentRegistry.sendRegisterAgent(user.getSender(), {
        name: "Agent 1",
        description: "First agent",
        capabilities: [],
      });

      expect(await agentRegistry.getTotalAgents()).toBe(1n);
    });

    it("should compute correct agent address", async () => {
      if (skipIfNotCompiled()) return;

      const agentAddr = await agentRegistry.getAgentAddress(0n, user.address);

      // Verify it's a valid address
      expect(agentAddr).toBeDefined();
      expect(agentAddr.workChain).toBe(0);
    });

    it("should compute different addresses for different owners", async () => {
      if (skipIfNotCompiled()) return;

      const addr1 = await agentRegistry.getAgentAddress(0n, user.address);
      const addr2 = await agentRegistry.getAgentAddress(0n, deployer.address);

      expect(addr1.equals(addr2)).toBe(false);
    });

    it("should compute different addresses for different indices", async () => {
      if (skipIfNotCompiled()) return;

      const addr1 = await agentRegistry.getAgentAddress(0n, user.address);
      const addr2 = await agentRegistry.getAgentAddress(1n, user.address);

      expect(addr1.equals(addr2)).toBe(false);
    });
  });

  describe("Admin Operations", () => {
    const skipIfNotCompiled = () => {
      if (!contractsCompiled) {
        console.log("Skipping: contracts not compiled");
        return true;
      }
      return false;
    };

    beforeEach(async () => {
      if (!contractsCompiled) return;

      const config = {
        adminAddress: deployer.address,
        agentIdentityCode: identityCode!,
        content: beginCell().storeStringTail("AFL Agent Registry").endCell(),
      };

      agentRegistry = blockchain.openContract(
        AgentRegistry.createFromConfig(config, registryCode!)
      );

      await agentRegistry.sendDeploy(deployer.getSender(), toNano("0.05"));
    });

    it("should allow admin to change admin", async () => {
      if (skipIfNotCompiled()) return;

      const result = await agentRegistry.sendChangeAdmin(deployer.getSender(), {
        newAdmin: user.address,
      });

      expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: agentRegistry.address,
        success: true,
      });

      const data = await agentRegistry.getRegistryData();
      expect(data.adminAddress.equals(user.address)).toBe(true);
    });

    it("should reject non-admin change admin", async () => {
      if (skipIfNotCompiled()) return;

      const result = await agentRegistry.sendChangeAdmin(user.getSender(), {
        newAdmin: user.address,
      });

      expect(result.transactions).toHaveTransaction({
        from: user.address,
        to: agentRegistry.address,
        success: false,
        exitCode: 401, // error::unauthorized
      });
    });

    it("should allow admin to update content", async () => {
      if (skipIfNotCompiled()) return;

      const newContent = beginCell().storeStringTail("Updated Registry").endCell();

      const result = await agentRegistry.sendUpdateContent(deployer.getSender(), {
        content: newContent,
      });

      expect(result.transactions).toHaveTransaction({
        from: deployer.address,
        to: agentRegistry.address,
        success: true,
      });
    });
  });
});
