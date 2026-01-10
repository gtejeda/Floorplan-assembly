import type { StateCreator } from 'zustand';
import type { StorageType } from '@/models/types';

export interface SocialClubSlice {
  selectedAmenities: string[];  // Array of Amenity IDs
  storageType: StorageType;
  customAmenityCosts: Record<string, number>;  // Amenity ID → custom cost

  // Actions
  toggleAmenity: (amenityId: string) => void;
  selectAmenity: (amenityId: string) => void;
  deselectAmenity: (amenityId: string) => void;
  setSelectedAmenities: (amenityIds: string[]) => void;
  clearSelectedAmenities: () => void;
  setStorageType: (storageType: StorageType) => void;
  setCustomAmenityCost: (amenityId: string, cost: number) => void;
  removeCustomAmenityCost: (amenityId: string) => void;
  clearCustomAmenityCosts: () => void;
}

export const createSocialClubSlice: StateCreator<
  SocialClubSlice,
  [],
  [],
  SocialClubSlice
> = (set) => ({
  selectedAmenities: [],
  storageType: 'dedicated',
  customAmenityCosts: {},

  toggleAmenity: (amenityId) => {
    set((state) => {
      const isSelected = state.selectedAmenities.includes(amenityId);

      if (isSelected) {
        // Remove amenity
        const newSelectedAmenities = state.selectedAmenities.filter(id => id !== amenityId);

        // Also remove custom cost if it exists
        const newCustomCosts = { ...state.customAmenityCosts };
        delete newCustomCosts[amenityId];

        return {
          selectedAmenities: newSelectedAmenities,
          customAmenityCosts: newCustomCosts,
        };
      } else {
        // Add amenity
        return {
          selectedAmenities: [...state.selectedAmenities, amenityId],
        };
      }
    });
  },

  selectAmenity: (amenityId) => {
    set((state) => {
      if (state.selectedAmenities.includes(amenityId)) {
        return state; // Already selected
      }

      return {
        selectedAmenities: [...state.selectedAmenities, amenityId],
      };
    });
  },

  deselectAmenity: (amenityId) => {
    set((state) => {
      // Remove custom cost if it exists
      const newCustomCosts = { ...state.customAmenityCosts };
      delete newCustomCosts[amenityId];

      return {
        selectedAmenities: state.selectedAmenities.filter(id => id !== amenityId),
        customAmenityCosts: newCustomCosts,
      };
    });
  },

  setSelectedAmenities: (amenityIds) => {
    set({ selectedAmenities: amenityIds });
  },

  clearSelectedAmenities: () => {
    set({ selectedAmenities: [], customAmenityCosts: {} });
  },

  setStorageType: (storageType) => {
    set({ storageType });
  },

  setCustomAmenityCost: (amenityId, cost) => {
    set((state) => ({
      customAmenityCosts: {
        ...state.customAmenityCosts,
        [amenityId]: cost,
      },
    }));
  },

  removeCustomAmenityCost: (amenityId) => {
    set((state) => {
      const newCustomCosts = { ...state.customAmenityCosts };
      delete newCustomCosts[amenityId];

      return { customAmenityCosts: newCustomCosts };
    });
  },

  clearCustomAmenityCosts: () => {
    set({ customAmenityCosts: {} });
  },
});
