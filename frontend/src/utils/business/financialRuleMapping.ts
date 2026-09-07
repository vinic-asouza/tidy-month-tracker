/**
 * Helpers puros do mapeamento de categorias da Regra Financeira.
 * A chave do mapeamento é o próprio nome da categoria de gasto.
 */

export type CategoryBucket = 'essentials' | 'lifestyle';
export type CategoryMapping = Record<string, CategoryBucket>;

/**
 * Renomeia a chave da categoria preservando o bucket e a posição.
 * Retorna `null` quando não há nada a alterar (categoria não mapeada ou mesmo nome).
 */
export function renameCategoryInMapping(
  mapping: CategoryMapping,
  oldCategory: string,
  newCategory: string
): CategoryMapping | null {
  if (oldCategory === newCategory) return null;
  if (mapping[oldCategory] == null) return null;

  const next: CategoryMapping = {};
  for (const [category, bucket] of Object.entries(mapping)) {
    next[category === oldCategory ? newCategory : category] = bucket;
  }
  return next;
}

/** Remove do mapeamento as categorias que não existem mais nas configurações. */
export function mergeMappingWithCategories(
  mapping: CategoryMapping,
  categories: string[]
): CategoryMapping {
  const merged: CategoryMapping = {};
  for (const category of categories) {
    const bucket = mapping[category];
    if (bucket != null) merged[category] = bucket;
  }
  return merged;
}

/** Categorias em uso que ainda não têm bucket definido. */
export function getUnmappedCategories(
  mapping: CategoryMapping,
  categories: string[]
): string[] {
  return categories.filter((category) => mapping[category] == null);
}
