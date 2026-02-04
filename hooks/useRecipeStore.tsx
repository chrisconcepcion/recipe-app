import { createContext, useContext, useEffect, useReducer, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { GoogleDriveService } from '@/services/googleDrive';
import { Recipe } from '@/src/interfaces/Recipe';

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Pasta Carbonara',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
    description: 'Classic Italian pasta dish with eggs, cheese, pancetta, and pepper.',
    ingredients: [
      { id: '1', name: 'Spaghetti', quantity: 400, unit: 'g' },
      { id: '2', name: 'Pancetta', quantity: 150, unit: 'g' },
      { id: '3', name: 'Eggs', quantity: 4, unit: 'large' },
      { id: '4', name: 'Pecorino Romano', quantity: 100, unit: 'g' },
      { id: '5', name: 'Black Pepper', quantity: 1, unit: 'tbsp' }
    ],
    phases: [
      {
        id: '1',
        name: 'Prep',
        instructions: 'Boil water, grate cheese, and fry pancetta.',
        ingredientIds: ['1', '2', '4'],
        ingredients: [],
        photoUris: []
      },
      {
        id: '2',
        name: 'Combine',
        instructions: 'Mix eggs and cheese. Toss hot pasta with pancetta, then mix in egg mixture off heat.',
        ingredientIds: ['3', '5'],
        ingredients: [],
        photoUris: []
      }
    ]
  },
  {
    id: '2',
    title: 'Chicken Curry',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    description: 'Spicy and savory chicken curry with coconut milk.',
    ingredients: [
      { id: '1', name: 'Chicken Breast', quantity: 500, unit: 'g' },
      { id: '2', name: 'Coconut Milk', quantity: 400, unit: 'ml' },
      { id: '3', name: 'Curry Powder', quantity: 2, unit: 'tbsp' }
    ],
    phases: []
  },
  {
    id: '3',
    title: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&w=800&q=80',
    description: 'Healthy breakfast option with toasted bread and fresh avocado.',
    ingredients: [],
    phases: []
  },
];

interface State {
  recipes: Recipe[];
}

const initialState: State = {
  recipes: [],
};

type Action =
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'EDIT_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'ADD_RECIPE':
      return {
        ...state,
        recipes: [...state.recipes, action.payload],
      };
    case 'EDIT_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map((recipe) =>
          recipe.id === action.payload.id ? action.payload : recipe
        ),
      };
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter((recipe) => recipe.id !== action.payload),
      };
    default:
      return state;
  }
};

const RecipeStoreContext = createContext<[State, React.Dispatch<Action>]>([
  initialState,
  () => { },
]);

export const useRecipeStore = () => {
  const [state, dispatch] = useContext(RecipeStoreContext);
  const { accessToken } = useAuth();

  // Helper to handle all image uploads for a recipe
  const processRecipeImages = async (recipe: Recipe): Promise<Recipe> => {
    if (!accessToken) return recipe;

    let updatedRecipe = { ...recipe };

    // 1. Upload Main Image
    if (updatedRecipe.image && !updatedRecipe.image.startsWith('http')) {
      // If it's already a drive ID, skip. If it's a local URI, upload.
      if (!updatedRecipe.image.startsWith('google-drive-id:')) {
        const fileId = await GoogleDriveService.uploadImage(accessToken, updatedRecipe.image);
        if (fileId) {
          updatedRecipe.image = `google-drive-id:${fileId}`;
        }
      }
    }

    // 2. Upload Phase Images
    if (updatedRecipe.phases) {
      const updatedPhases = await Promise.all(updatedRecipe.phases.map(async (phase) => {
        if (phase.photoUris && phase.photoUris.length > 0) {
          const newUris = await Promise.all(phase.photoUris.map(async (uri) => {
            if (!uri.startsWith('http') && !uri.startsWith('google-drive-id:')) {
              const fileId = await GoogleDriveService.uploadImage(accessToken, uri);
              return fileId ? `google-drive-id:${fileId}` : uri;
            }
            return uri;
          }));
          return { ...phase, photoUris: newUris };
        }
        return phase;
      }));
      updatedRecipe.phases = updatedPhases;
    }

    return updatedRecipe;
  };

  const addRecipe = async (recipe: Recipe) => {
    // Intercept to upload photos to Drive
    const updatedRecipe = await processRecipeImages(recipe);
    dispatch({ type: 'ADD_RECIPE', payload: updatedRecipe });
  };

  const editRecipe = async (recipe: Recipe) => {
    // Also upload photos on edit!
    const updatedRecipe = await processRecipeImages(recipe);
    dispatch({ type: 'EDIT_RECIPE', payload: updatedRecipe });
  };

  const deleteRecipe = (id: string) => dispatch({ type: 'DELETE_RECIPE', payload: id });
  const setRecipes = (recipes: Recipe[]) => dispatch({ type: 'SET_RECIPES', payload: recipes });

  return { state, addRecipe, editRecipe, deleteRecipe, setRecipes };
};

export const RecipeStoreProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, accessToken } = useAuth();
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync Logic
  useEffect(() => {
    const initDriveSync = async () => {
      if (!accessToken) return;

      // 1. Find or Create config file
      let fileId = await GoogleDriveService.findComponentsFile(accessToken);
      if (!fileId) {
        console.log("No recipes file found, creating...");
        fileId = await GoogleDriveService.createFile(accessToken);
      }

      if (fileId) {
        setDriveFileId(fileId);
        console.log("Syncing with Drive File:", fileId);
        // 2. Load Data
        const data = await GoogleDriveService.downloadData(accessToken, fileId);
        if (Array.isArray(data)) {
          dispatch({ type: 'SET_RECIPES', payload: data });
        }
        setIsInitialized(true); // Mark as ready to save changes
      }
    };

    initDriveSync();
  }, [accessToken]);

  // Persist to Drive on Change
  useEffect(() => {
    const syncToDrive = async () => {
      if (!accessToken || !driveFileId || !isInitialized) return;

      // Debounce? For now just save.
      console.log("Saving to Drive (Debounced)...");
      await GoogleDriveService.updateData(accessToken, driveFileId, state.recipes);
    };

    // Only set timeout if initialized
    if (isInitialized && driveFileId) {
      const timeout = setTimeout(syncToDrive, 2000); // 2s debounce
      return () => clearTimeout(timeout);
    }
  }, [state.recipes, accessToken, driveFileId, isInitialized]);

  return (
    <RecipeStoreContext.Provider value={[state, dispatch]}>
      {children}
    </RecipeStoreContext.Provider>
  );
};