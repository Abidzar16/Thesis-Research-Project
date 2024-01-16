// query {
//   link(id: 1) {
//     isDeleted
//   }
// }

const document = {
  "kind": "Document",
  "definitions": [
    {
      "kind": "OperationDefinition",
      "operation": "query",
      "variableDefinitions": [],
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
                "start": 11,
                "end": 15
              }
            },
            "arguments": [
              {
                "kind": "Argument",
                "name": {
                  "kind": "Name",
                  "value": "id",
                  "loc": {
                    "start": 16,
                    "end": 18
                  }
                },
                "value": {
                  "kind": "IntValue",
                  "value": "1",
                  "loc": {
                    "start": 20,
                    "end": 21
                  }
                },
                "loc": {
                  "start": 16,
                  "end": 21
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
                      "start": 30,
                      "end": 39
                    }
                  },
                  "arguments": [],
                  "directives": [],
                  "loc": {
                    "start": 30,
                    "end": 39
                  }
                }
              ],
              "loc": {
                "start": 23,
                "end": 44
              }
            },
            "loc": {
              "start": 11,
              "end": 44
            }
          }
        ],
        "loc": {
          "start": 6,
          "end": 47
        }
      },
      "loc": {
        "start": 0,
        "end": 47
      }
    }
  ],
  "loc": {
    "start": 0,
    "end": 47
  }
}

const variables = {}