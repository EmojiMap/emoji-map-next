import { CATEGORY_MAP, EMOJI_OVERRIDES } from '@/constants/category-map';

export function getEmojiForTypes(
  name: string,
  types: string[],
  typeRestriction: number[]
): string {
  const typesToEvaluate = typeRestriction.length
    ? CATEGORY_MAP.filter((cat) => typeRestriction.includes(cat.key))
    : CATEGORY_MAP;

  if (EMOJI_OVERRIDES[name.toLocaleLowerCase()])
    return EMOJI_OVERRIDES[name.toLocaleLowerCase()];

  for (const type of types) {
    const matchedCategory = typesToEvaluate.find((cat) =>
      cat.primaryType.includes(type)
    );

    if (matchedCategory) return matchedCategory.emoji;
  }

  return '😶‍🌫️';
}
