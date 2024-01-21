import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLResponse,
  HeaderMap
} from '@apollo/server';

import * as dotenv from "dotenv";
import { Context } from "../../context";
import { triggers } from './triggers';
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
        const firstDefinition : any = document?.definitions[0] || {} // Assuming you want the first element
        const operationType = firstDefinition?.operation || ""
        
        if (request.operationName != "IntrospectionQuery" && operationType === "query"){
          const firstDefinition : any = document?.definitions[0] || {};
          const resolver = firstDefinition?.selectionSet.selections[0].name.value || {};
          const { query, variables } = request;
          // var singleResultCache : boolean = false;
          const selectedTrigger = triggers[resolver as string] || null;
          const uniqueIdentifier = selectedTrigger.uniqueIdentifier || undefined;

          if (typeof document !== 'undefined' && typeof variables !== 'undefined') {
            argument_list = fetchArguments(document, variables) || {};
          }

          if (uniqueIdentifier) {
            if (Object.keys(argument_list).includes(selectedTrigger.uniqueIdentifier as string)) {
              singleResultCache = true;
            } else {
              // if uniqueIdentifier is not found args, it will not fetching cache
              return null
            }
          }

          // Cache get operation
          if (selectedTrigger) {
            const query = request.query;
            const variables = request.variables || {}
            const uniqueIdentifier = selectedTrigger.uniqueIdentifier || undefined;

            // Check if single-result query case
            if (uniqueIdentifier) {
              if (Object.keys(argument_list).includes(selectedTrigger.uniqueIdentifier as string)) {
                singleResultCache = true;
              } else {
                // if uniqueIdentifier is not found args, it will not fetching cache
                return null
              }
            }

            var data: any = {};
            const querykey = JSON.stringify({ query, variables });
            if (singleResultCache){
              const id = argument_list[selectedTrigger.uniqueIdentifier as string];
              data = await getCacheWithNamespace(querykey, resolver, id);
            } else {
              data = await getCacheWithNamespace(querykey, resolver);
            }
            
            if (data){
              fetchFromCache = true
              const headers = new HeaderMap()
              headers.set('fetch-from-cache', 'true')
              
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

        // Cache set operation
        if (operationType === "query" && !fetchFromCache) {
          const selectedTrigger = triggers[resolver as string] || null;
          
          if (selectedTrigger) {
            const query = request.query;
            const variables = request.variables || {};
            const key = `${JSON.stringify({query,variables})}`;
            const uniqueIdentifier = selectedTrigger.uniqueIdentifier || null;
            const ttl = selectedTrigger.ttl || undefined;
            var data : any = null;

            if (response?.body?.kind === 'single' && 'data' in response.body.singleResult) {
              
              data = await response.body.singleResult.data
              if (singleResultCache){
                const id = argument_list[uniqueIdentifier as string];
                await setCacheWithNamespaceAndExpire(key, data, resolver as string, ttl, id)
              } else {
                await setCacheWithNamespaceAndExpire(key, data, resolver as string, ttl)
              }
              return
            }

            return
          }
        }

        // Cache invalidation operation
        if (operationType === "mutation") {
          for (const queryKey in triggers) {
            const mutationInvalidator: String[] = triggers[queryKey].mutation || [];

            if (mutationInvalidator.includes(resolver)) {
              const uniqueIdentifier = triggers[queryKey].uniqueIdentifier || null;
              if (uniqueIdentifier) {
                await deleteCacheByNamespace(queryKey, argument_list[uniqueIdentifier as string]);
              } else {
                await deleteCacheByNamespace(queryKey);
              }
            }
          }

          return
        }
        return
      },

      didEncounterErrors(requestContext: GraphQLRequestContext<Context>) {
        console.info(requestContext.errors)
        throw new Error('Encountered errors during request processing')
      }
    }
  }
}