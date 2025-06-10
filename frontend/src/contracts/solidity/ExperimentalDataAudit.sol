// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title ExperimentalDataAudit
 * @dev Smart contract for auditing experimental data
 */
contract ExperimentalDataAudit {
    struct Experiment {
        string experimentId;
        string sampleId;
        string experimentType;
        string results;
        string metadata;
        address conductedBy;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from experiment ID to Experiment
    mapping(string => Experiment) public experiments;
    
    // Array to keep track of all experiment IDs
    string[] public experimentIds;

    // Events
    event ExperimentRecorded(
        string experimentId,
        string sampleId,
        string experimentType,
        address indexed conductedBy,
        uint256 timestamp
    );

    /**
     * @dev Record a new experiment
     * @param experimentId Unique identifier for the experiment
     * @param sampleId ID of the sample used in the experiment
     * @param experimentType Type of experiment conducted
     * @param results Results of the experiment
     * @param metadata Additional metadata about the experiment
     */
    function recordExperiment(
        string memory experimentId,
        string memory sampleId,
        string memory experimentType,
        string memory results,
        string memory metadata
    ) public returns (bool) {
        // Ensure experiment doesn't already exist
        require(!experiments[experimentId].exists, "Experiment already recorded");
        
        // Create new experiment
        experiments[experimentId] = Experiment({
            experimentId: experimentId,
            sampleId: sampleId,
            experimentType: experimentType,
            results: results,
            metadata: metadata,
            conductedBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Add experiment ID to array
        experimentIds.push(experimentId);
        
        // Emit event
        emit ExperimentRecorded(
            experimentId,
            sampleId,
            experimentType,
            msg.sender,
            block.timestamp
        );
        
        return true;
    }

    /**
     * @dev Get experiment details
     * @param experimentId Unique identifier for the experiment
     * @return Experiment details
     */
    function getExperiment(string memory experimentId) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        string memory,
        address,
        uint256
    ) {
        require(experiments[experimentId].exists, "Experiment does not exist");
        
        Experiment memory experiment = experiments[experimentId];
        
        return (
            experiment.experimentId,
            experiment.sampleId,
            experiment.experimentType,
            experiment.results,
            experiment.metadata,
            experiment.conductedBy,
            experiment.timestamp
        );
    }

    /**
     * @dev Get experiments for a sample
     * @param sampleId ID of the sample
     * @return Array of experiment IDs for the sample
     */
    function getExperimentsBySample(string memory sampleId) public view returns (string[] memory) {
        // Count matching experiments
        uint256 count = 0;
        for (uint256 i = 0; i < experimentIds.length; i++) {
            if (keccak256(bytes(experiments[experimentIds[i]].sampleId)) == keccak256(bytes(sampleId))) {
                count++;
            }
        }
        
        // Create result array
        string[] memory result = new string[](count);
        uint256 index = 0;
        
        // Populate result array
        for (uint256 i = 0; i < experimentIds.length; i++) {
            if (keccak256(bytes(experiments[experimentIds[i]].sampleId)) == keccak256(bytes(sampleId))) {
                result[index] = experimentIds[i];
                index++;
            }
        }
        
        return result;
    }
} 