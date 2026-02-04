import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Recipe } from '../interfaces/Recipe';

const RecipeDetail = ({ navigation }: any) => {
  const [recipe, setRecipe] = useState<Recipe>();
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  useEffect(() => {
    // Fetch the recipe from the store or use an initial value
    const initialRecipe: Recipe = {
      id: '1',
      title: 'Sample Recipe',
      image: '',
      description: '',
      ingredients: [],
      phases: []
    };
    setRecipe(initialRecipe);
  }, []);

  const nextPhaseHandler = () => {
    if (currentPhaseIndex < (recipe?.phases?.length || 0) - 1) {
      setCurrentPhaseIndex(currentPhaseIndex + 1);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {recipe && recipe.phases && (
        <>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.phases.map((phase, index) => (
            <View key={index} style={styles.phaseContainer}>
              <Text style={styles.phaseTitle}>{`${index + 1}. ${phase.name}`}</Text>
              <ScrollView horizontal contentContainerStyle={styles.ingredientsContainer}>
                {phase.ingredientIds.map((ingredientId) => {
                  const ingredient = recipe?.ingredients.find(
                    (ingredient) => ingredient.id === ingredientId
                  );
                  return (
                    <TouchableOpacity key={ingredientId} onPress={() => navigation.navigate('RecipeDetail')}>
                      <View style={styles.ingredientContainer}>
                        <Text>{ingredient?.name}</Text>
                        {/* Add logic to display photo */}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = (StyleSheet as any).create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  phaseContainer: {
    marginBottom: 24,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  ingredientsContainer: {
    paddingVertical: 8,
  },
  ingredientContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
});

export default RecipeDetail;