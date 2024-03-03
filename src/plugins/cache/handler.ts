import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLResponse,
  HeaderMap
} from '@apollo/server';

import * as dotenv from "dotenv";
import { DocumentNode, visit } from 'graphql';
import { Context } from "../../context";
import { Configuration, rules } from './configuration';
import { deleteCacheByNamespace, getCacheWithNamespace, setCacheWithNamespaceAndExpire } from "./utility";

dotenv.config();

function fetchArguments(
  document: DocumentNode,
  variables: { [key: string]: any }
): { [key: string]: any } {
  
  const args: { [key: string]: any } = {};
  visit(document, {
    Argument(node) {
      const name = node.name.value;

      if (node.value.kind === 'Variable'){
        args[name] = variables[node.value.name.value];
      } else if (node.value.kind === 'NullValue') {
        args[name] = null;
      } else if (node.value.kind === 'ListValue') {
        args[name] = node.value.values;
      } else if (node.value.kind === 'ObjectValue') {
        args[name] = node.value.fields;
      } else if (node.value.kind === 'IntValue') {
        args[name] = parseInt(node.value.value);
      } else if (node.value.kind === 'FloatValue') {
        args[name] = parseFloat(node.value.value);
      } else {
        args[name] = node.value.value;
      }
    },
  });
  return args;
}

export class CustomCachePlugin implements ApolloServerPlugin<Context> {
  public serverWillStart(): any {
    console.info('Starting up server')
  }

  public async requestDidStart(requestContext: GraphQLRequestContext<Context>): Promise<any> {
    var fetchFromCache : boolean = false;
    var singleResultCache : boolean = false;
    var argumentList : { [key: string]: any } = {};

    return {

      async responseForOperation(requestContext: GraphQLRequestContext<Context>): Promise<GraphQLResponse | null> {
        const { request, document } = requestContext
        const firstDefinition : any = document?.definitions[0] || {} // Assuming you want the first element
        const operationType = firstDefinition?.operation || ""
        const variables = request.variables;

        if (typeof document !== 'undefined' && typeof variables !== 'undefined') {
          argumentList = fetchArguments(document, variables) || {};
        }
        
        // Check if request operation type query but not IntrospectionQuery
        if (request.operationName != "IntrospectionQuery" && operationType === "query"){
          const firstDefinition : any = document?.definitions[0] || {};
          const resolver = firstDefinition?.selectionSet.selections[0].name.value || {};
          const selectedTrigger = rules[resolver as string] || null;
          const uniqueIdentifier = selectedTrigger.uniqueIdentifier || undefined;

          if (uniqueIdentifier) {
            if (Object.keys(argumentList).includes(uniqueIdentifier as string)) {
              singleResultCache = true;
            } else {
              return null
            }
          }

          // Cache get operation
          if (selectedTrigger) {
            const query = request.query;

            // Check if single-result query case
            if (uniqueIdentifier) {
              if (Object.keys(argumentList).includes(uniqueIdentifier as string)) {
                singleResultCache = true;
              } else {
                // if uniqueIdentifier is not found args, it will not fetching cache
                return null
              }
            }

            var data: any = {};
            const querykey = JSON.stringify({ query, variables });
            if (singleResultCache){
              const id = argumentList[uniqueIdentifier as string];
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

        if (requestContext.errors) {
          return
        }

        if (request.operationName != "IntrospectionQuery"){
          const firstDefinition : any = document?.definitions[0] || {} // Assuming you want the first element
          operationType = firstDefinition?.operation || ""
          resolver = firstDefinition?.selectionSet.selections[0].name.value || {}
        } else {
          return
        }

        if (response?.body?.kind === 'single' && 'data' in response.body.singleResult) {
          var data = await response.body.singleResult.data
          if (data === null || data === undefined) {
            return
          }
        }

        // Cache set operation
        if (operationType === "query" && !fetchFromCache) {
          const selectedTrigger: Configuration = rules[resolver as string] || null;
          
          if (selectedTrigger) {
            const {query, variables} = request;
            const key = `${JSON.stringify({query, variables})}`;
            const uniqueIdentifier = selectedTrigger.uniqueIdentifier || null;
            const timeToLive = selectedTrigger.timeToLive || undefined;
            if (singleResultCache){
              const id = argumentList[uniqueIdentifier as string];
              await setCacheWithNamespaceAndExpire(key, data, resolver as string, timeToLive, id)
            } else {
              await setCacheWithNamespaceAndExpire(key, data, resolver as string, timeToLive)
            }
            return

          }
        }

        // Cache invalidation operation
        if (operationType === "mutation") {

          for (const queryKey in rules) {
            const mutationInvalidator: { [key: string]: String | null } = rules[queryKey].mutation || {};
            const argument = mutationInvalidator[resolver as string];
            console.info(queryKey, argument, resolver, mutationInvalidator);
            if (argument) {
              await deleteCacheByNamespace(queryKey, argumentList[argument as string]);
            } else {
              if (resolver as string in mutationInvalidator) {
                await deleteCacheByNamespace(queryKey);
              }
            }
          }
          return
        }
        return
      },
    }
  }
}
