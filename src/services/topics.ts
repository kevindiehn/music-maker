// Random topic generator for songwriting inspiration

interface TopicSuggestion {
  theme: string;
  mood: string;
  genre: string;
  description: string;
}

const THEMES = [
  "Growing up in a small town",
  "Finding courage after loss", 
  "Dancing in the rain",
  "Late night conversations",
  "Chasing dreams against all odds",
  "Old friends reconnecting",
  "Summer love that fades",
  "Breaking free from expectations",
  "The magic of ordinary moments",
  "Starting over in a new city",
  "Family secrets revealed",
  "Technology vs human connection",
  "Standing up for what's right",
  "The beauty of imperfection",
  "Midnight road trips",
  "Forgiveness and second chances",
  "Creative breakthrough moments",
  "Time slipping away",
  "Finding yourself through travel",
  "Love in unexpected places"
];

const MOODS = [
  "nostalgic",
  "hopeful", 
  "melancholic",
  "uplifting",
  "dreamy",
  "energetic",
  "contemplative",
  "rebellious",
  "romantic",
  "empowering",
  "bittersweet",
  "peaceful",
  "intense",
  "playful",
  "mysterious"
];

const GENRES = [
  "pop",
  "folk", 
  "rock",
  "indie",
  "soul",
  "country",
  "afrobeats",
  "jazz",
  "R&B",
  "acoustic",
  "alternative",
  "blues"
];

const DESCRIPTIONS = [
  "Perfect for storytelling with vivid imagery",
  "Great for emotional depth and personal reflection", 
  "Ideal for catchy hooks and sing-along choruses",
  "Works well with metaphors and symbolism",
  "Good for building narrative tension",
  "Natural fit for call-and-response sections",
  "Excellent for showcasing vocal range",
  "Perfect for intimate, acoustic arrangements"
];

export function generateRandomTopic(): TopicSuggestion {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
  const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
  
  return {
    theme,
    mood, 
    genre,
    description
  };
}

export function getThemesByCategory() {
  return {
    love: [
      "Summer love that fades",
      "Love in unexpected places", 
      "Long distance relationship",
      "First heartbreak"
    ],
    growth: [
      "Growing up in a small town",
      "Finding courage after loss",
      "Starting over in a new city",
      "Breaking free from expectations"
    ],
    adventure: [
      "Midnight road trips",
      "Finding yourself through travel",
      "Chasing dreams against all odds",
      "Taking the leap into unknown"
    ],
    nostalgia: [
      "Late night conversations",
      "Old friends reconnecting", 
      "The magic of ordinary moments",
      "Time slipping away"
    ]
  };
}