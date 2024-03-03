export interface Configuration {
  timeToLive?: number;
  uniqueIdentifier?: String;
  mutation?: {[key: string]: String | null};
}

function validateRules(rules: {[key: string]: Configuration})
  : {[key: string]: Configuration}
{
  const keys = Object.keys(rules);
  keys.forEach((key) => {
    const timeToLive = rules[key].timeToLive || undefined;
    if (timeToLive && timeToLive < 0){
      throw new Error("Time to live must be a positive number");
    }
  });
  return rules
}

const ruleList : {[key: string]: Configuration} = {
  "feed": {
    timeToLive: 600000, // 10 minute
    mutation: {
      "delete": null,
    }
  },
  "link": {
    timeToLive: 600000, // 10 minute
    uniqueIdentifier: "id",
    mutation: {
      "delete": "id",
    }
  }
}


export const rules = validateRules(ruleList);
