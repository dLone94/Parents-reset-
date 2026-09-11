/**
 * Anonymous display names for the community. Word lists are English on
 * purpose for now: they read as playful handles rather than sentences, and
 * users can always change theirs. Localised lists can be added per locale
 * later without touching callers.
 */
const ADJECTIVES = [
  "Quiet", "Brave", "Gentle", "Sunny", "Steady", "Patient", "Warm", "Curious", "Calm", "Kind",
  "Sleepy", "Bright", "Honest", "Lucky", "Cosy", "Merry", "Wise", "Tired", "Hopeful", "Soft",
];
const ANIMALS = [
  "Otter", "Fox", "Heron", "Badger", "Sparrow", "Bear", "Owl", "Hare", "Deer", "Robin",
  "Seal", "Wren", "Moose", "Lynx", "Finch", "Panda", "Koala", "Hedgehog", "Swan", "Puffin",
];

export function generatePseudonym(random: () => number = Math.random): string {
  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(random() * ANIMALS.length)];
  const number = Math.floor(random() * 90) + 10;
  return `${adjective} ${animal} ${number}`;
}
