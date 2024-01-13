import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLResponse,
  HeaderMap
} from '@apollo/server';

import * as dotenv from "dotenv";
import { Context } from "../../context";
import { triggers } from './triggers';
import { getCacheWithNamespace, setCacheWithNamespaceAndExpire, deleteCacheByNamespace } from "../../utils/cache";

dotenv.config();

export class CustomCachePlugin implements ApolloServerPlugin<Context> {
  public serverWillStart(): any {
    console.info('Starting up server')
  }

  public async requestDidStart(requestContext: GraphQLRequestContext<Context>): Promise<any> {
    var fetchFromCache : Boolean = false;
    return {

      // Get Cached Response
      async responseForOperation(requestContext: GraphQLRequestContext<Context>): Promise<GraphQLResponse | null> {
        const { request, document } = requestContext
        
        if (request.operationName != "IntrospectionQuery"){
          const firstDefinition : any = document?.definitions[0] || {} // Assuming you want the first element
          const resolver = firstDefinition?.selectionSet.selections[0].name.value || {}

          for (const trigger of triggers) {
            if (trigger.query === resolver) {
              const {query, variables} = request;
              var data : any = {};
              const key = JSON.stringify({query,variables})
              
              data = await getCacheWithNamespace(key, trigger.namespaceUsed)
              
              if (data){
                fetchFromCache = true
                return {
                  body: { kind: 'single', singleResult: { data } },
                  http: {
                    status: undefined,
                    headers: new HeaderMap(),
                  },
                }
              }
              return null
            }
          }
        }
        return null
      },

      async willSendResponse(requestContext: GraphQLRequestContext<Context>) {
        const { request, response, document } = requestContext
        var resolver: String = "";
        var operationType: String = "";

        if (request.operationName != "IntrospectionQuery"){
          const firstDefinition : any = document?.definitions[0] || {} // Assuming you want the first element
          operationType = firstDefinition?.operation || ""

          resolver = firstDefinition?.selectionSet.selections[0].name.value || {}
        } else {
          return
        }
        
        // Set Cached Response
        if (resolver != "" && !fetchFromCache && operationType === "query") {
          for (const trigger of triggers) {
            if (trigger.query === resolver) {
              const query = request.query;
              const variables = request.variables || {};
              const key = `${JSON.stringify({query,variables})}`;
              var data : any = null

              if (response?.body?.kind === 'single' && 'data' in response.body.singleResult) {
                data = await response.body.singleResult.data
                await setCacheWithNamespaceAndExpire(key, data, trigger.namespaceUsed, trigger.ttl)
                return
              }
              return
            }
          }

          return
        }

        // Invalidate Cached Response
        if (operationType === "mutation") {
          for (const trigger of triggers) {
            if (trigger.mutation.includes(resolver)) {
              trigger.namespaceRelevant?.forEach(async (namespace) => await deleteCacheByNamespace(namespace));
              await deleteCacheByNamespace(trigger.namespaceUsed)
            }
          }
          return
        }
        return
      },

      didEncounterErrors(requestContext: GraphQLRequestContext<Context>) {
        console.info(requestContext.errors)
      }
    }
  }
}