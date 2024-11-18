import { schema } from "@composabase/sdk"

import helloCustom from './modules/hello-custom'
import aiSdk from './modules/ai-sdk'

schema.query('hello', {
  definition: {
    type: schema.string(),
    args: {
      name: schema.string().optional(),
      isImportant: schema.boolean().optional(),
    },
  },
  resolver: 'hello',
})

schema.modules([
  helloCustom,
  aiSdk,
])

export default schema
