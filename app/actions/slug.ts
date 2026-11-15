'use server';

import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

export async function generateSlugAction(): Promise<string> {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
  });
}
