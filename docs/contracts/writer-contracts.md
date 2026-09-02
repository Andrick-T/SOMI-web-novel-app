# Writer Studio Contracts

## WriterProfile

- id: string
- userId: string
- displayName: string
- penName: string
- bio: string
- avatar: string
- banner: string
- genres: string[]
- socialLinks: Record<string, string>
- totalBooks: number
- totalReads: number
- totalFollowers: number
- totalEarnings: number

## Series

- id: string
- writerId: string
- title: string
- slug: string
- description: string
- cover: string
- genres: string[]
- status: ACTIVE | PAUSED | ARCHIVED
- bookIds: string[]
- createdAt: string
- updatedAt: string

## Book

- id: string
- writerId: string
- title: string
- subtitle: string
- penName: string
- synopsis: string
- genres: string[]
- tags: string[]
- status: PublicationStatus
- seriesId?: string
- seriesPosition?: number
- audience: general | young-adult | adult
- contentWarnings: string[]
- publishingStrategy: serial | full-run | scheduled
- cover: string
- heroImage: string
- freeChapters: number
- chapterPricing: number
- isStandalone: boolean
- chapters: WriterChapter[]

## Chapter

- id: string
- bookId: string
- number: number
- title: string
- content: string
- wordCount: number
- readingTime: number
- accessType: FREE | PREMIUM
- price: number
- status: PublicationStatus
- scheduledAt?: string
- publishedAt?: string

## Draft

- id: string
- bookId: string
- writerId: string
- version: number
- title: string
- synopsis: string
- genres: string[]
- tags: string[]
- cover: string
- updatedAt: string
- status: PublicationStatus

## Revision

- id: string
- entityId: string
- entityType: book | chapter | draft
- version: number
- authorId: string
- snapshot: Record<string, unknown>
- createdAt: string

## WriterAnalytics

- views
- uniqueReaders
- chapterReads
- completionRate
- favorites
- libraryAdds
- averageReadingTime
- earnings

## WriterEarnings

- writerId: string
- grossEarnings: number
- platformFees: number
- netEarnings: number
- pending: number
- available: number
- paidOut: number

## Publication transitions

DRAFT -> EDITING
EDITING -> PROOFREADING | DRAFT
PROOFREADING -> READY_FOR_REVIEW | EDITING
READY_FOR_REVIEW -> APPROVED | EDITING
APPROVED -> SCHEDULED | PUBLISHED
SCHEDULED -> PUBLISHED | DRAFT
PUBLISHED -> UNPUBLISHED | ARCHIVED
UNPUBLISHED -> PUBLISHED | ARCHIVED

These transitions are enforced in the writer domain service and remain mock-backend safe for future API adoption.
