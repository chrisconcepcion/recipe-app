import { RecipeCard } from '@/src/components/RecipeCard';
import { Recipe } from '@/src/interfaces/Recipe';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  recipeList: Recipe[];
  onRecipePress?: (recipeId: string) => void;
}

export default function RecipeList({ recipeList, onRecipePress }: Props) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FlatList
        data={recipeList}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: item.id } })}>
            <RecipeCard recipe={item} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
});
