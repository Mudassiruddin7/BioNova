import { synapseCore } from './synapseCore.service';
import { labIoTService } from '../labIoTService';
import { FeedbackType } from './synapseCore.service';

/**
 * Synapse AI Core Services
 * 
 * An integrated ecosystem of AI-powered services built on Groq's
 * high-performance LLM inference platform.
 * 
 * Core capabilities:
 * - Fast, context-aware responses through RAG
 * - Domain-specific analyzers (CRISPR, Blockchain)
 * - Proactive lab monitoring with alerts
 * - Natural language interfaces
 * - User feedback collection for continuous improvement
 */

export default {
  service: synapseCore,
  lab: labIoTService
};

export {
  synapseCore as synapseService,
  synapseCore as synapseGroq,
  synapseCore as synapseRAG,
  synapseCore as synapseAgent,
  synapseCore as synapseFeedback,
  FeedbackType
}; 