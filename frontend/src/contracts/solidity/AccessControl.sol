// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title AccessControl
 * @dev Manages access control for the BioNova platform
 */
contract AccessControl {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SCIENTIST_ROLE = keccak256("SCIENTIST_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    
    // Mapping from role to addresses with that role
    mapping(bytes32 => mapping(address => bool)) public roles;
    
    // Owner of the contract
    address public owner;
    
    // Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    
    /**
     * @dev Constructor sets the owner as the admin
     */
    constructor() {
        owner = msg.sender;
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Modifier to restrict function access to specific roles
     */
    modifier onlyRole(bytes32 role) {
        require(roles[role][msg.sender] || msg.sender == owner, "AccessControl: sender does not have required role");
        _;
    }
    
    /**
     * @dev Grant a role to an address
     * @param role The role to grant
     * @param account The address to grant the role to
     */
    function grantRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        _grantRole(role, account);
    }
    
    /**
     * @dev Internal function to grant a role
     */
    function _grantRole(bytes32 role, address account) internal {
        roles[role][account] = true;
        emit RoleGranted(role, account, msg.sender);
    }
    
    /**
     * @dev Revoke a role from an address
     * @param role The role to revoke
     * @param account The address to revoke the role from
     */
    function revokeRole(bytes32 role, address account) public onlyRole(ADMIN_ROLE) {
        roles[role][account] = false;
        emit RoleRevoked(role, account, msg.sender);
    }
    
    /**
     * @dev Check if an address has a role
     * @param role The role to check
     * @param account The address to check
     * @return True if the account has the role
     */
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return roles[role][account] || (role == ADMIN_ROLE && account == owner);
    }
} 