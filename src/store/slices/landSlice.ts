import type { StateCreator } from 'zustand';
import type { LandParcel, ImageReference } from '@/models/types';
import { generateId } from '@/lib/uuid';

export interface LandSlice {
  landParcel: LandParcel | null;

  // Actions
  updateLandParcel: (updates: Partial<LandParcel>) => void;
  setLandParcel: (landParcel: LandParcel) => void;
  clearLandParcel: () => void;
  addLandImage: (image: Omit<ImageReference, 'id'>) => void;
  removeLandImage: (imageId: string) => void;
  updateLandImage: (imageId: string, updates: Partial<ImageReference>) => void;
}

export const createLandSlice: StateCreator<
  LandSlice,
  [],
  [],
  LandSlice
> = (set) => ({
  landParcel: null,

  updateLandParcel: (updates) => {
    set((state) => {
      if (!state.landParcel) {
        // Create new land parcel if none exists
        const newParcel: LandParcel = {
          width: updates.width ?? 50,
          height: updates.height ?? 30,
          totalArea: (updates.width ?? 50) * (updates.height ?? 30),
          province: updates.province ?? 'La Altagracia',
          landmarks: updates.landmarks ?? [],
          acquisitionCost: updates.acquisitionCost ?? 0,
          acquisitionCurrency: updates.acquisitionCurrency ?? 'USD',
          acquisitionDate: updates.acquisitionDate,
          isUrbanized: updates.isUrbanized ?? false,
          unit: updates.unit ?? 'meters',
          images: updates.images ?? [],
        };
        return { landParcel: newParcel };
      }

      // Update existing land parcel
      const updatedParcel = { ...state.landParcel, ...updates };

      // Recalculate total area if width or height changed
      if (updates.width !== undefined || updates.height !== undefined) {
        updatedParcel.totalArea = updatedParcel.width * updatedParcel.height;
      }

      return { landParcel: updatedParcel };
    });
  },

  setLandParcel: (landParcel) => {
    set({ landParcel });
  },

  clearLandParcel: () => {
    set({ landParcel: null });
  },

  addLandImage: (image) => {
    set((state) => {
      if (!state.landParcel) return state;

      const newImage: ImageReference = {
        ...image,
        id: generateId(),
      };

      return {
        landParcel: {
          ...state.landParcel,
          images: [...state.landParcel.images, newImage],
        },
      };
    });
  },

  removeLandImage: (imageId) => {
    set((state) => {
      if (!state.landParcel) return state;

      return {
        landParcel: {
          ...state.landParcel,
          images: state.landParcel.images.filter(img => img.id !== imageId),
        },
      };
    });
  },

  updateLandImage: (imageId, updates) => {
    set((state) => {
      if (!state.landParcel) return state;

      return {
        landParcel: {
          ...state.landParcel,
          images: state.landParcel.images.map(img =>
            img.id === imageId ? { ...img, ...updates } : img
          ),
        },
      };
    });
  },
});
