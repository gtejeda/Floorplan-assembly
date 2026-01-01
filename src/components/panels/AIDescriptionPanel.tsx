import { useState, useCallback, useMemo } from 'react';
import { useFloorplanStore } from '@store/index';
import { generateAIDescription, generateProjectJSON } from '@lib/generateAIDescription';

type ViewAngle = 'aerial' | 'eye-level' | 'perspective';
type OutputFormat = 'text' | 'json';

export function AIDescriptionPanel() {
  const project = useFloorplanStore((state) => state.project);
  const displayUnit = useFloorplanStore((state) => state.displayUnit);

  const [viewAngle, setViewAngle] = useState<ViewAngle>('perspective');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('text');
  const [includeCoordinates, setIncludeCoordinates] = useState(false);
  const [includeColors, setIncludeColors] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate the description based on current settings
  const generatedDescription = useMemo(() => {
    if (!project) return '';

    if (outputFormat === 'json') {
      return generateProjectJSON(project, displayUnit);
    }

    return generateAIDescription(project, displayUnit, {
      viewAngle,
      includeCoordinates,
      includeColors,
    });
  }, [project, displayUnit, viewAngle, outputFormat, includeCoordinates, includeColors]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [generatedDescription]);

  // Character count
  const charCount = generatedDescription.length;
  const wordCount = generatedDescription.split(/\s+/).filter(Boolean).length;

  if (!project) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No project loaded
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        AI Description Generator
      </h2>

      <div className="space-y-4">
        {/* Output format toggle */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Output Format</label>
          <div className="flex gap-2">
            <button
              onClick={() => setOutputFormat('text')}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                outputFormat === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Text Prompt
            </button>
            <button
              onClick={() => setOutputFormat('json')}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                outputFormat === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {/* View angle selector (only for text format) */}
        {outputFormat === 'text' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">View Angle</label>
            <select
              value={viewAngle}
              onChange={(e) => setViewAngle(e.target.value as ViewAngle)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="perspective">Perspective (3D)</option>
              <option value="aerial">Aerial (Top-down)</option>
              <option value="eye-level">Eye-level (Street view)</option>
            </select>
          </div>
        )}

        {/* Options (only for text format) */}
        {outputFormat === 'text' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCoordinates}
                onChange={(e) => setIncludeCoordinates(e.target.checked)}
                className="w-4 h-4"
              />
              Include coordinates
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeColors}
                onChange={(e) => setIncludeColors(e.target.checked)}
                className="w-4 h-4"
              />
              Include colors
            </label>
          </div>
        )}

        {/* Generated description preview */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs text-gray-400">Generated Description</label>
            <span className="text-xs text-gray-500">
              {charCount} chars / {wordCount} words
            </span>
          </div>
          <textarea
            value={generatedDescription}
            readOnly
            rows={8}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-gray-300 focus:outline-none resize-none font-mono"
          />
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>

        {/* Tips */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Tip:</strong> Add descriptions to the Lot (project style) and individual Areas (materials, details) for better AI results.
          </p>
          <p>
            <strong>JSON format:</strong> Best for structured AI systems or custom processing.
          </p>
        </div>
      </div>
    </div>
  );
}
