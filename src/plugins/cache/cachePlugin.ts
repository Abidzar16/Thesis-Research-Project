import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLResponse,
  HeaderMap
} from '@apollo/server';

import * as dotenv from "dotenv";
import { Context } from "../../context";
import { cacheTriggers, mutationTriggers } from './triggers';
import { getCacheWithNamespace, setCacheWithNamespaceAndExpire, deleteCacheByNamespace, fetchArguments } from "../../utils/cache";

dotenv.config();

export class CustomCachePlugin implements ApolloServerPlugin<Context> {
  public serverWillStart(): any {
    console.info('Starting up server')
  }

  public async requestDidStart(requestContext: GraphQLRequestContext<Context>): Promise<any> {
    var fetchFromCache : Boolean = false;
    var singleResultCache : boolean = false;
    var argument_list : { [key: string]: any } = {};

    return {

      // Get Cached Response
      async responseForOperation(requestContext: GraphQLRequestContext<Context>): Promise<GraphQLResponse | null> {
        const { request, document } = requestContext
        
        if (request.operationName != "IntrospectionQuery"){
          const firstDefinition : any = document?.definitions[0] || {};
          const resolver = firstDefinition?.selectionSet.selections[0].name.value || {};
          const { query, variables } = request;
          // var singleResultCache : boolean = false;

          if (typeof document !== 'undefined' && typeof variables !== 'undefined') {
            argument_list = fetchArguments(document, variables) || {};
          }
          
          for (const trigger of cacheTriggers) {
            if (trigger.query === resolver) {

              // Check if single-result query case
              if ("uniqueIdentifier" in trigger) {
                if (Object.keys(argument_list).includes(trigger.uniqueIdentifier as string)) {
                  singleResultCache = true;
                } else {
                  // if uniqueIdentifier is not found args, it will not fetching cache
                  return null
                }
              }

              var data: any = {};
              const querykey = JSON.stringify({ query, variables });
              if (singleResultCache){
                const id = argument_list[trigger.uniqueIdentifier as string];
                data = await getCacheWithNamespace(querykey, trigger.namespaceUsed, id);
              } else {
                data = await getCacheWithNamespace(querykey, trigger.namespaceUsed);
              }
              
              if (data){
                fetchFromCache = true
                const headers = new HeaderMap()
                headers.set('fetchFromCache', 'true')
                
                return {
                  body: { kind: 'single', singleResult: { data } },
                  http: {
                    status: undefined,
                    headers: headers,
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
          for (const trigger of cacheTriggers) {
            if (trigger.query === resolver) {

              // Handling single-result query case
              if ("uniqueIdentifier" in trigger) {
                if (Object.keys(argument_list).includes(trigger.uniqueIdentifier as string)) {
                  singleResultCache = true;
                } else {
                  // if uniqueIdentifier is not found args, it will not set cache
                  return
                }
              }

              const query = request.query;
              const variables = request.variables || {};
              const key = `${JSON.stringify({query,variables})}`;
              var data : any = null

              if (response?.body?.kind === 'single' && 'data' in response.body.singleResult) {
                  data = await response.body.singleResult.data
                if (singleResultCache){
                  const id = argument_list[trigger.uniqueIdentifier as string];
                  await setCacheWithNamespaceAndExpire(key, data, trigger.namespaceUsed, trigger.ttl, id)
                } else {
                  await setCacheWithNamespaceAndExpire(key, data, trigger.namespaceUsed, trigger.ttl)
                }
                return
              }
              return
            }
          }

          return
        }

        // Invalidate Cached Response
        if (operationType === "mutation") {
          for (const trigger of mutationTriggers) {
            if (trigger.mutation.includes(resolver)) {
              
              for (let namespace in trigger.affectedNamespace) {
                const namespace_id = trigger.affectedNamespace[namespace]
                if (trigger.affectedNamespace.hasOwnProperty(namespace) && namespace_id.hasOwnProperty("uniqueIdentifier")) {
                  await deleteCacheByNamespace(namespace, argument_list[namespace_id.uniqueIdentifier as string]);
                } else {
                  await deleteCacheByNamespace(namespace);
                }
              }
              
              return
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