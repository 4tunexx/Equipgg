'use server';
/**
 * @fileOverview Personalized mission recommendations based on user behavior.
 *
 * - getPersonalizedMissionRecommendations - A function that returns personalized mission recommendations.
 * - PersonalizedMissionRecommendationsInput - The input type for the getPersonalizedMissionRecommendations function.
 * - PersonalizedMissionRecommendationsOutput - The return type for the getPersonalizedMissionRecommendations function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const PersonalizedMissionRecommendationsInputSchema = z.object({
  userBehavior: z.string().describe('Description of the user behavior, including past missions, bet history, and item usage.'),
  availableMissions: z.string().describe('A list of available missions with their descriptions and rewards.'),
});
export type PersonalizedMissionRecommendationsInput = z.infer<typeof PersonalizedMissionRecommendationsInputSchema>;

const PersonalizedMissionRecommendationsOutputSchema = z.object({
  recommendedMissions: z.array(z.object({
    name: z.string().describe('The name of the recommended mission.'),
    reason: z.string().describe('A short explanation of why this mission is recommended for the user.'),
  })).describe('A list of missions recommended for the user, tailored to their behavior and preferences.'),
});
export type PersonalizedMissionRecommendationsOutput = z.infer<typeof PersonalizedMissionRecommendationsOutputSchema>;

export async function getPersonalizedMissionRecommendations(input: PersonalizedMissionRecommendationsInput): Promise<PersonalizedMissionRecommendationsOutput> {
  return personalizedMissionRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedMissionRecommendationsPrompt',
  input: {schema: PersonalizedMissionRecommendationsInputSchema},
  output: {schema: PersonalizedMissionRecommendationsOutputSchema},
  prompt: `You are an AI assistant that recommends missions to users based on their past behavior, with a focus on 'money' missions if available.

  User Behavior: {{{userBehavior}}}
  Available Missions: {{{availableMissions}}}

  Based on the user's behavior and the available missions, recommend the missions that would be most relevant and efficient for earning coins.
  Prioritize missions that offer high coin rewards or are related to the user's preferred activities.
  If no money missions are available, recommend missions that align with the user's play style and progression goals.
  Return a list of recommended missions with a brief reason for each recommendation.
`,
});

const personalizedMissionRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedMissionRecommendationsFlow',
    inputSchema: PersonalizedMissionRecommendationsInputSchema,
    outputSchema: PersonalizedMissionRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
