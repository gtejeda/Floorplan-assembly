import type { StateCreator } from 'zustand';
import type { FinancialAnalysis, OtherCost, Currency } from '@/models/types';
import { generateId } from '@/lib/uuid';

export interface FinancialSlice {
  financialAnalysis: FinancialAnalysis | null;
  targetProfitMargins: number[];  // e.g., [15, 20, 25, 30] (user-defined)
  aiDescription: string | null;

  // Actions
  setFinancialAnalysis: (analysis: FinancialAnalysis) => void;
  updateFinancialAnalysis: (updates: Partial<FinancialAnalysis>) => void;
  clearFinancialAnalysis: () => void;

  // Other costs management
  addOtherCost: (cost: Omit<OtherCost, 'id'>) => void;
  updateOtherCost: (costId: string, updates: Partial<OtherCost>) => void;
  removeOtherCost: (costId: string) => void;

  // Target profit margins
  setTargetProfitMargins: (margins: number[]) => void;
  addTargetProfitMargin: (margin: number) => void;
  removeTargetProfitMargin: (margin: number) => void;

  // Currency settings
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: number) => void;

  // Maintenance
  setTotalMonthlyMaintenance: (amount: number) => void;

  // AI Description
  setAIDescription: (description: string) => void;
  clearAIDescription: () => void;
}

export const createFinancialSlice: StateCreator<
  FinancialSlice,
  [],
  [],
  FinancialSlice
> = (set) => ({
  financialAnalysis: null,
  targetProfitMargins: [15, 20, 25, 30],  // Default margins per spec
  aiDescription: null,

  setFinancialAnalysis: (analysis) => {
    set({ financialAnalysis: analysis });
  },

  updateFinancialAnalysis: (updates) => {
    set((state) => {
      if (!state.financialAnalysis) {
        // Create new financial analysis with defaults
        const now = new Date().toISOString();
        const newAnalysis: FinancialAnalysis = {
          landCost: updates.landCost ?? 0,
          amenitiesCost: updates.amenitiesCost ?? 0,
          legalCosts: updates.legalCosts ?? 0,
          otherCosts: updates.otherCosts ?? [],
          totalProjectCost: 0,
          costPerSqm: 0,
          baseCostPerLot: 0,
          pricingScenarios: updates.pricingScenarios ?? [],
          totalMonthlyMaintenance: updates.totalMonthlyMaintenance ?? 0,
          monthlyMaintenancePerOwner: updates.monthlyMaintenancePerOwner ?? 0,
          currency: updates.currency ?? 'USD',
          exchangeRate: updates.exchangeRate ?? 58.5,  // Default DOP/USD rate
          calculatedAt: now,
          lastUpdatedAt: now,
        };
        return { financialAnalysis: newAnalysis };
      }

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          ...updates,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  clearFinancialAnalysis: () => {
    set({ financialAnalysis: null });
  },

  addOtherCost: (cost) => {
    set((state) => {
      if (!state.financialAnalysis) return state;

      const newCost: OtherCost = {
        ...cost,
        id: generateId(),
      };

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          otherCosts: [...state.financialAnalysis.otherCosts, newCost],
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  updateOtherCost: (costId, updates) => {
    set((state) => {
      if (!state.financialAnalysis) return state;

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          otherCosts: state.financialAnalysis.otherCosts.map(cost =>
            cost.id === costId ? { ...cost, ...updates } : cost
          ),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  removeOtherCost: (costId) => {
    set((state) => {
      if (!state.financialAnalysis) return state;

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          otherCosts: state.financialAnalysis.otherCosts.filter(cost => cost.id !== costId),
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setTargetProfitMargins: (margins) => {
    set({ targetProfitMargins: margins });
  },

  addTargetProfitMargin: (margin) => {
    set((state) => {
      if (state.targetProfitMargins.includes(margin)) {
        return state; // Already exists
      }

      return {
        targetProfitMargins: [...state.targetProfitMargins, margin].sort((a, b) => a - b),
      };
    });
  },

  removeTargetProfitMargin: (margin) => {
    set((state) => ({
      targetProfitMargins: state.targetProfitMargins.filter(m => m !== margin),
    }));
  },

  setCurrency: (currency) => {
    set((state) => {
      if (!state.financialAnalysis) return state;

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          currency,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setExchangeRate: (rate) => {
    set((state) => {
      if (!state.financialAnalysis) return state;

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          exchangeRate: rate,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setTotalMonthlyMaintenance: (amount) => {
    set((state) => {
      if (!state.financialAnalysis) return state;

      return {
        financialAnalysis: {
          ...state.financialAnalysis,
          totalMonthlyMaintenance: amount,
          lastUpdatedAt: new Date().toISOString(),
        },
      };
    });
  },

  setAIDescription: (description) => {
    set({ aiDescription: description });
  },

  clearAIDescription: () => {
    set({ aiDescription: null });
  },
});
