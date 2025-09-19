'use server';

/**
 * @fileOverview An AI agent that suggests item loadouts based on popular combinations and user preferences.
 *
 * - suggestLoadout - A function that provides item loadout suggestions.
 * - SuggestLoadoutInput - The input type for the suggestLoadout function.
 * - SuggestLoadoutOutput - The return type for the suggestLoadout function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const SuggestLoadoutInputSchema = z.object({
  inventory: z.array(
    z.object({
      name: z.string().describe('The name of the item.'),
      type: z.string().describe('The type of the item (e.g., knife, gloves, weapon skin).'),
      rarity: z.string().describe('The rarity of the item (e.g., Common, Uncommon, Rare, Epic, Legendary).'),
    })
  ).describe('The user inventory to generate loadout suggestions from.'),
  playStyle: z
    .string()
    .optional()
    .describe('The play style of the user (e.g., aggressive, defensive, support).'),
  budget: z.number().optional().describe('The user\'s preferred budget for the loadout in coins.'),
});
export type SuggestLoadoutInput = z.infer<typeof SuggestLoadoutInputSchema>;

const SuggestLoadoutOutputSchema = z.object({
  suggestedLoadout: z.object({
    primary: z.string().optional().describe('Suggested primary weapon skin.'),
    secondary: z.string().optional().describe('Suggested secondary weapon skin.'),
    knife: z.string().optional().describe('Suggested knife skin.'),
    gloves: z.string().optional().describe('Suggested gloves skin.'),
  }).describe('The suggested item loadout.'),
  reasoning: z.string().describe('The reasoning for the suggested loadout, considering playstyle, budget, and item synergy.'),
});
export type SuggestLoadoutOutput = z.infer<typeof SuggestLoadoutOutputSchema>;

export async function suggestLoadout(input: SuggestLoadoutInput): Promise<SuggestLoadoutOutput> {
  return suggestLoadoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLoadoutPrompt',
  input: {schema: SuggestLoadoutInputSchema},
  output: {schema: SuggestLoadoutOutputSchema},
  prompt: `You are an expert loadout advisor for CS2, suggesting the best combinations of items for users.

Here is the user's inventory:
{{#each inventory}}
- {{name}} ({{type}}, {{rarity}})
{{/each}}

{{#if playStyle}}
The user's play style is: {{playStyle}}
{{/if}}

{{#if budget}}
The user's budget is: {{budget}} coins.
{{/if}}

Suggest a coherent and stylish loadout (Primary, Secondary, Knife, Gloves) from the user's inventory.
Explain your reasoning for the suggested loadout, considering item synergy, style, and the user's preferences (playstyle, budget).
The loadout should look good together.
`,
});

const suggestLoadoutFlow = ai.defineFlow(
  {
    name: 'suggestLoadoutFlow',
    inputSchema: SuggestLoadoutInputSchema,
    outputSchema: SuggestLoadoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
