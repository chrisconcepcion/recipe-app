import { Ingredient } from './Ingredient';
import { Phase } from './Phase';

export interface Recipe {
  id: string;
  title: string;
  image: string;
  description: string;
  ingredients: Ingredient[];
  phases: Phase[];
}