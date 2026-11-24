# Family Recipes

Our recipe box, published with GitHub Pages at https://jacenmiller-lab.github.io/recipes/

## Adding a recipe

Make a new file in `_recipes/`, named like `chicken-tacos.md` (lowercase, dashes). The file name becomes the page address. Copy this template:

```markdown
---
title: Chicken Tacos
tags: [dinner, weeknight]
makes: { qty: 4, unit: serving }   # what the amounts below make
usually_make: 4                    # what the page opens at
prep_time: 15 min
cook_time: 20 min
total_time: 35 min
source: Family recipe
equipment: [large skillet]
ingredients:
  - { qty: 1.5, unit: lb,   item: chicken thighs }
  - { qty: 1,   unit: "",   item: onion, note: diced }
  - { qty: 2-3, unit: clove, item: garlic, note: minced }
  - { qty: 1/2, unit: cup,  item: salsa }
  - { qty: "",  unit: "",   item: salt, note: to taste, pantry: true }
---

# Chicken Tacos

## Instructions

1. First step.
2. Second step.

## Notes

- Anything worth remembering.
```

### Ingredient fields

- **qty**: a number (`2`, `0.5`), a fraction (`1/2`, `1 1/2`), a range (`2-3`), or `""` for "to taste".
- **unit**: `tsp`, `tbsp`, `cup`, `oz`, `lb`, `can`, `clove`, `jar`, `package`… Use `""` for things you count (eggs, onions).
- **note**: optional extra detail shown after the item.
- **pantry: true**: staples that usually stay off the grocery list. Items listed under `pantry:` in `_config.yml` are treated as pantry on every recipe automatically.

### Scaling rules on the site

- Teaspoons, tablespoons and cups convert to the easiest measure (12 tbsp shows as ¾ cup).
- Cans, cloves and counted items round up to whole numbers.
- "To taste" items never scale. Cook times don't change.

### Recipes with parts (filling, topping…)

Use `sections` in place of `ingredients`, each with a `name` and its own `ingredients` (see `_recipes/crock-pot-apple-crisp.md`). All sections show at once under subheadings.

### Recipes with versions

Use `variations` in place of `ingredients` (see `_recipes/chaffles.md`). Each version gets its own tab.

## Changing the site name

Edit `title` in `_config.yml`.
