import { GraphQLSchema } from 'graphql'
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContext,
  GraphQLRequestExecutionListener,
  GraphQLRequestListener,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequestListenerValidationDidEnd,
  GraphQLResponse
} from '@apollo/server'

import { Context } from "../context";
import Keyv from 'keyv';

interface Trigger {
  query: String;
  mutation: String[];
  namespaceUsed: String;
  namespaceRelevant?: String[];
  ttl: Number;
}

const triggers : Trigger[] = [
  {
    query: "feed",
    mutation: ["post","vote"],
    namespaceUsed: "feed",
    ttl: 60
  }
]

export class CustomCachePlugin implements ApolloServerPlugin<Context> {
  public serverWillStart(): any {
    console.info('- Inside serverWillStart')
    const keyv = new Keyv('redis://user:pass@localhost:6379');
  }

  public async requestDidStart(requestContext: GraphQLRequestContext<Context>): Promise<any> {
    const start = Date.now()
    let variables: any = null

    // Cache Get (if exists)
    for (const trigger of triggers) {
      if (trigger.query === requestContext.request.operationName) {
        
      }
    }
    return {
      didResolveOperation: (): Promise<void> | any => {
        console.info('- Inside didResolveOperation')
      },
      async willSendResponse(requestContext: GraphQLRequestContext<Context>) : Promise<any> {
        const { response } = requestContext
        const stop = Date.now()
        const elapsed = stop - start
        const size = JSON.stringify(requestContext.response).length * 2
        var data : any = null
        if (response?.body?.kind === 'single' && 'data' in response.body.singleResult) {
          data = response.body.singleResult.data
        }
        console.info(
          ` operation=${requestContext.operationName},
            duration=${elapsed}ms,
            bytes=${size},
            query=${requestContext.request.query}
            variables:${JSON.stringify(variables)},
            user=${JSON.stringify(requestContext.contextValue.userId)}
            responseData=${JSON.stringify(data)},
          `
        )
      },
      didEncounterErrors(requestContext: GraphQLRequestContext<Context>) {}
    }
  }

  /**
   * Request Lifecycle Handlers
   */

  public parsingDidStart(requestContext: GraphQLRequestContext<Context>): Promise<GraphQLRequestListenerParsingDidEnd | void> | any {
    console.info('- Inside parsingDidStart', JSON.stringify(requestContext))
  }

  public validationDidStart(
    requestContext: GraphQLRequestContext<Context>
  ): Promise<GraphQLRequestListenerValidationDidEnd | void> | any {
    console.info('- Inside validationDidStart', JSON.stringify(requestContext))
  }

  public didResolveOperation(requestContext: GraphQLRequestContext<Context>): Promise<void> | any {
    console.info('- Inside didResolveOperation', JSON.stringify(requestContext))
  }

  public responseForOperation(requestContext: GraphQLRequestContext<Context>): GraphQLResponse | any {
    console.info('- Inside responseForOperation', JSON.stringify(requestContext))
    return null
  }

  public executionDidStart(requestContext: GraphQLRequestContext<Context>): Promise<GraphQLRequestExecutionListener<Context> | any> {
    console.info('- Inside executionDidStart', JSON.stringify(requestContext))
    return Promise.resolve(null)
  }

  public didEncounterErrors(requestContext: GraphQLRequestContext<Context>): Promise<void> | any {
    console.info('- Inside didEncounterErrors', JSON.stringify(requestContext))
    return Promise.resolve()
  }

  public willSendResponse(requestContext: GraphQLRequestContext<Context>): Promise<void> | any {
    console.info('- Inside willSendResponse', JSON.stringify(requestContext))
  }
}