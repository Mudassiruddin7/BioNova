// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IntellectualProperty
 * @dev Manages intellectual property rights for research data
 */
contract IntellectualProperty {
    struct IPRecord {
        uint256 id;
        string title;
        string description;
        string ipType; // Patent, Trade Secret, etc.
        string uri; // URI to additional documentation
        address[] owners;
        uint256 registrationDate;
        bool exists;
    }
    
    // Counter for IP record IDs
    uint256 private ipIdCounter;
    
    // Mapping from IP ID to IPRecord
    mapping(uint256 => IPRecord) public ipRecords;
    
    // Mapping from address to array of owned IP IDs
    mapping(address => uint256[]) public ownerToIpIds;
    
    // Events
    event IPRecordCreated(uint256 indexed id, string title, address indexed creator);
    event OwnerAdded(uint256 indexed id, address indexed owner);
    event OwnerRemoved(uint256 indexed id, address indexed owner);
    
    /**
     * @dev Create a new IP record
     * @param title Title of the IP
     * @param description Description of the IP
     * @param ipType Type of IP (Patent, Trade Secret, etc.)
     * @param uri URI to additional documentation
     * @param initialOwners Array of initial owners' addresses
     * @return ID of the created IP record
     */
    function createIPRecord(
        string memory title,
        string memory description,
        string memory ipType,
        string memory uri,
        address[] memory initialOwners
    ) public returns (uint256) {
        uint256 newIpId = ++ipIdCounter;
        
        // Make sure creator is included in owners
        bool creatorIncluded = false;
        for (uint256 i = 0; i < initialOwners.length; i++) {
            if (initialOwners[i] == msg.sender) {
                creatorIncluded = true;
                break;
            }
        }
        
        // Calculate the final owners array length
        uint256 ownersLength = creatorIncluded ? initialOwners.length : initialOwners.length + 1;
        
        // Create owners array
        address[] memory owners = new address[](ownersLength);
        
        // Add creator as first owner if not already included
        if (!creatorIncluded) {
            owners[0] = msg.sender;
            for (uint256 i = 0; i < initialOwners.length; i++) {
                owners[i + 1] = initialOwners[i];
            }
        } else {
            for (uint256 i = 0; i < initialOwners.length; i++) {
                owners[i] = initialOwners[i];
            }
        }
        
        // Create IP record
        ipRecords[newIpId] = IPRecord({
            id: newIpId,
            title: title,
            description: description,
            ipType: ipType,
            uri: uri,
            owners: owners,
            registrationDate: block.timestamp,
            exists: true
        });
        
        // Update owner mappings
        for (uint256 i = 0; i < owners.length; i++) {
            ownerToIpIds[owners[i]].push(newIpId);
        }
        
        emit IPRecordCreated(newIpId, title, msg.sender);
        
        return newIpId;
    }
    
    /**
     * @dev Add an owner to an existing IP record
     * @param ipId ID of the IP record
     * @param newOwner Address of the new owner
     */
    function addOwner(uint256 ipId, address newOwner) public {
        require(ipRecords[ipId].exists, "IP record does not exist");
        
        // Check if sender is an owner
        bool isOwner = false;
        for (uint256 i = 0; i < ipRecords[ipId].owners.length; i++) {
            if (ipRecords[ipId].owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Only owners can add new owners");
        
        // Check if new owner is already an owner
        for (uint256 i = 0; i < ipRecords[ipId].owners.length; i++) {
            if (ipRecords[ipId].owners[i] == newOwner) {
                revert("Address is already an owner");
            }
        }
        
        // Add new owner
        address[] memory newOwners = new address[](ipRecords[ipId].owners.length + 1);
        for (uint256 i = 0; i < ipRecords[ipId].owners.length; i++) {
            newOwners[i] = ipRecords[ipId].owners[i];
        }
        newOwners[ipRecords[ipId].owners.length] = newOwner;
        
        ipRecords[ipId].owners = newOwners;
        ownerToIpIds[newOwner].push(ipId);
        
        emit OwnerAdded(ipId, newOwner);
    }
    
    /**
     * @dev Get details of an IP record
     * @param ipId ID of the IP record
     * @return IP record details
     */
    function getIPRecord(uint256 ipId) public view returns (
        uint256,
        string memory,
        string memory,
        string memory,
        string memory,
        address[] memory,
        uint256
    ) {
        require(ipRecords[ipId].exists, "IP record does not exist");
        
        IPRecord memory record = ipRecords[ipId];
        
        return (
            record.id,
            record.title,
            record.description,
            record.ipType,
            record.uri,
            record.owners,
            record.registrationDate
        );
    }
    
    /**
     * @dev Check if an address is an owner of an IP record
     * @param ipId ID of the IP record
     * @param owner Address to check
     * @return True if the address is an owner
     */
    function isOwner(uint256 ipId, address owner) public view returns (bool) {
        require(ipRecords[ipId].exists, "IP record does not exist");
        
        for (uint256 i = 0; i < ipRecords[ipId].owners.length; i++) {
            if (ipRecords[ipId].owners[i] == owner) {
                return true;
            }
        }
        
        return false;
    }
} 