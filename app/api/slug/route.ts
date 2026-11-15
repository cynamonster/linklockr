import { NextResponse } from 'next/server';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

export async function GET() {
  const slug = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
  });
  return NextResponse.json({ slug });
}
