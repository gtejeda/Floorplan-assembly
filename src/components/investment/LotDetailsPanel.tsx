import { useState } from 'react';
import { useFloorplanStore } from '../../store';
import { ImageUpload } from './ImageUpload';

/**
 * Panel for displaying and managing individual lot details and images
 * Per FR-051: Allow image uploads for individual lots
 * Per FR-053: Display lot-specific information (dimensions, area, common area %)
 */
export function LotDetailsPanel() {
  const scenarios = useFloorplanStore(state => state.subdivisionScenarios);
  const selectedScenarioId = useFloorplanStore(state => state.selectedScenarioId);
  const addLotImage = useFloorplanStore(state => state.addLotImage);
  const removeLotImage = useFloorplanStore(state => state.removeLotImage);

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  // Get the selected scenario
  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0] || null;

  // Get the selected lot
  const selectedLot = selectedScenario?.lots.find(lot => lot.id === selectedLotId) || null;

  if (!selectedScenario) {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-500">No subdivision scenario available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lot Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Lot
        </label>
        <select
          value={selectedLotId || ''}
          onChange={(e) => setSelectedLotId(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a lot --</option>
          {selectedScenario.lots.map((lot, index) => (
            <option key={lot.id} value={lot.id}>
              Lot {index + 1} - {lot.width.toFixed(1)}m × {lot.height.toFixed(1)}m ({lot.area.toFixed(1)} sqm)
            </option>
          ))}
        </select>
      </div>

      {/* Lot Details */}
      {selectedLot && (
        <div className="space-y-4 p-4 bg-white border border-gray-200 rounded">
          {/* Lot Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Lot {selectedScenario.lots.findIndex(l => l.id === selectedLot.id) + 1}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Dimensions:</span>
                <p className="font-medium">
                  {selectedLot.width.toFixed(1)}m × {selectedLot.height.toFixed(1)}m
                </p>
              </div>

              <div>
                <span className="text-gray-600">Area:</span>
                <p className="font-medium">{selectedLot.area.toFixed(1)} sqm</p>
              </div>

              <div>
                <span className="text-gray-600">Position:</span>
                <p className="font-medium">
                  ({selectedLot.x.toFixed(1)}m, {selectedLot.y.toFixed(1)}m)
                </p>
              </div>

              <div>
                <span className="text-gray-600">Quadrant:</span>
                <p className="font-medium capitalize">{selectedLot.quadrant}</p>
              </div>

              <div className="col-span-2">
                <span className="text-gray-600">Common Area Ownership:</span>
                <p className="font-medium">{selectedLot.commonAreaPercentage.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Lot Images */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lot Images
            </label>
            <p className="text-xs text-gray-500">
              Upload images specific to this lot (JPEG, PNG, WebP, max 10MB each)
            </p>
            <ImageUpload
              images={selectedLot.images || []}
              onImageAdd={(image) => {
                if (selectedScenario.id) {
                  addLotImage(selectedScenario.id, selectedLot.id, image);
                }
              }}
              onImageRemove={(imageId) => {
                if (selectedScenario.id) {
                  removeLotImage(selectedScenario.id, selectedLot.id, imageId);
                }
              }}
              onImageClick={() => {}}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedLot && (
        <div className="p-8 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500 text-sm">Select a lot to view details and manage images</p>
        </div>
      )}
    </div>
  );
}
