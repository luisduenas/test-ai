import { createModule } from "@composabase/sdk"

const aiSdk = () => {
  const module = createModule('ai-sdk')
  
  module.enum('AIProvider', ['openai', 'anthropic'])
  module.enum('HolidayType', ['casual', 'geek', 'scifi'])

  module.query('holiday', {
    definition: {
      type: module.string(),
      args: {
        provider: module.enum('AIProvider'),
        model: module.string(),
        type: module.enum('HolidayType').optional(),
      },
    },
    resolver: 'holiday',
  })

  module.type('FoodRecipeIngredient', {
    fields: {
      name: module.string(),
      amount: module.string(),
    }
  })

  module.type('FoodRecipeSuggestion', {
    fields: {
      starter: module.string(),
      drink: module.string(),
      dessert: module.string(),
    }
  })

  module.type('FoodRecipe', {
    fields: {
      description: module.string(),
      ingredients: module.list(module.scalar('FoodRecipeIngredient')),
      steps: module.list(module.string()),
      suggestion: module.scalar('FoodRecipeSuggestion'),
      image: module.string().optional(),
    }
  })

  module.query('foodRecipe', {
    definition: {
      type: module.scalar('FoodRecipe'),
      args: {
        dish: module.string().optional(),
        maxIngredients: module.int().optional(),
        showImage: module.boolean().optional(),
      },
    },
    resolver: 'foodRecipe',
  })

  module.type('EnrichedSearch', {
    fields: {
      title: module.string().optional(),
      summary: module.string().optional(),
      originCountry: module.string().optional(),
      price: module.int().optional(),
      ingredients: module.list(module.string()).optional(),
    }
  })

  module.query('aiEnrichedSearch', {
    definition: {
      type: module.list(module.scalar('EnrichedSearch')),
      args: {
        term: module.string(),
      },
    },
    resolver: 'aiEnrichedSearch',
  })

  return module
}

export default aiSdk()
