import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";
import { v4 as uuidv4 } from "uuid";

export function generateUsername(): string {
  try {
    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: "-",
      style: "lowerCase",
    });

    const shortUuid = uuidv4().slice(0, 4);

    return name + "#" + shortUuid;
  } catch (error) {
    const msg = "Error generating username.";
    console.error(msg, error);
    throw new Error(msg);
  }
}
