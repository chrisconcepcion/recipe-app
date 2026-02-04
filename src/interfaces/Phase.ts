import { Ingredient } from './Ingredient';

export interface Phase {
  id: string;
  name: string;
  instructions: string;
  ingredientIds: string[];
  ingredients: Ingredient[];
  photoUris: string[];
}

// Helper function to calculate the total quantity of an ingredient in a phase
export const getTotalQuantity = (phase: Phase, ingredientId: string): number | undefined => {
  const ingredientIndex = phase.ingredientIds.indexOf(ingredientId);
  if (ingredientIndex !== -1) {
    const ingredient = phase.ingredients[ingredientIndex];
    return ingredient.quantity as number;
  }
  return undefined;
};

export const getIngredientInPhaseById = (
  phase: Phase,
  ingredientId: string
): Ingredient | undefined => {
  const ingredientIndex = phase.ingredientIds.indexOf(ingredientId);
  if (ingredientIndex !== -1) {
    return phase.ingredients[ingredientIndex];
  }
  return undefined;
};