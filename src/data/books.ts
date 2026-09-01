export type Genre =
  | "Fantasy"
  | "Adventure"
  | "Children's"
  | "African Culture"
  | "Thriller"
  | "Family Saga"
  | "Historical"
  | "Romance";

export type BookStatus = "ONGOING" | "COMPLETED" | "UPCOMING" | "PAUSED";
export type AccessType = "FREE" | "PREMIUM";

export interface Chapter {
  id: string;
  number: number;
  title: string;
  accessType: AccessType;
  price: number;
  wordCount: number;
  readingTime: number;
  publishedAt: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  heroImage: string;
  genres: Genre[];
  status: BookStatus;
  synopsis: string;
  totalChapters: number;
  lastUpdate: string;
  rating: number;
  views: number;
  favorites: number;
  tags: string[];
  chapters: Chapter[];
}

const ch = (content: string): string => `
${content}

She had spent seventeen summers watching the baobab trees grow taller than memory, their roots drinking deep from the secret rivers that flow beneath the red earth. She had never imagined that one of them would speak to her name.

But on the morning of the dry season's first cruelty, the oldest baobab in the grove — the one the village elders called Grandfather Root — let out a sound like the groaning of the entire world at once.

She felt it in her chest before she heard it with her ears.

"Child of two bloods," the tree said, and every leaf went still despite the wind, "the throne has been empty long enough."

She stepped back, heart hammering. The bark of the ancient tree was warm against her fingertips — warm like skin, warm like life.

Around her, the morning birds had gone silent. Even the insects held their breath.

"Who are you speaking to?" she whispered.

"To the one who can hear me," Grandfather Root answered. "There are not many of you left."

The sky above the forest canopy shifted, clouds moving in patterns that were not natural, forming shapes she recognized from the old drawings her grandmother kept under her sleeping mat — the symbol of the First Kingdom, the mark that had not appeared in this land for three hundred years.

Her hands were trembling now. She pressed them flat against the tree's warm bark to steady herself.

"What do you want from me?"

"Not want," the tree corrected gently. "Need. We need what only you carry."

Deep in her chest, something she had always thought was simply the warmth of being alive began to pulse with a rhythm she had never noticed before — steady and ancient and golden as the first light of creation.

She understood then that her life, the life she had known and loved and taken for granted, was about to become something else entirely.

The wind shifted. A flock of starlings rose from the tall grass and wheeled across the sky in a formation that looked, from her vantage point, exactly like an open hand.

"Tell me," she said. And the forest leaned in to listen.

The silence that followed was not empty. It was the silence of something waking up after a very long sleep — something that had been waiting, patiently and without resentment, for exactly this moment, exactly this word, spoken by exactly this voice.

Grandfather Root's bark shimmered. The patterns in the wood — those whorls and grooves she had traced with her fingers since childhood, thinking them simply the art of time — began to move. They rearranged themselves into letters. Into a language she should not have been able to read.

But she could.

Every word of it.

"The First King buried the seed here," the tree said. "Three centuries ago. He said that when the land forgot itself, a child would come who still remembered. A child who could read the old writing."

She read the words forming in the bark: the name of a kingdom, the coordinates of a door, and a warning she felt in her teeth.

"What happens if I don't go?" she asked.

"The root dies," said Grandfather Root simply. "And without the root, the tree falls. And without this tree —"

"The whole grove," she finished.

"The whole grove," the tree confirmed. "And everything the grove protects."

She thought of her village. The market. The smell of groundnut soup on Sunday mornings. Her grandmother's laugh.

She took a deep breath of red-dust air and ancient bark and the particular sweetness of a morning that had not yet decided what it wanted to be.

"All right," she said.

And stepped forward, into the door that had opened in the tree.
`.trim();

export const books: Book[] = [
  {
    id: "baobab-kingdom",
    title: "The Baobab Kingdom",
    author: "Amara Diallo",
    cover:
      "https://images.unsplash.com/photo-1627850466138-87ae3848532b?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1627850466138-87ae3848532b?w=800&h=500&fit=crop&auto=format",
    genres: ["Fantasy", "Adventure", "Children's"],
    status: "ONGOING",
    synopsis:
      "Deep in the ancient forest where baobab trees touch the clouds, young Kemi discovers she can speak to the trees — and they have a warning that could save or destroy the last hidden kingdom. A tale of roots, royalty, and the magic that sleeps in every living thing.",
    totalChapters: 34,
    lastUpdate: "2 days ago",
    rating: 4.8,
    views: 124500,
    favorites: 8700,
    tags: ["magic", "nature", "coming-of-age", "royalty"],
    chapters: [
      { id: "bk-c1", number: 1, title: "Grandfather Root", accessType: "FREE", price: 0, wordCount: 2400, readingTime: 10, publishedAt: "Jan 15, 2024", content: ch("The baobab grove was silent the morning everything changed.") },
      { id: "bk-c2", number: 2, title: "The Voice in the Bark", accessType: "FREE", price: 0, wordCount: 2100, readingTime: 9, publishedAt: "Jan 22, 2024", content: ch("She returned to the grove before sunrise, a question burning in her chest.") },
      { id: "bk-c3", number: 3, title: "Two Bloods", accessType: "FREE", price: 0, wordCount: 2600, readingTime: 11, publishedAt: "Jan 29, 2024", content: ch("The elders met in the evening, and for the first time in living memory, they did not invite her grandmother.") },
      { id: "bk-c4", number: 4, title: "The Throne Awaits", accessType: "PREMIUM", price: 80, wordCount: 3100, readingTime: 13, publishedAt: "Feb 5, 2024", content: "" },
      { id: "bk-c5", number: 5, title: "Into the Deep Grove", accessType: "PREMIUM", price: 80, wordCount: 2800, readingTime: 12, publishedAt: "Feb 12, 2024", content: "" },
      { id: "bk-c6", number: 6, title: "The Silver Root", accessType: "PREMIUM", price: 120, wordCount: 3400, readingTime: 14, publishedAt: "Feb 19, 2024", content: "" },
      { id: "bk-c7", number: 7, title: "A Door in the Tree", accessType: "PREMIUM", price: 120, wordCount: 3200, readingTime: 13, publishedAt: "Feb 26, 2024", content: "" },
      { id: "bk-c8", number: 8, title: "The First Kingdom", accessType: "PREMIUM", price: 170, wordCount: 3800, readingTime: 16, publishedAt: "Mar 4, 2024", content: "" },
    ],
  },
  {
    id: "echoes-of-kongo",
    title: "Echoes of Kongo",
    author: "Ngozi Adeyemi",
    cover:
      "https://images.unsplash.com/photo-1772289935653-f5a7950205cf?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1772289935653-f5a7950205cf?w=800&h=500&fit=crop&auto=format",
    genres: ["African Culture", "Historical"],
    status: "ONGOING",
    synopsis:
      "When a young archivist discovers a map hidden inside a 600-year-old drum, she follows it into the ancient Kingdom of Kongo — and into a conspiracy that reaches from colonial-era betrayals to the halls of power today.",
    totalChapters: 28,
    lastUpdate: "5 days ago",
    rating: 4.9,
    views: 89200,
    favorites: 6100,
    tags: ["history", "mystery", "culture", "conspiracy"],
    chapters: [
      { id: "ek-c1", number: 1, title: "The Drum's Secret", accessType: "FREE", price: 0, wordCount: 2200, readingTime: 9, publishedAt: "Jan 10, 2024", content: ch("Chioma had catalogued ten thousand artifacts. None of them had ever catalogued her back.") },
      { id: "ek-c2", number: 2, title: "600 Years of Silence", accessType: "FREE", price: 0, wordCount: 2500, readingTime: 10, publishedAt: "Jan 17, 2024", content: ch("The map was drawn in something that was not quite ink and not quite blood.") },
      { id: "ek-c3", number: 3, title: "The Ivory Roads", accessType: "PREMIUM", price: 80, wordCount: 3000, readingTime: 12, publishedAt: "Jan 24, 2024", content: "" },
      { id: "ek-c4", number: 4, title: "Blood in the Archive", accessType: "PREMIUM", price: 120, wordCount: 2900, readingTime: 12, publishedAt: "Jan 31, 2024", content: "" },
      { id: "ek-c5", number: 5, title: "The Manikongo's Letter", accessType: "PREMIUM", price: 120, wordCount: 3300, readingTime: 14, publishedAt: "Feb 7, 2024", content: "" },
    ],
  },
  {
    id: "midnight-throne",
    title: "The Midnight Throne",
    author: "Kofi Asante-Brown",
    cover:
      "https://images.unsplash.com/photo-1551029506-0807df4e2031?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1551029506-0807df4e2031?w=800&h=500&fit=crop&auto=format",
    genres: ["Fantasy", "Thriller"],
    status: "ONGOING",
    synopsis:
      "In a city where the night never truly ends, detective Yaw Mensah hunts a killer who leaves behind no trace — only the scent of old pages and an impossible symbol. But as he digs deeper, he realizes the murders are not the mystery. He is.",
    totalChapters: 42,
    lastUpdate: "1 day ago",
    rating: 4.7,
    views: 201300,
    favorites: 15400,
    tags: ["detective", "dark fantasy", "mystery", "urban"],
    chapters: [
      { id: "mt-c1", number: 1, title: "The First Body", accessType: "FREE", price: 0, wordCount: 3100, readingTime: 13, publishedAt: "Jan 8, 2024", content: ch("The city had been dark for eleven years. Yaw Mensah had been a detective for ten of them.") },
      { id: "mt-c2", number: 2, title: "No Trace", accessType: "FREE", price: 0, wordCount: 2800, readingTime: 12, publishedAt: "Jan 15, 2024", content: ch("The forensics team found nothing. Yaw found something they were not trained to see.") },
      { id: "mt-c3", number: 3, title: "The Old Pages", accessType: "FREE", price: 0, wordCount: 2600, readingTime: 11, publishedAt: "Jan 22, 2024", content: ch("Every victim had been reading the same book. A book with no author, no publisher, no ISBN.") },
      { id: "mt-c4", number: 4, title: "Symbol Without Name", accessType: "PREMIUM", price: 80, wordCount: 3400, readingTime: 14, publishedAt: "Jan 29, 2024", content: "" },
      { id: "mt-c5", number: 5, title: "The Mirror Lies", accessType: "PREMIUM", price: 80, wordCount: 3200, readingTime: 13, publishedAt: "Feb 5, 2024", content: "" },
      { id: "mt-c6", number: 6, title: "Night That Never Ends", accessType: "PREMIUM", price: 120, wordCount: 4100, readingTime: 17, publishedAt: "Feb 12, 2024", content: "" },
      { id: "mt-c7", number: 7, title: "The Throne Room", accessType: "PREMIUM", price: 170, wordCount: 4500, readingTime: 19, publishedAt: "Feb 19, 2024", content: "" },
    ],
  },
  {
    id: "amas-garden",
    title: "Ama's Garden of Stars",
    author: "Adaeze Obi",
    cover:
      "https://images.unsplash.com/photo-1512331455279-c8ae8178f586?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1512331455279-c8ae8178f586?w=800&h=500&fit=crop&auto=format",
    genres: ["Children's", "Fantasy", "Adventure"],
    status: "COMPLETED",
    synopsis:
      "Eight-year-old Ama can grow anything in her magical garden — except the star-flowers her mother planted before she disappeared. When a seed finally sprouts, it leads Ama across the night sky on a journey to find where her mother went.",
    totalChapters: 18,
    lastUpdate: "3 months ago",
    rating: 4.9,
    views: 78900,
    favorites: 9200,
    tags: ["children", "magic garden", "family", "stars"],
    chapters: [
      { id: "ag-c1", number: 1, title: "The Stubborn Seed", accessType: "FREE", price: 0, wordCount: 1800, readingTime: 7, publishedAt: "Sep 1, 2023", content: ch("Ama had tried every kind of water. Rain water, well water, water she collected from the roof in a clay pot during the biggest storm of the year.") },
      { id: "ag-c2", number: 2, title: "Star-Flowers", accessType: "FREE", price: 0, wordCount: 1900, readingTime: 8, publishedAt: "Sep 8, 2023", content: ch("The seed sprouted on the night of the full moon, and it glowed.") },
      { id: "ag-c3", number: 3, title: "Up the Night Road", accessType: "PREMIUM", price: 80, wordCount: 2200, readingTime: 9, publishedAt: "Sep 15, 2023", content: "" },
      { id: "ag-c4", number: 4, title: "The Cloud Giants", accessType: "PREMIUM", price: 80, wordCount: 2100, readingTime: 9, publishedAt: "Sep 22, 2023", content: "" },
    ],
  },
  {
    id: "sins-of-father",
    title: "Sins of the Father",
    author: "Celestine Mbeki",
    cover:
      "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?w=800&h=500&fit=crop&auto=format",
    genres: ["Family Saga", "Thriller"],
    status: "ONGOING",
    synopsis:
      "Three generations of the Mbeki family carry a secret that could destroy everything they have built. When the youngest daughter starts asking questions her elders refuse to answer, the silence begins to break — and old wounds bleed again.",
    totalChapters: 56,
    lastUpdate: "3 days ago",
    rating: 4.6,
    views: 156700,
    favorites: 11300,
    tags: ["family", "secrets", "generational trauma", "drama"],
    chapters: [
      { id: "sf-c1", number: 1, title: "The House on the Hill", accessType: "FREE", price: 0, wordCount: 3400, readingTime: 14, publishedAt: "Jan 5, 2024", content: ch("The Mbeki house had seventeen rooms and one locked door. Amira had counted both.") },
      { id: "sf-c2", number: 2, title: "Questions Without Answers", accessType: "FREE", price: 0, wordCount: 3100, readingTime: 13, publishedAt: "Jan 12, 2024", content: ch("Her grandmother smiled at every question Amira asked. But her eyes went somewhere else.") },
      { id: "sf-c3", number: 3, title: "The Old Photograph", accessType: "PREMIUM", price: 80, wordCount: 3600, readingTime: 15, publishedAt: "Jan 19, 2024", content: "" },
      { id: "sf-c4", number: 4, title: "What Father Knew", accessType: "PREMIUM", price: 120, wordCount: 3800, readingTime: 16, publishedAt: "Jan 26, 2024", content: "" },
    ],
  },
  {
    id: "river-speaks",
    title: "The River Speaks",
    author: "Binta Touré",
    cover:
      "https://images.unsplash.com/photo-1697666287746-1fa0dabf5ea7?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1697666287746-1fa0dabf5ea7?w=800&h=500&fit=crop&auto=format",
    genres: ["African Culture", "Fantasy"],
    status: "ONGOING",
    synopsis:
      "Along the banks of the River Sanaga, a girl raised among the fishing people learns that the water has a voice — and that it has been waiting to tell someone the story of what was taken. A lyrical tale of land, loss, and the memory that water carries.",
    totalChapters: 22,
    lastUpdate: "1 week ago",
    rating: 4.8,
    views: 45600,
    favorites: 3800,
    tags: ["water", "oral tradition", "Cameroon", "spiritual"],
    chapters: [
      { id: "rs-c1", number: 1, title: "The Sanaga's Greeting", accessType: "FREE", price: 0, wordCount: 2100, readingTime: 9, publishedAt: "Jan 20, 2024", content: ch("Fanta had been fishing the Sanaga since before she could walk, carried on her father's back in the grey hours before dawn.") },
      { id: "rs-c2", number: 2, title: "The Fisherman's Daughter", accessType: "FREE", price: 0, wordCount: 2300, readingTime: 10, publishedAt: "Jan 27, 2024", content: ch("The voice came first as a feeling — the sense that the water was pulling toward her rather than past her.") },
      { id: "rs-c3", number: 3, title: "What Water Remembers", accessType: "PREMIUM", price: 80, wordCount: 2800, readingTime: 12, publishedAt: "Feb 3, 2024", content: "" },
    ],
  },
  {
    id: "shadow-hunters",
    title: "Shadow Hunters",
    author: "Kweku Asare",
    cover:
      "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=800&h=500&fit=crop&auto=format",
    genres: ["Adventure", "Thriller"],
    status: "ONGOING",
    synopsis:
      "A team of five teenagers stumbles upon a network of ancient passages beneath their city — passages that predate the city itself by thousands of years. Inside lives something that has been sleeping. They woke it up.",
    totalChapters: 38,
    lastUpdate: "4 days ago",
    rating: 4.5,
    views: 113400,
    favorites: 7600,
    tags: ["teens", "underground", "ancient", "action"],
    chapters: [
      { id: "sh-c1", number: 1, title: "The Crack in the Pavement", accessType: "FREE", price: 0, wordCount: 2700, readingTime: 11, publishedAt: "Jan 12, 2024", content: ch("Kofi found the crack on a Tuesday, which he would later decide was appropriate. Tuesdays were the worst day for normalcy.") },
      { id: "sh-c2", number: 2, title: "Five Meters Down", accessType: "FREE", price: 0, wordCount: 2900, readingTime: 12, publishedAt: "Jan 19, 2024", content: ch("The passage smelled like rain and old iron and something Kofi didn't have a word for yet.") },
      { id: "sh-c3", number: 3, title: "What Lives Below", accessType: "PREMIUM", price: 80, wordCount: 3200, readingTime: 13, publishedAt: "Jan 26, 2024", content: "" },
    ],
  },
  {
    id: "grandmothers-fire",
    title: "Grandmother's Fire",
    author: "Aisha Kamara",
    cover:
      "https://images.unsplash.com/photo-1595272407091-3a74aac8090b?w=300&h=450&fit=crop&auto=format",
    heroImage:
      "https://images.unsplash.com/photo-1595272407091-3a74aac8090b?w=800&h=500&fit=crop&auto=format",
    genres: ["African Culture", "Family Saga"],
    status: "COMPLETED",
    synopsis:
      "Every evening, Grandmother Adja sits by the fire and tells a story. Each story is a door. Behind each door is a truth the family has spent generations trying to forget. A multigenerational epic of love, loss, and the stories that make us who we are.",
    totalChapters: 24,
    lastUpdate: "2 months ago",
    rating: 4.9,
    views: 67800,
    favorites: 8100,
    tags: ["oral tradition", "family", "wisdom", "West Africa"],
    chapters: [
      { id: "gf-c1", number: 1, title: "The First Fire", accessType: "FREE", price: 0, wordCount: 2600, readingTime: 11, publishedAt: "Oct 1, 2023", content: ch("The fire was always lit before the questions began. Grandmother Adja said a story told in darkness had no roots.") },
      { id: "gf-c2", number: 2, title: "The Story of the River Man", accessType: "FREE", price: 0, wordCount: 2400, readingTime: 10, publishedAt: "Oct 8, 2023", content: ch("\"Tonight,\" said Grandmother Adja, \"I will tell you about the man who tried to own the river.\"") },
      { id: "gf-c3", number: 3, title: "What Was Buried", accessType: "PREMIUM", price: 80, wordCount: 2900, readingTime: 12, publishedAt: "Oct 15, 2023", content: "" },
    ],
  },
];

export const genres: Genre[] = [
  "Fantasy",
  "Adventure",
  "Children's",
  "African Culture",
  "Thriller",
  "Family Saga",
  "Historical",
  "Romance",
];

export const featuredBook = books[0];
export const popularBooks = [...books].sort((a, b) => b.views - a.views);
export const recentlyUpdated = books.filter((b) => b.status === "ONGOING");
export const newReleases = [...books].slice(-4);
