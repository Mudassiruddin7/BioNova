// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title WorkflowAutomation
 * @dev Manages automated workflows for hazardous material handling
 */
contract WorkflowAutomation {
    enum WorkflowStatus { Created, InProgress, Completed, Cancelled }
    enum ApprovalStatus { Pending, Approved, Rejected }
    
    struct Workflow {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 createdAt;
        WorkflowStatus status;
        uint256 completedAt;
        bool exists;
    }
    
    struct WorkflowStep {
        uint256 id;
        uint256 workflowId;
        string name;
        string description;
        address assignedTo;
        bool completed;
        uint256 completedAt;
        ApprovalStatus approvalStatus;
    }
    
    // Counter for workflow IDs
    uint256 private workflowIdCounter;
    
    // Counter for step IDs
    uint256 private stepIdCounter;
    
    // Mapping from workflow ID to Workflow
    mapping(uint256 => Workflow) public workflows;
    
    // Mapping from workflow ID to its steps
    mapping(uint256 => WorkflowStep[]) public workflowSteps;
    
    // Events
    event WorkflowCreated(uint256 indexed id, string name, address indexed creator);
    event WorkflowUpdated(uint256 indexed id, WorkflowStatus status);
    event StepCreated(uint256 indexed workflowId, uint256 indexed stepId, string name);
    event StepCompleted(uint256 indexed workflowId, uint256 indexed stepId);
    event StepApprovalUpdated(uint256 indexed workflowId, uint256 indexed stepId, ApprovalStatus status);
    
    /**
     * @dev Create a new workflow
     * @param name Name of the workflow
     * @param description Description of the workflow
     * @return ID of the created workflow
     */
    function createWorkflow(string memory name, string memory description) public returns (uint256) {
        uint256 newWorkflowId = ++workflowIdCounter;
        
        workflows[newWorkflowId] = Workflow({
            id: newWorkflowId,
            name: name,
            description: description,
            creator: msg.sender,
            createdAt: block.timestamp,
            status: WorkflowStatus.Created,
            completedAt: 0,
            exists: true
        });
        
        emit WorkflowCreated(newWorkflowId, name, msg.sender);
        
        return newWorkflowId;
    }
    
    /**
     * @dev Add a step to a workflow
     * @param workflowId ID of the workflow
     * @param name Name of the step
     * @param description Description of the step
     * @param assignedTo Address assigned to complete this step
     * @return ID of the created step
     */
    function addWorkflowStep(
        uint256 workflowId,
        string memory name,
        string memory description,
        address assignedTo
    ) public returns (uint256) {
        require(workflows[workflowId].exists, "Workflow does not exist");
        require(workflows[workflowId].status != WorkflowStatus.Completed, "Workflow already completed");
        require(workflows[workflowId].status != WorkflowStatus.Cancelled, "Workflow cancelled");
        
        uint256 newStepId = ++stepIdCounter;
        
        WorkflowStep memory newStep = WorkflowStep({
            id: newStepId,
            workflowId: workflowId,
            name: name,
            description: description,
            assignedTo: assignedTo,
            completed: false,
            completedAt: 0,
            approvalStatus: ApprovalStatus.Pending
        });
        
        workflowSteps[workflowId].push(newStep);
        
        // Update workflow status if it was in Created state
        if (workflows[workflowId].status == WorkflowStatus.Created) {
            workflows[workflowId].status = WorkflowStatus.InProgress;
            emit WorkflowUpdated(workflowId, WorkflowStatus.InProgress);
        }
        
        emit StepCreated(workflowId, newStepId, name);
        
        return newStepId;
    }
    
    /**
     * @dev Complete a workflow step
     * @param workflowId ID of the workflow
     * @param stepId ID of the step
     */
    function completeStep(uint256 workflowId, uint256 stepId) public {
        require(workflows[workflowId].exists, "Workflow does not exist");
        
        // Find the step
        bool stepFound = false;
        uint256 stepIndex;
        
        for (uint256 i = 0; i < workflowSteps[workflowId].length; i++) {
            if (workflowSteps[workflowId][i].id == stepId) {
                stepFound = true;
                stepIndex = i;
                break;
            }
        }
        
        require(stepFound, "Step not found");
        require(!workflowSteps[workflowId][stepIndex].completed, "Step already completed");
        require(workflowSteps[workflowId][stepIndex].assignedTo == msg.sender, "Not authorized to complete this step");
        
        // Complete the step
        workflowSteps[workflowId][stepIndex].completed = true;
        workflowSteps[workflowId][stepIndex].completedAt = block.timestamp;
        
        emit StepCompleted(workflowId, stepId);
        
        // Check if all steps are completed
        bool allCompleted = true;
        for (uint256 i = 0; i < workflowSteps[workflowId].length; i++) {
            if (!workflowSteps[workflowId][i].completed) {
                allCompleted = false;
                break;
            }
        }
        
        // If all steps are completed, mark workflow as completed
        if (allCompleted) {
            workflows[workflowId].status = WorkflowStatus.Completed;
            workflows[workflowId].completedAt = block.timestamp;
            emit WorkflowUpdated(workflowId, WorkflowStatus.Completed);
        }
    }
} 