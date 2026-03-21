'use server';
/**
 * @fileOverview An AI agent for generating keyword suggestions for scraping campaigns.
 *
 * - suggestKeywordsForCampaign - A function that handles the keyword suggestion process.
 * - AiKeywordSuggestionInput - The input type for the suggestKeywordsForCampaign function.
 * - AiKeywordSuggestionOutput - The return type for the suggestKeywordsForCampaign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiKeywordSuggestionInputSchema = z.object({
  query: z
    .string()
    .describe(
      'A base query or initial idea for the scraping campaign, e.g., "email marketing software" or "best restaurants in New York".'
    ),
});
export type AiKeywordSuggestionInput = z.infer<
  typeof AiKeywordSuggestionInputSchema
>;

const AiKeywordSuggestionOutputSchema = z.object({
  shortTailKeywords: z
    .array(z.string())
    .describe('A list of short, broad keywords, typically 1-3 words long.'),
  longTailKeywords: z
    .array(z.string())
    .describe('A list of specific, descriptive keywords, typically 4+ words long.'),
});
export type AiKeywordSuggestionOutput = z.infer<
  typeof AiKeywordSuggestionOutputSchema
>;

export async function suggestKeywordsForCampaign(
  input: AiKeywordSuggestionInput
): Promise<AiKeywordSuggestionOutput> {
  return aiKeywordSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiKeywordSuggestionPrompt',
  input: {schema: AiKeywordSuggestionInputSchema},
  output: {schema: AiKeywordSuggestionOutputSchema},
  prompt: `You are an expert in keyword research for web scraping campaigns. Your goal is to generate comprehensive keyword lists based on a given query, differentiating between short-tail and long-tail keywords.

Based on the following query, suggest relevant short-tail and long-tail keywords that would be useful for a web scraping campaign to find domains related to this topic. Ensure the suggestions are distinct and valuable for discovering a wide range of relevant websites.

Query: {{{query}}}

Aim for at least 5-10 short-tail keywords and 10-20 long-tail keywords.
`,
});

const aiKeywordSuggestionFlow = ai.defineFlow(
  {
    name: 'aiKeywordSuggestionFlow',
    inputSchema: AiKeywordSuggestionInputSchema,
    outputSchema: AiKeywordSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate keyword suggestions.');
    }
    return output;
  }
);
