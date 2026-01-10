import type { StateCreator } from 'zustand';
import type { SubdivisionScenario, ImageReference, LandParcel } from '@/models/types';
import { generateId } from '@/lib/uuid';
import { calculateAllScenarios, getDefaultScenario } from '@/lib/subdivision';

export interface SubdivisionSlice {
  subdivisionScenarios: SubdivisionScenario[];
  selectedScenarioId: string | null;
  isCalculating: boolean;

  // Actions
  setSubdivisionScenarios: (scenarios: SubdivisionScenario[]) => void;
  addSubdivisionScenario: (scenario: Omit<SubdivisionScenario, 'id'>) => void;
  updateSubdivisionScenario: (scenarioId: string, updates: Partial<SubdivisionScenario>) => void;
  removeSubdivisionScenario: (scenarioId: string) => void;
  clearSubdivisionScenarios: () => void;
  selectScenario: (scenarioId: string | null) => void;
  setCalculating: (isCalculating: boolean) => void;
  regenerateSubdivisionScenarios: (landParcel: LandParcel) => void;
  addLotImage: (scenarioId: string, lotId: string, image: Omit<ImageReference, 'id'>) => void;
  removeLotImage: (scenarioId: string, lotId: string, imageId: string) => void;
}

export const createSubdivisionSlice: StateCreator<
  SubdivisionSlice,
  [],
  [],
  SubdivisionSlice
> = (set) => ({
  subdivisionScenarios: [],
  selectedScenarioId: null,
  isCalculating: false,

  setSubdivisionScenarios: (scenarios) => {
    set({ subdivisionScenarios: scenarios });
  },

  addSubdivisionScenario: (scenario) => {
    set((state) => {
      const newScenario: SubdivisionScenario = {
        ...scenario,
        id: generateId(),
      };

      return {
        subdivisionScenarios: [...state.subdivisionScenarios, newScenario],
      };
    });
  },

  updateSubdivisionScenario: (scenarioId, updates) => {
    set((state) => ({
      subdivisionScenarios: state.subdivisionScenarios.map(scenario =>
        scenario.id === scenarioId
          ? { ...scenario, ...updates }
          : scenario
      ),
    }));
  },

  removeSubdivisionScenario: (scenarioId) => {
    set((state) => {
      const newScenarios = state.subdivisionScenarios.filter(s => s.id !== scenarioId);

      return {
        subdivisionScenarios: newScenarios,
        selectedScenarioId: state.selectedScenarioId === scenarioId
          ? null
          : state.selectedScenarioId,
      };
    });
  },

  clearSubdivisionScenarios: () => {
    set({ subdivisionScenarios: [], selectedScenarioId: null });
  },

  selectScenario: (scenarioId) => {
    set((state) => {
      // Unselect all scenarios
      const updatedScenarios = state.subdivisionScenarios.map(scenario => ({
        ...scenario,
        isSelected: scenario.id === scenarioId,
      }));

      return {
        subdivisionScenarios: updatedScenarios,
        selectedScenarioId: scenarioId,
      };
    });
  },

  setCalculating: (isCalculating) => {
    set({ isCalculating });
  },

  regenerateSubdivisionScenarios: (landParcel) => {
    // T058: Regenerate subdivision scenarios when land parcel changes
    set({ isCalculating: true });

    try {
      // Calculate all scenarios using the subdivision algorithm
      const scenarios = calculateAllScenarios(landParcel);

      // Get the default scenario (20% social club)
      const defaultScenario = getDefaultScenario(scenarios);

      // Set the scenarios and select the default one
      set({
        subdivisionScenarios: scenarios,
        selectedScenarioId: defaultScenario?.id || (scenarios[0]?.id ?? null),
        isCalculating: false,
      });
    } catch (error) {
      console.error('Failed to regenerate subdivision scenarios:', error);
      set({
        subdivisionScenarios: [],
        selectedScenarioId: null,
        isCalculating: false,
      });
    }
  },

  addLotImage: (scenarioId, lotId, image) => {
    set((state) => {
      const newImage: ImageReference = {
        ...image,
        id: generateId(),
      };

      return {
        subdivisionScenarios: state.subdivisionScenarios.map(scenario => {
          if (scenario.id !== scenarioId) return scenario;

          return {
            ...scenario,
            lots: scenario.lots.map(lot => {
              if (lot.id !== lotId) return lot;

              return {
                ...lot,
                images: [...lot.images, newImage],
              };
            }),
          };
        }),
      };
    });
  },

  removeLotImage: (scenarioId, lotId, imageId) => {
    set((state) => ({
      subdivisionScenarios: state.subdivisionScenarios.map(scenario => {
        if (scenario.id !== scenarioId) return scenario;

        return {
          ...scenario,
          lots: scenario.lots.map(lot => {
            if (lot.id !== lotId) return lot;

            return {
              ...lot,
              images: lot.images.filter(img => img.id !== imageId),
            };
          }),
        };
      }),
    }));
  },
});
