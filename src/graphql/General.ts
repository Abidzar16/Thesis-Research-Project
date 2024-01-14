import { objectType } from "nexus";

export const GeneralMessage = objectType({
	name: "GeneralMessage",
	definition(t) {
		t.nonNull.string("message");
	},
});