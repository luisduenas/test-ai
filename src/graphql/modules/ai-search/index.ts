import { createModule } from "@composabase/sdk"

const aiSearch = () => {
  const module = createModule('ai-search')
  
  // --- textToQuery: remove once naturalLanguageQuery it's copleted ---
  module.type('TextToQueryResponse', {
    fields: {
      query: module.string(),
      variables: module.scalar("JSON"),
      data: module.scalar("JSON"),
    }
  })

  module.query('textToQuery', {
    definition: {
      type: module.scalar("TextToQueryResponse"),
      args: {
        text: module.string(),
      },
    },
    resolver: 'textToQuery',
  })
  // --- textToQuery: remove once naturalLanguageQuery it's copleted ---

  module.type('NaturalLanguageQueryResponse', {
    fields: {
      query: module.string(),
      variables: module.scalar("JSON"),
      data: module.scalar("JSON"),
    }
  })

  module.query('naturalLanguageQuery', {
    definition: {
      type: module.scalar("NaturalLanguageQueryResponse"),
      args: {
        plainText: module.string(),
      },
    },
    resolver: 'naturalLanguageQuery',
  })


  module.query('vectorSearch', {
    definition: {
      type: module.list(module.scalar('contentful_Post')),
      args: {
        query: module.string(),
      },
    },
    resolver: 'vectorSearch',
  })

  return module
}

export default aiSearch()
