import { useState, useEffect } from 'react';
import { useFloorplanStore } from '../../store';
import { DOMINICAN_PROVINCES } from '../../data/provinces';
import { ImageUpload } from './ImageUpload';
import type { DisplayUnit, Currency, DominicanProvince } from '../../models/types';

export function LandConfigPanel() {
  const landParcel = useFloorplanStore(state => state.landParcel);
  const updateLandParcel = useFloorplanStore(state => state.updateLandParcel);
  const addLandImage = useFloorplanStore(state => state.addLandImage);
  const removeLandImage = useFloorplanStore(state => state.removeLandImage);

  // Local state for input mode and conversions
  const [inputMode, setInputMode] = useState<'dimensions' | 'area'>('dimensions');
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>(landParcel?.unit || 'meters');
  const [currency, setCurrency] = useState<Currency>(landParcel?.acquisitionCurrency || 'USD');

  // Dimension inputs (in meters internally, converted for display)
  const [length, setLength] = useState<string>(landParcel?.height.toString() || '50');
  const [width, setWidth] = useState<string>(landParcel?.width.toString() || '30');
  const [totalArea, setTotalArea] = useState<string>(landParcel?.totalArea.toString() || '1500');

  // Other inputs
  const [province, setProvince] = useState<DominicanProvince>(landParcel?.province || 'La Altagracia');
  const [acquisitionCost, setAcquisitionCost] = useState<string>(landParcel?.acquisitionCost.toString() || '150000');
  const [isUrbanized, setIsUrbanized] = useState<boolean>(landParcel?.isUrbanized || false);
  const [landmarks, setLandmarks] = useState<string[]>(landParcel?.landmarks || []);
  const [newLandmark, setNewLandmark] = useState<string>('');

  // Validation states
  const [dimensionError, setDimensionError] = useState<string>('');
  const [costError, setCostError] = useState<string>('');

  // Conversion constants
  const SQM_TO_SQFT = 10.7639;
  const M_TO_FT = 3.28084;

  // Convert meters to display unit
  const toDisplayUnit = (meters: number): number => {
    return displayUnit === 'meters' ? meters : meters * M_TO_FT;
  };

  // Convert display unit to meters
  const fromDisplayUnit = (value: number): number => {
    return displayUnit === 'meters' ? value : value / M_TO_FT;
  };

  // Convert sqm to display area unit
  const toDisplayArea = (sqm: number): number => {
    return displayUnit === 'meters' ? sqm : sqm * SQM_TO_SQFT;
  };

  // Convert display area unit to sqm
  const fromDisplayArea = (value: number): number => {
    return displayUnit === 'meters' ? value : value / SQM_TO_SQFT;
  };

  // Validate dimensions
  const validateDimensions = (lengthM: number, widthM: number): boolean => {
    if (lengthM < 0.001 || lengthM > 50000) {
      setDimensionError('Length must be between 0.001m and 50,000m');
      return false;
    }
    if (widthM < 0.001 || widthM > 50000) {
      setDimensionError('Width must be between 0.001m and 50,000m');
      return false;
    }
    const area = lengthM * widthM;
    if (area < 0.001 || area > 50000) {
      setDimensionError('Total area must be between 0.001 sqm and 50,000 sqm');
      return false;
    }
    setDimensionError('');
    return true;
  };

  // Validate acquisition cost
  const validateCost = (cost: number): boolean => {
    if (cost <= 0) {
      setCostError('Acquisition cost must be greater than 0');
      return false;
    }
    setCostError('');
    return true;
  };

  // Handle dimension input changes
  const handleLengthChange = (value: string) => {
    setLength(value);
    const lengthNum = parseFloat(value);
    const widthNum = parseFloat(width);

    if (!isNaN(lengthNum) && !isNaN(widthNum)) {
      const lengthM = fromDisplayUnit(lengthNum);
      const widthM = fromDisplayUnit(widthNum);

      if (validateDimensions(lengthM, widthM)) {
        const areaM = lengthM * widthM;
        setTotalArea(toDisplayArea(areaM).toFixed(2));

        updateLandParcel({
          height: lengthM,
          width: widthM,
          totalArea: areaM
        });
      }
    }
  };

  const handleWidthChange = (value: string) => {
    setWidth(value);
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(value);

    if (!isNaN(lengthNum) && !isNaN(widthNum)) {
      const lengthM = fromDisplayUnit(lengthNum);
      const widthM = fromDisplayUnit(widthNum);

      if (validateDimensions(lengthM, widthM)) {
        const areaM = lengthM * widthM;
        setTotalArea(toDisplayArea(areaM).toFixed(2));

        updateLandParcel({
          height: lengthM,
          width: widthM,
          totalArea: areaM
        });
      }
    }
  };

  const handleAreaChange = (value: string) => {
    setTotalArea(value);
    const areaNum = parseFloat(value);

    if (!isNaN(areaNum)) {
      const areaM = fromDisplayArea(areaNum);

      // Assume square dimensions for simplicity
      const sideM = Math.sqrt(areaM);

      if (validateDimensions(sideM, sideM)) {
        setLength(toDisplayUnit(sideM).toFixed(2));
        setWidth(toDisplayUnit(sideM).toFixed(2));

        updateLandParcel({
          height: sideM,
          width: sideM,
          totalArea: areaM
        });
      }
    }
  };

  // Handle province change
  const handleProvinceChange = (newProvince: DominicanProvince) => {
    setProvince(newProvince);
    updateLandParcel({
      province: newProvince
    });
  };

  // Handle acquisition cost change
  const handleCostChange = (value: string) => {
    setAcquisitionCost(value);
    const costNum = parseFloat(value);

    if (!isNaN(costNum) && validateCost(costNum)) {
      updateLandParcel({
        acquisitionCost: costNum
      });
    }
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    updateLandParcel({
      acquisitionCurrency: newCurrency
    });
  };

  // Handle display unit change
  const handleDisplayUnitChange = (newUnit: DisplayUnit) => {
    setDisplayUnit(newUnit);
    updateLandParcel({
      unit: newUnit
    });
  };

  // Handle urbanization status change
  const handleUrbanizationChange = (checked: boolean) => {
    setIsUrbanized(checked);
    updateLandParcel({
      isUrbanized: checked
    });
  };

  // Handle landmarks
  const handleAddLandmark = () => {
    if (newLandmark.trim()) {
      const updatedLandmarks = [...landmarks, newLandmark.trim()];
      setLandmarks(updatedLandmarks);
      setNewLandmark('');

      updateLandParcel({
        landmarks: updatedLandmarks
      });
    }
  };

  const handleRemoveLandmark = (index: number) => {
    const updatedLandmarks = landmarks.filter((_, i) => i !== index);
    setLandmarks(updatedLandmarks);

    updateLandParcel({
      landmarks: updatedLandmarks
    });
  };

  // Update display values when unit changes
  useEffect(() => {
    if (landParcel) {
      setLength(toDisplayUnit(landParcel.height).toFixed(2));
      setWidth(toDisplayUnit(landParcel.width).toFixed(2));
      setTotalArea(toDisplayArea(landParcel.totalArea).toFixed(2));
    }
  }, [displayUnit]);

  return (
    <div className="p-4 space-y-6 bg-white border-b border-gray-200">
      <h2 className="text-xl font-bold text-gray-900">Land Configuration</h2>

      {/* Unit Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Display Unit:</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleDisplayUnitChange('meters')}
            className={`px-3 py-1 text-sm rounded ${
              displayUnit === 'meters'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Meters (m)
          </button>
          <button
            onClick={() => handleDisplayUnitChange('feet')}
            className={`px-3 py-1 text-sm rounded ${
              displayUnit === 'feet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Feet (ft)
          </button>
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Input Method:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('dimensions')}
            className={`px-3 py-1 text-sm rounded ${
              inputMode === 'dimensions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dimensions (L × W)
          </button>
          <button
            onClick={() => setInputMode('area')}
            className={`px-3 py-1 text-sm rounded ${
              inputMode === 'area'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Total Area
          </button>
        </div>
      </div>

      {/* Dimensions Input */}
      {inputMode === 'dimensions' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length ({displayUnit === 'meters' ? 'm' : 'ft'})
            </label>
            <input
              type="number"
              step="0.1"
              value={length}
              onChange={(e) => handleLengthChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width ({displayUnit === 'meters' ? 'm' : 'ft'})
            </label>
            <input
              type="number"
              step="0.1"
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Area ({displayUnit === 'meters' ? 'sqm' : 'sqft'})
            </label>
            <input
              type="text"
              value={totalArea}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Area ({displayUnit === 'meters' ? 'sqm' : 'sqft'})
          </label>
          <input
            type="number"
            step="0.1"
            value={totalArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Dimensions: {length} × {width} {displayUnit === 'meters' ? 'm' : 'ft'} (calculated as square)
          </p>
        </div>
      )}

      {dimensionError && (
        <p className="text-sm text-red-600">{dimensionError}</p>
      )}

      {/* Province Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Province
        </label>
        <select
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value as DominicanProvince)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DOMINICAN_PROVINCES.map((prov) => (
            <option key={prov} value={prov}>
              {prov}
            </option>
          ))}
        </select>
      </div>

      {/* Acquisition Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Acquisition Cost
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              step="1000"
              value={acquisitionCost}
              onChange={(e) => handleCostChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="DOP">DOP</option>
          </select>
        </div>
        {costError && (
          <p className="mt-1 text-sm text-red-600">{costError}</p>
        )}
      </div>

      {/* Urbanization Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="urbanized"
          checked={isUrbanized}
          onChange={(e) => handleUrbanizationChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="urbanized" className="text-sm font-medium text-gray-700">
          Land is urbanized (utilities available)
        </label>
      </div>

      {/* Landmarks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nearby Landmarks
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLandmark}
            onChange={(e) => setNewLandmark(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLandmark()}
            placeholder="e.g., Bavaro Beach, PUJ Airport"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddLandmark}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        {landmarks.length > 0 && (
          <ul className="space-y-1">
            {landmarks.map((landmark, index) => (
              <li key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{landmark}</span>
                <button
                  onClick={() => handleRemoveLandmark(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Images Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Land Parcel Images
        </label>
        <p className="text-xs text-gray-500">
          Upload reference images for the land parcel (JPEG, PNG, WebP, max 10MB each)
        </p>
        <ImageUpload
          images={landParcel?.images || []}
          onImageAdd={(image) => addLandImage(image)}
          onImageRemove={removeLandImage}
          onImageClick={() => {}}
        />
      </div>
    </div>
  );
}
