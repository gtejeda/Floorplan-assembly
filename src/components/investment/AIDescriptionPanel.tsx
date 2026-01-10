/**
 * AI Description Panel Component
 * User Story 5: AI-Ready Design Descriptions
 *
 * Generates detailed textual descriptions of the Micro Villas project
 * suitable for multi-modal AI systems to generate visual concepts and marketing materials.
 *
 * Features:
 * - T111: Display generated description
 * - T112: "Generate Description" button
 * - T113: "Copy to Clipboard" button with success feedback
 * - T114: Performance requirement (<3 seconds)
 * - T115: Store generated description in project state
 */

import { useState, useCallback, useMemo } from 'react';
import { useFloorplanStore } from '@/store';
import { generateAIDescription, copyToClipboard } from '@/lib/generateAIDescription';
import type { InvestmentProject } from '@/models/types';

export function AIDescriptionPanel() {
  // Store state - get all project data
  const project = useFloorplanStore(state => state.project);
  const landParcel = useFloorplanStore(state => state.landParcel);
  const subdivisionScenarios = useFloorplanStore(state => state.subdivisionScenarios);
  const selectedScenarioId = useFloorplanStore(state => state.selectedScenarioId);
  const selectedAmenities = useFloorplanStore(state => state.selectedAmenities);
  const storageType = useFloorplanStore(state => state.storageType);
  const customAmenityCosts = useFloorplanStore(state => state.customAmenityCosts);
  const financialAnalysis = useFloorplanStore(state => state.financialAnalysis);
  const targetProfitMargins = useFloorplanStore(state => state.targetProfitMargins);

  // Store action
  const updateProject = useFloorplanStore(state => state.loadProject);

  // Local state
  const [description, setDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Check if we have the minimum data needed to generate description
  const canGenerate = useMemo(() => {
    return (
      project !== null &&
      landParcel !== null &&
      subdivisionScenarios !== null &&
      subdivisionScenarios.length > 0 &&
      selectedScenarioId !== null
    );
  }, [project, landParcel, subdivisionScenarios, selectedScenarioId]);

  // Build InvestmentProject object
  const buildInvestmentProject = useCallback((): InvestmentProject | null => {
    if (!project || !landParcel || !subdivisionScenarios || !selectedScenarioId || !financialAnalysis) {
      return null;
    }

    return {
      ...project,
      landParcel,
      subdivisionScenarios,
      selectedScenarioId,
      socialClub: {
        selectedAmenities,
        storageType,
        customAmenityCosts,
      },
      financialAnalysis,
      targetProfitMargins: targetProfitMargins || [15, 20, 25, 30],
      aiDescription: description || undefined,
    };
  }, [
    project,
    landParcel,
    subdivisionScenarios,
    selectedScenarioId,
    selectedAmenities,
    storageType,
    customAmenityCosts,
    financialAnalysis,
    targetProfitMargins,
    description,
  ]);

  // Handle generate description (T112)
  const handleGenerate = useCallback(() => {
    const investmentProject = buildInvestmentProject();

    if (!investmentProject) {
      setError('Missing required project data. Please complete land configuration and subdivision setup first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCopySuccess(false);

    try {
      const startTime = performance.now();
      const generatedDescription = generateAIDescription(investmentProject);
      const endTime = performance.now();
      const duration = endTime - startTime;

      setDescription(generatedDescription);
      setGenerationTime(duration);

      // T115: Store generated description in project state
      const updatedProject: InvestmentProject = {
        ...investmentProject,
        aiDescription: generatedDescription,
        modified: new Date().toISOString(),
      };
      updateProject(updatedProject);

      // T114: Warn if generation took >3 seconds
      if (duration > 3000) {
        console.warn(`AI description generation took ${duration.toFixed(0)}ms (exceeds 3s requirement)`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate description';
      setError(errorMessage);
      console.error('Error generating AI description:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [buildInvestmentProject, updateProject]);

  // Handle copy to clipboard (T113)
  const handleCopy = useCallback(async () => {
    if (!description) return;

    try {
      const success = await copyToClipboard(description);

      if (success) {
        setCopySuccess(true);
        // Reset success message after 3 seconds
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        setError('Failed to copy to clipboard. Please try again or copy manually.');
      }
    } catch (err) {
      setError('Failed to copy to clipboard');
      console.error('Error copying to clipboard:', err);
    }
  }, [description]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Project Description</h2>
        <p className="mt-1 text-sm text-gray-600">
          Generate a detailed description for AI rendering and marketing materials
        </p>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            !canGenerate || isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Description'}
        </button>

        <button
          onClick={handleCopy}
          disabled={!description || isGenerating}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !description || isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Generation Time */}
      {generationTime !== null && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Generated in {generationTime.toFixed(0)}ms
            {generationTime > 3000 && (
              <span className="ml-2 text-orange-600 font-medium">
                (Warning: Exceeded 3s requirement)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Copy Success Message */}
      {copySuccess && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            Description copied to clipboard successfully!
          </p>
        </div>
      )}

      {/* Help Text */}
      {!canGenerate && (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            To generate a description, please complete:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
            {!landParcel && <li>Configure land parcel dimensions and location</li>}
            {(!subdivisionScenarios || subdivisionScenarios.length === 0) && (
              <li>Generate subdivision scenarios</li>
            )}
            {!selectedScenarioId && <li>Select a subdivision scenario</li>}
          </ul>
        </div>
      )}

      {/* Description Display */}
      <div className="flex-1 overflow-auto p-4">
        {description ? (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {description}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Click "Generate Description" to create an AI-ready project description
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          This description is optimized for multi-modal AI systems and can be used with
          image generation tools to visualize the Micro Villas development.
        </p>
      </div>
    </div>
  );
}
