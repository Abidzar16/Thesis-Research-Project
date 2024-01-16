// query ($linkId: Int!) {
//   link(id: $linkId) {
//     isDeleted
//   }
// }

const document = {
  "kind": "Document",
  "definitions": [
    {
      "kind": "OperationDefinition",
      "operation": "query",
      "variableDefinitions": [
        {
          "kind": "VariableDefinition",
          "variable": {
            "kind": "Variable",
            "name": {
              "kind": "Name",
              "value": "linkId",
              "loc": {
                "start": 8,
                "end": 14
              }
            },
            "loc": {
              "start": 7,
              "end": 14
            }
          },
          "type": {
            "kind": "NonNullType",
            "type": {
              "kind": "NamedType",
              "name": {
                "kind": "Name",
                "value": "Int",
                "loc": {
                  "start": 16,
                  "end": 19
                }
              },
              "loc": {
                "start": 16,
                "end": 19
              }
            },
            "loc": {
              "start": 16,
              "end": 20
            }
          },
          "directives": [],
          "loc": {
            "start": 7,
            "end": 20
          }
        }
      ],
      "directives": [],
      "selectionSet": {
        "kind": "SelectionSet",
        "selections": [
          {
            "kind": "Field",
            "name": {
              "kind": "Name",
              "value": "link",
              "loc": {
                "start": 27,
                "end": 31
              }
            },
            "arguments": [
              {
                "kind": "Argument",
                "name": {
                  "kind": "Name",
                  "value": "id",
                  "loc": {
                    "start": 32,
                    "end": 34
                  }
                },
                "value": {
                  "kind": "Variable",
                  "name": {
                    "kind": "Name",
                    "value": "linkId",
                    "loc": {
                      "start": 37,
                      "end": 43
                    }
                  },
                  "loc": {
                    "start": 36,
                    "end": 43
                  }
                },
                "loc": {
                  "start": 32,
                  "end": 43
                }
              }
            ],
            "directives": [],
            "selectionSet": {
              "kind": "SelectionSet",
              "selections": [
                {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "isDeleted",
                    "loc": {
                      "start": 52,
                      "end": 61
                    }
                  },
                  "arguments": [],
                  "directives": [],
                  "loc": {
                    "start": 52,
                    "end": 61
                  }
                }
              ],
              "loc": {
                "start": 45,
                "end": 66
              }
            },
            "loc": {
              "start": 27,
              "end": 66
            }
          }
        ],
        "loc": {
          "start": 22,
          "end": 69
        }
      },
      "loc": {
        "start": 0,
        "end": 69
      }
    }
  ],
  "loc": {
    "start": 0,
    "end": 69
  }
}

const variables = {
  "linkId": id
}