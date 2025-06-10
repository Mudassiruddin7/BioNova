// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title SampleProvenance
 * @dev Tracks the provenance of hazardous samples
 */
contract SampleProvenance {
    struct Sample {
        string sampleId;
        string sampleType;
        string description;
        string hazardLevel;
        address registeredBy;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from sample ID to Sample
    mapping(string => Sample) public samples;
    
    // Array to keep track of all sample IDs
    string[] public sampleIds;

    // Events
    event SampleRegistered(
        string sampleId,
        string sampleType,
        string hazardLevel,
        address indexed registeredBy,
        uint256 timestamp
    );

    /**
     * @dev Register a new sample
     * @param sampleId Unique identifier for the sample
     * @param sampleType Type of the sample
     * @param description Description of the sample
     * @param hazardLevel Hazard level of the sample
     */
    function registerSample(
        string memory sampleId,
        string memory sampleType,
        string memory description,
        string memory hazardLevel
    ) public returns (bool) {
        // Ensure sample doesn't already exist
        require(!samples[sampleId].exists, "Sample already registered");
        
        // Create new sample
        samples[sampleId] = Sample({
            sampleId: sampleId,
            sampleType: sampleType,
            description: description,
            hazardLevel: hazardLevel,
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Add sample ID to array
        sampleIds.push(sampleId);
        
        // Emit event
        emit SampleRegistered(
            sampleId,
            sampleType,
            hazardLevel,
            msg.sender,
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Get sample details
     * @param sampleId Unique identifier for the sample
     * @return Sample details
     */
    function getSample(string memory sampleId) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        address,
        uint256
    ) {
        require(samples[sampleId].exists, "Sample does not exist");
        
        Sample memory sample = samples[sampleId];
        
        return (
            sample.sampleId,
            sample.sampleType,
            sample.description,
            sample.hazardLevel,
            sample.registeredBy,
            sample.timestamp
        );
    }

    /**
     * @dev Get count of all samples
     * @return Count of samples
     */
    function getSampleCount() public view returns (uint256) {
        return sampleIds.length;
    }
} 