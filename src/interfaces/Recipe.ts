import { Ingredient } from './Ingredient';
import { Phase } from './Phase';

export interface Recipe {
  id: string;
  title: string;
  image: string;
  description: string;
  ingredients: Ingredient[];
  phases: Phase[];
  deleted?: boolean;
  sourceUrl?: string;
  calories?: string;
  servingSize?: string;
}