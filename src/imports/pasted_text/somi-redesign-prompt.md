SOMI — MASTER UI/UX REDESIGN & FRONTEND REFACTORING PROMPT
1. ROLE
You are redesigning and refactoring the existing SOMI application.
SOMI is a premium digital reading and publishing platform inspired by products such as MoboReader, Wattpad and Webnovel, but it must have its own distinctive visual identity and interaction language.
The existing implementation is functional and already contains a significant portion of the intended product. DO NOT throw away the application and rebuild a generic template.
Instead:
1.	Inspect the entire existing application.
2.	Understand the existing routes, components, screens, interactions and data structures.
3.	Preserve working functionality.
4.	Refactor the UI/UX architecture substantially.
5.	Correct the information architecture where necessary.
6.	Eliminate the excessive use of cards, boxes and dashboard-style containers.
7.	Make reading the central experience of the application.
8.	Make writer and administrator experiences proper professional applications rather than sections hidden inside a reader profile.
9.	Make the application genuinely responsive across mobile, tablet, laptop, desktop and large displays.
10.	Improve navigation and interaction consistency throughout the entire application.
This is a product-level redesign, not a cosmetic redesign.
________________________________________
2. CORE PRODUCT PHILOSOPHY
SOMI should feel like:
"A beautiful digital library where stories are discovered, opened, read, continued and eventually written."
It should NOT feel like:
"An AI-generated SaaS dashboard containing books."
The visual hierarchy must therefore prioritize:
1.	Reading
2.	Book discovery
3.	Story atmosphere
4.	Writer creativity
5.	Editorial workflow
6.	Coins and monetization
7.	Administration
The interface should feel editorial, literary, immersive and premium.
Avoid the visual language of generic SaaS products.
________________________________________
3. CRITICAL PROBLEM WITH THE CURRENT DESIGN
The existing application relies too heavily on:
•	Cards
•	Rounded boxes
•	Dashboard panels
•	Floating containers
•	Excessive borders
•	Repetitive shadows
•	Large empty dashboard areas
•	Sticker-like icons
•	Generic statistics cards
•	Excessive visual grouping
This makes the product look AI-generated.
Replace this visual language with:
•	Typography
•	Whitespace
•	Full-bleed imagery
•	Editorial layouts
•	Image-led book discovery
•	Horizontal shelves
•	Elegant dividers
•	Layered backgrounds
•	Book covers
•	Atmospheric gradients
•	Subtle typography hierarchy
•	Contextual controls
•	Edge-to-edge reading
•	Minimal chrome
Cards may still be used where structurally useful, but they must no longer be the default UI primitive.
________________________________________
4. SOMI VISUAL IDENTITY
SOMI should visually communicate:
•	Literature
•	Imagination
•	Warmth
•	Discovery
•	Storytelling
•	Premium reading
•	African creativity
•	Modern technology
The visual language should combine:
Modern digital publishing + physical books + cinematic storytelling.
Do not make it look like a banking app, productivity dashboard or generic SaaS.
________________________________________
5. COLOR SYSTEM
The primary reading experience must support three reading themes.
LIGHT READING MODE
Use warm paper rather than pure white.
The page should resemble a high-quality physical novel page.
Suggested direction:
•	Warm ivory
•	Cream
•	Soft parchment
•	Very subtle brown undertones
Avoid #FFFFFF as the primary reading canvas.
________________________________________
SEPIA READING MODE
Create a richer brownish parchment appearance.
The page should feel similar to an old physical novel.
Use:
•	Warm beige
•	Muted brown
•	Cream
•	Soft amber undertones
The text should remain highly readable.
________________________________________
DARK READING MODE
Dark mode must not simply invert the light interface.
Use a deep warm charcoal / brown-black background.
Avoid excessively bright white text.
Use:
•	Warm gray
•	Soft cream
•	Muted beige
for typography.
The reading experience must remain comfortable for long sessions.
________________________________________
6. TYPOGRAPHY
Typography is a major component of the SOMI identity.
Do not use typography merely as labels inside cards.
Use typography to create hierarchy.
Book titles should feel editorial.
Chapter titles should feel literary.
Reading text should prioritize:
•	readability
•	line height
•	comfortable line length
•	appropriate font size
•	visual rhythm
The reading interface should feel closer to a professionally typeset novel than a web article.
________________________________________
7. ICONOGRAPHY
REMOVE sticker-like icons and emoji-style visual elements from the interface.
Use a coherent 2D icon system.
Icons should be:
•	Simple
•	Elegant
•	Flat
•	Consistent
•	Minimal
•	Professionally designed
Use icons for:
•	Search
•	Library
•	Bookmark
•	Settings
•	Coins
•	Notifications
•	Navigation
•	Reading settings
•	Writer tools
•	Admin tools
•	Publishing
•	Analytics
•	Editing
Do not use cartoon stickers as primary navigation elements.
________________________________________
8. RESPONSIVE PLATFORM STRATEGY
SOMI is NOT a mobile-only application.
The design must support:
Mobile
•	Small phones
•	Large phones
•	Portrait
•	Landscape
Tablet
•	Portrait
•	Landscape
Desktop
•	Laptop
•	Standard desktop
•	Large desktop monitors
PWA
The experience must be optimized for installation as a Progressive Web App.
The responsive architecture must not simply stretch the mobile UI onto desktop.
Instead, layouts should adapt intelligently.
________________________________________
9. GLOBAL NAVIGATION
Do NOT force a bottom navigation bar into the reading experience.
Reading is a special immersive state.
Outside reading mode, navigation may adapt according to screen size.
Mobile
Use a compact navigation system appropriate for discovery/library/account areas.
Desktop
Use a refined top navigation and/or contextual side navigation where appropriate.
Reading mode
Remove unnecessary navigation entirely.
The reader should not feel like they are inside a dashboard.
________________________________________
10. IMMERSIVE READING MODE
This is one of the MOST IMPORTANT features in SOMI.
The reading experience must occupy essentially the entire available viewport.
On mobile:
The reading page should use 100% of the available screen width and height.
No unnecessary cards.
No dashboard shell.
No navigation bar.
No browser-style application chrome inside the reading canvas.
No excessive margins.
No "reading card" floating in the middle of the screen.
The book itself is the interface.
________________________________________
11. MOBILE READING VIEWPORT
On mobile, the reading experience should behave like a dedicated ebook reader.
The page should occupy:
100vw × 100vh
subject to unavoidable browser/PWA safe-area constraints.
The reader should NOT appear as:
[background]

   [ CARD ]
   [ text ]
   [ controls ]

[background]
Instead it should behave as:
┌──────────────────────────────┐
│ TIME                    BATTERY
│                              │
│                              │
│       CHAPTER CONTENT        │
│                              │
│                              │
│                              │
│                              │
└──────────────────────────────┘
________________________________________
12. NATIVE STATUS INFORMATION
In immersive reading mode, retain only the two minimal pieces of status information:
Time
Display the current time discreetly.
Battery
Display:
•	Battery icon
•	Current battery percentage/state where appropriate
The battery icon must visually reflect battery state.
For example:
•	High
•	Medium
•	Low
•	Critical
•	Charging
Do not place explanatory labels such as:
"Battery"
or
"Current time"
The information should be self-explanatory.
The time and battery should use a typography style distinct from the book typography.
They should feel like subtle device/status information rather than part of the story.
________________________________________
13. TRUE IMMERSIVE WEB/PWA BEHAVIOR
Implement the strongest immersive experience technically possible.
When SOMI runs as a PWA:
•	Hide browser UI where supported
•	Use fullscreen/standalone display mode
•	Hide unnecessary navigation
•	Respect mobile safe areas
•	Prevent accidental scrolling where appropriate
•	Allow edge-to-edge content
•	Preserve the minimal time/battery indicators described above where technically possible
If a normal browser cannot fully hide browser UI, optimize the PWA to provide the closest possible native-reader experience.
Do not pretend that browser JavaScript can control browser UI when it cannot.
Design the architecture so the future native mobile application can reuse the same reading experience.
________________________________________
14. PAGE FLIP — CRITICAL REQUIREMENT
The current page flip is improved but still incorrect.
Do NOT use a simple horizontal side-to-side 180° rotation.
The desired effect is a realistic physical page turn.
Think of a physical book:
The page begins from the bottom edge and folds upward toward the opposite top edge, producing a curved/folding surface.
The animation should resemble a sophisticated presentation/page-curl transition rather than:
LEFT → RIGHT
or
RIGHT → LEFT
as a flat rotation.
________________________________________
15. TARGET PAGE FLIP GEOMETRY
Conceptually:
START

┌──────────────────────┐
│                      │
│                      │
│                      │
│                      │
│                      │
│______________________│ ← bottom edge


The bottom edge begins lifting.

           ╱
         ╱
       ╱
     ╱
   ╱
 ╱


The page folds upward and diagonally.


              ╲
                ╲
                  ╲
                    ╲


Eventually:

┌──────────────────────┐
│                      │
│                      │
│                      │
│                      │
│                      │
│______________________│

END
The page should appear to have:
•	physical thickness
•	curvature
•	perspective
•	shadow
•	folding
•	depth
•	acceleration/deceleration
The movement should NOT feel like a CSS card rotating around its center.
________________________________________
16. PAGE FLIP INTERACTION
The reader should be able to turn pages naturally.
Support:
Swipe forward
Flip to next page.
Swipe backward
Flip to previous page.
Tap/gesture
Where appropriate, allow page turning without introducing intrusive buttons.
Mouse interaction on desktop
Allow intuitive click/drag interaction where appropriate.
Touch
Support natural touch gestures.
The interaction must feel physical.
________________________________________
17. PAGE FLIP VISUAL EFFECT
During the flip:
•	Create realistic page curvature.
•	Add a subtle page shadow.
•	Use perspective.
•	Show the page underside where appropriate.
•	Maintain correct reading direction.
•	Avoid visual glitches at the edges.
•	Prevent text from looking like a flat card rotating in 3D.
•	Keep the animation performant.
The flip should feel elegant rather than gimmicky.
Prioritize:
physical realism > flashy animation.
________________________________________
18. READING CONTROLS
Controls should remain hidden by default.
A tap/click may temporarily reveal contextual controls.
Possible controls:
•	Exit reader
•	Table of contents
•	Bookmark
•	Reading settings
•	Font size
•	Font family
•	Line spacing
•	Theme
•	Reading progress
•	Chapter information
Controls should disappear automatically after inactivity.
Never permanently occupy a large portion of the screen.
________________________________________
19. READING PROGRESS
Progress should be subtle.
Avoid large progress bars.
Possible implementations:
•	Minimal page indicator
•	Thin progress line
•	Percentage
•	Chapter progress
•	Book progress
The reader should always know where they are without being distracted.
________________________________________
20. BOOK DISCOVERY
The home screen must feel like a digital bookstore/library rather than a dashboard.
Use:
•	Large featured books
•	Editorial shelves
•	Horizontal book collections
•	Cover-focused layouts
•	Atmospheric hero sections
•	Genre sections
•	Trending stories
•	New releases
•	Continue reading
•	Recommended for you
•	Completed stories
•	Ongoing stories
Book covers should be visually dominant.
Do not place every book inside identical rectangular cards.
________________________________________
21. BOOK DETAIL PAGE
The book detail experience should be immersive.
Include:
•	Large cover
•	Title
•	Author
•	Genre
•	Status
•	Description
•	Tags
•	Rating
•	Reader count
•	Chapter count
•	Reading progress if applicable
•	Bookmark
•	Follow/book notification
•	Start reading
•	Continue reading
•	Coin requirements
•	Free chapter indicators
The page should feel like opening the cover of a book.
________________________________________
22. FREE CHAPTERS
Writers can mark chapters as free.
Free chapters should:
•	Be readable without authentication
•	Act as previews
•	Encourage readers to continue
•	Be indexed/discoverable
•	Clearly indicate that subsequent chapters may require coins
Do not aggressively interrupt free reading with payment prompts.
The product should first make the reader emotionally invested in the story.
________________________________________
23. SOMI COIN ECONOMY
The application must implement the following conversion:
1 CFA = 6.8 SOMI coins
Therefore:
Bundle 1
175 CFA
= 1190 coins
Bundle 2
425 CFA
= 28900 coins
Bundle 3
850 CFA
= 5780 coins
Additional purchases:
Minimum additional spending:
100 CFA
= 680 SOMI coins
Do not hard-code the pricing directly into visual components.
The coin economy must be configuration-driven.
________________________________________
24. CHAPTER PRICING
Writers can configure chapter prices.
Chapter prices may range approximately from:
80 → 225 SOMI coins
depending on:
•	Reading time
•	Chapter length
•	Narrative importance
•	Story arc importance
•	Content quality
•	Traffic
•	Demand
•	Author strategy
•	Exclusivity
•	Premium status
The system should allow the platform owner to configure minimum and maximum permitted prices.
________________________________________
25. COIN WALLET UX
The wallet must be simple.
Display:
•	Current balance
•	Transaction history
•	Purchased coins
•	Spent coins
•	Bonuses/promotions where applicable
•	Purchase coins
Do not make the wallet look like a banking dashboard.
Use a literary/product aesthetic.
________________________________________
26. READING ECONOMY TRANSPARENCY
Before unlocking a chapter, clearly show:
Chapter 17

Unlock for
120 SOMI coins
and show the user's balance.
If insufficient:
You need 120 coins.

Balance: 74 coins

Get more coins
Avoid confusing payment flows.
________________________________________
27. USER ACCOUNT
Readers should have:
•	Profile
•	Library
•	Reading history
•	Continue reading
•	Bookmarks
•	Followed authors
•	Followed books
•	Notifications
•	Wallet
•	Coin transactions
•	Reading preferences
•	Theme preferences
•	Account/security settings
Do not put writer/admin functionality inside the ordinary reader profile.
________________________________________
28. ROLE ARCHITECTURE
SOMI must have distinct roles.
At minimum:
READER
WRITER
ADMIN
Potential future:
SUPER ADMIN
EDITOR
MODERATOR
Do not assume that the administrator is necessarily the writer.
The system must be scalable from day one.
________________________________________
29. AUTHENTICATION ARCHITECTURE
The application should distinguish between:
Reader application
Consumer-facing SOMI.
Writer application
Professional publishing workspace.
Admin application
Administrative/operations workspace.
They may share authentication infrastructure, but their interfaces must be clearly separated.
Do NOT hide writer/admin dashboards under:
Profile → Settings → Writer Mode
This is unacceptable for the final product.
________________________________________
30. WRITER APPLICATION
The writer interface should feel like a professional digital publishing studio.
It must not look like a generic admin dashboard.
Primary writer areas:
•	Dashboard
•	My Books
•	Create Book
•	Book Editor
•	Chapter Manager
•	Chapter Editor
•	Media Library
•	Covers
•	Illustrations
•	Publishing
•	Scheduling
•	Drafts
•	Proofreading
•	Analytics
•	Reader engagement
•	Earnings
•	Profile
•	Settings
________________________________________
31. WRITER DASHBOARD
Show meaningful publishing information:
•	Books
•	Drafts
•	Published chapters
•	Scheduled releases
•	Readers
•	Reading completion
•	Revenue
•	Coins earned
•	Popular chapters
•	Recent activity
But do NOT represent every statistic as a card.
Use:
•	charts
•	timelines
•	tables
•	editorial lists
•	activity streams
•	visual metrics
Cards should be used sparingly.
________________________________________
32. BOOK CREATION
Writer must be able to create a book with:
•	Title
•	Subtitle
•	Description
•	Cover
•	Author
•	Genres
•	Tags
•	Language
•	Age category
•	Status
•	Ongoing / Completed
•	Visibility
•	Book teaser
•	Short synopsis
•	Long synopsis
•	Promotional description
________________________________________
33. BOOK STATUS
Support:
Draft
Not publicly visible.
Ongoing
Book is actively being published.
Completed
Book has reached its final chapter.
Scheduled
Book/chapter has future publication date.
Archived
No longer actively promoted.
________________________________________
34. BOOK TEASER
Writers must be able to create a teaser.
A teaser can include:
•	Text
•	Short excerpt
•	Promotional image
•	Video in future versions
•	Hook
•	Quote
The teaser should be usable on discovery pages.
________________________________________
35. COVER MANAGEMENT
Writer can:
•	Upload cover
•	Replace cover
•	Crop
•	Position
•	Preview
•	Set cover
•	Maintain cover history
The system should show how the cover will appear:
•	Home
•	Search
•	Book detail
•	Library
•	Recommendation shelf
________________________________________
36. RICH CHAPTER EDITOR
The chapter editor must be substantially richer than a basic textarea.
Support:
•	Headings
•	Paragraphs
•	Bold
•	Italic
•	Underline
•	Quotes
•	Dividers
•	Alignment
•	Lists
•	Indentation
•	Links
•	Scene breaks
•	Drop caps where appropriate
•	Text emphasis
•	Inline images
•	Page illustrations
•	Captions
•	Media blocks
The editor should prioritize writing.
Do not surround every editor section with cards.
________________________________________
37. CHILDREN'S BOOK SUPPORT
SOMI should support illustrated stories.
A writer should be able to insert:
Text

[Illustration]

Text

[Illustration]

Text
Illustrations can be:
•	Full-width
•	Centered
•	Inline
•	Edge-to-edge
•	Captioned
The reader should render these naturally.
________________________________________
38. PAGE-LEVEL FORMATTING
Writers must be able to control presentation.
Support where technically appropriate:
•	Page breaks
•	Scene breaks
•	Illustration placement
•	Text alignment
•	Image size
•	Image position
•	Chapter opening layout
•	Decorative separators
•	Quote blocks
However, do not allow arbitrary formatting that destroys consistency.
The reader rendering engine should maintain a controlled design system.
________________________________________
39. CHAPTER MANAGER
The writer must be able to see:
•	Chapter number
•	Title
•	Status
•	Word count
•	Estimated reading time
•	Price
•	Free/Paid
•	Publication status
•	Scheduled publication date
•	Last edited
•	Published date
Actions:
•	Edit
•	Duplicate
•	Preview
•	Proofread
•	Schedule
•	Publish
•	Unpublish
•	Archive
•	Delete
________________________________________
40. WRITER NAVIGATION
This is a current major problem.
When editing a chapter, the writer must NEVER become trapped inside a screen.
Provide contextual navigation:
Books
  ↓
Book
  ↓
Chapters
  ↓
Chapter Editor
The editor should provide:
•	Back to chapters
•	Previous chapter
•	Next chapter
•	Save
•	Preview
•	Publish
•	Exit editor
The writer should be able to move between chapters without repeatedly returning to the dashboard.
________________________________________
41. AUTOSAVE
The editor should autosave.
Display subtle state:
Saved
or
Saving...
or
Unsaved changes
Do not use disruptive notifications for every save.
________________________________________
42. PROOFREADING WORKFLOW
Writer workflow should support:
Draft
 ↓
Editing
 ↓
Proofreading
 ↓
Ready
 ↓
Scheduled
 ↓
Published
The UI should make this progression visually understandable.
Future support can include:
•	Comments
•	Suggestions
•	Version history
•	Collaborators
•	Editorial review
________________________________________
43. WRITER PREVIEW
Writer must be able to preview a chapter exactly as readers see it.
Include:
Preview as reader
The preview should use the actual SOMI reading engine.
This is critical.
Do not create a separate fake preview renderer.
________________________________________
44. WRITER ANALYTICS
Writers should eventually see:
•	Views
•	Unique readers
•	Chapter completion
•	Drop-off
•	Unlocks
•	Coins generated
•	Revenue
•	Most popular chapters
•	Average reading time
•	Returning readers
•	Book growth
•	Reader demographics where legally appropriate
Use meaningful visualizations rather than cards everywhere.
________________________________________
45. ADMIN APPLICATION
The Admin application must be completely functional.
It must NOT be an unfinished placeholder.
Admin is a separate role and application experience.
________________________________________
46. ADMIN RESPONSIBILITIES
Admin should manage:
Users
•	View users
•	Search users
•	Suspend users
•	Restore users
•	Manage account status
•	Review activity
•	Manage roles
Writers
•	Approve writers
•	Suspend writers
•	Review writer profiles
•	Manage writer permissions
Books
•	Review books
•	Approve/reject
•	Feature books
•	Remove books
•	Archive books
•	Manage categories
•	Manage genres
•	Manage visibility
Chapters
•	Review chapters
•	Moderate chapters
•	Remove chapters
•	Restore chapters
•	Review reported content
Content moderation
•	Reports
•	Flagged content
•	User complaints
•	Copyright complaints
•	Abuse reports
Coin economy
•	Manage coin bundles
•	Configure exchange rates
•	Configure chapter pricing constraints
•	Promotions
•	Bonuses
•	Transactions
•	Refunds where supported
Payments
•	Payment history
•	Successful payments
•	Failed payments
•	Pending payments
•	Refunds
•	Payment reconciliation
Platform analytics
•	Users
•	Active readers
•	Books
•	Chapters
•	Reading sessions
•	Coins purchased
•	Coins spent
•	Revenue
•	Writer earnings
•	Platform revenue
Homepage management
Admin should control:
•	Featured books
•	Trending shelves
•	Promotional banners
•	Genres
•	Collections
•	Editorial recommendations
Notifications
Admin should manage:
•	Push notifications
•	System announcements
•	Promotional notifications
•	Book release notifications
Configuration
Admin should configure:
•	Coin packages
•	Pricing rules
•	Platform settings
•	Feature flags
•	Reading settings
•	Supported genres
•	Content rules
Security
Admin should have:
•	Audit logs
•	Login history
•	Role management
•	Suspicious activity monitoring
•	Session management
________________________________________
47. ADMIN INFORMATION ARCHITECTURE
Create a proper administrative shell.
Possible structure:
ADMIN
│
├── Overview
├── Users
├── Writers
├── Books
├── Chapters
├── Moderation
├── Reports
├── Payments
├── Coins
├── Revenue
├── Analytics
├── Homepage
├── Notifications
├── Categories
├── Settings
└── Audit Logs
The administrator must be able to navigate between these sections naturally.
________________________________________
48. ADMIN ≠ WRITER
Even if the current owner is both:
Andrick
ADMIN + WRITER
the interfaces must remain separate.
Future scenario:
Owner
  ↓
ADMIN

Writer A
Writer B
Writer C
The architecture must already support this.
________________________________________
49. DESKTOP WRITER EXPERIENCE
Desktop should exploit the available space.
Possible structure:
┌──────────────┬─────────────────────────────────────┐
│              │                                     │
│ Writer Nav   │             Workspace               │
│              │                                     │
│ Books        │                                     │
│ Chapters     │                                     │
│ Media        │                                     │
│ Analytics    │                                     │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
The editor should become the primary workspace.
________________________________________
50. CHAPTER EDITOR DESKTOP
Desktop editor can use:
┌───────────────┬──────────────────────────┬──────────────┐
│ Chapter list  │        Editor            │ Inspector    │
│               │                          │              │
│ Ch 1          │  Chapter title           │ Formatting   │
│ Ch 2          │                          │ Media        │
│ Ch 3          │  Story content           │ Settings     │
│ Ch 4          │                          │              │
└───────────────┴──────────────────────────┴──────────────┘
But avoid turning every region into a card.
Use panels, separators and whitespace.
________________________________________
51. MOBILE WRITER EXPERIENCE
The writer application must also work on mobile.
The editor should provide:
•	Compact toolbar
•	Contextual formatting controls
•	Chapter navigation
•	Autosave
•	Preview
•	Publishing
•	Media insertion
Do not simply shrink the desktop editor.
________________________________________
52. READER LIBRARY
The library should feel like a personal bookshelf.
Use:
•	Book covers
•	Reading progress
•	Continue reading
•	Saved books
•	Downloaded/offline books
•	Completed books
Avoid excessive card containers.
Think:
digital bookshelf > dashboard grid.
________________________________________
53. OFFLINE READING
SOMI must be architected for online/offline reading.
The PWA should support:
•	Installing SOMI
•	Caching application shell
•	Caching authorized book/chapter content
•	Offline access to previously downloaded content
•	Local reading progress
•	Synchronization when online
Offline content must respect entitlement.
A user must not be able to bypass coin unlocking simply by manipulating local storage.
The backend remains authoritative.
________________________________________
54. OFFLINE LIBRARY UX
Allow users to identify:
•	Available offline
•	Downloading
•	Downloaded
•	Waiting for network
•	Requires update
Use subtle status indicators.
________________________________________
55. SEARCH
Search should support:
•	Books
•	Authors
•	Genres
•	Tags
Search results should prioritize book covers and titles.
Avoid generic search-result cards.
________________________________________
56. DISCOVERY
Create an editorial discovery experience.
Possible sections:
Featured
Trending Now
Continue Reading
New Releases
Popular in Cameroon
African Stories
Romance
Fantasy
Drama
Mystery
Completed Stories
Hidden Gems
These should feel like shelves in a digital bookstore.
________________________________________
57. ANIMATION PRINCIPLES
Animation should communicate physicality and polish.
Use:
•	Page curls
•	Fade transitions
•	Subtle parallax
•	Cover transitions
•	Shelf movement
•	Modal transitions
•	Contextual toolbar appearance
•	Smooth navigation
Avoid:
•	excessive bouncing
•	cartoon animations
•	random floating elements
•	unnecessary hover effects
•	flashy dashboard animations
________________________________________
58. ACCESSIBILITY
Ensure:
•	WCAG-conscious contrast
•	Keyboard navigation
•	Focus states
•	Screen-reader-friendly labels
•	Adjustable reading font size
•	Adjustable line spacing
•	Reduced-motion preference
•	Touch-friendly controls
Page flip should have a reduced-motion fallback.
________________________________________
59. PERFORMANCE
Reading performance is extremely important.
The reader must:
•	Open quickly
•	Avoid unnecessary re-renders
•	Lazy-load illustrations
•	Optimize images
•	Preload adjacent pages where possible
•	Cache reading content
•	Keep page flipping smooth
Do not load the entire book into the DOM unnecessarily.
________________________________________
60. READING ENGINE ARCHITECTURE
Separate the reading engine from the surrounding application shell.
Conceptually:
SOMI Application
│
├── Discovery
├── Library
├── Account
├── Wallet
├── Writer
├── Admin
│
└── Reading Engine
      ├── Pagination
      ├── Page Layout
      ├── Page Flip
      ├── Themes
      ├── Typography
      ├── Progress
      ├── Offline Cache
      └── Reading State
The same reading engine should be usable by:
•	Reader
•	Writer preview
•	Future native mobile app
________________________________________
61. PAGE PAGINATION
Do not simply render a long scrolling article.
The reader should experience discrete pages.
The system should calculate pages based on:
•	viewport size
•	font size
•	font family
•	line height
•	illustrations
•	margins
•	reading theme
•	device dimensions
Changing font settings may require recalculating pagination.
________________________________________
62. PAGE CONTENT
A page may contain:
•	Text
•	Heading
•	Paragraph
•	Scene break
•	Illustration
•	Quote
•	Decorative separator
The renderer must preserve editorial consistency.
________________________________________
63. READING SETTINGS
Provide a discreet settings panel.
Options:
Theme
•	Light
•	Sepia
•	Dark
Typography
•	Font size
•	Font family
•	Line spacing
Layout
•	Page margins
•	Reading width where applicable
Animation
•	Page flip
•	Reduced motion
Settings should persist.
________________________________________
64. BOOKMARKS
Users can bookmark:
•	Book
•	Chapter
•	Reading position
The system should restore the user's last position automatically.
________________________________________
65. READING SESSION
Track:
•	Current book
•	Current chapter
•	Page
•	Last position
•	Reading progress
•	Last opened timestamp
Synchronize between devices when online.
________________________________________
66. NOTIFICATIONS
Readers may receive:
•	New chapter
•	Book completed
•	Writer followed
•	Book followed
•	Promotional offer
•	Coin purchase confirmation
•	System notification
Do not make notifications intrusive.
________________________________________
67. RESPONSIVE DESIGN PRINCIPLE
Every screen must be intentionally designed for:
Mobile
Tablet
Desktop
Large desktop
Do not rely on:
width: 100%;
as the entire responsive strategy.
The composition itself must change.
________________________________________
68. MOBILE VS DESKTOP READING
Mobile
Prioritize:
•	Fullscreen
•	Immersion
•	Gesture
•	Touch
•	Edge-to-edge
•	Minimal controls
Desktop
Prioritize:
•	Comfortable reading area
•	Physical-page illusion
•	Mouse interaction
•	Keyboard shortcuts
•	Larger typography
•	Optional surrounding atmosphere
________________________________________
69. KEYBOARD SUPPORT
Desktop reading should support:
•	Right arrow → next page
•	Left arrow → previous page
•	Escape → exit controls/fullscreen where appropriate
•	Space → contextual page movement where appropriate
Do not make keyboard controls mandatory to understand the interface.
________________________________________
70. NO GENERIC DASHBOARD TEMPLATE
This is a strict requirement.
Do not implement:
Sidebar
+
Header
+
6 statistic cards
+
Grid of cards
+
Generic tables
for every application section.
Each section must have a visual language appropriate to its purpose.
Reading:
editorial
Writer:
creative workspace
Admin:
operations/control
Library:
bookshelf
Discovery:
digital bookstore
________________________________________
71. TRANSITIONS BETWEEN APPLICATION AREAS
Navigation should always maintain context.
Example:
Writer
→ My Books
→ The Book
→ Chapters
→ Chapter 12
→ Editor
The user must be able to move backward and forward naturally.
Provide contextual breadcrumbs or equivalent navigation where useful.
________________________________________
72. EMPTY STATES
Do not use generic:
"No data found."
Instead create meaningful literary/product states.
Example:
"Your bookshelf is waiting for its first story."
Then provide an appropriate action.
Writer:
"Your next story begins here."
Admin:
"Everything is quiet. No moderation issues require attention."
________________________________________
73. LOADING STATES
Avoid generic spinner screens whenever possible.
Use:
•	Skeletons
•	Progressive loading
•	Cover placeholders
•	Editorial transitions
The reading engine should prioritize perceived speed.
________________________________________
74. ERROR STATES
Errors should be human-readable.
Example:
Instead of:
Error 500
Use:
"We couldn't open this chapter right now."
with:
Try again
________________________________________
75. DESIGN SYSTEM
Create reusable design tokens for:
•	Colors
•	Typography
•	Spacing
•	Radius
•	Shadows
•	Borders
•	Icons
•	Animation
•	Breakpoints
But do not allow the design system to force every screen into identical cards.
The design system should support different composition types.
________________________________________
76. COMPONENT ARCHITECTURE
Refactor the frontend into meaningful reusable components.
Examples:
BookCover
BookShelf
BookHero
BookMetadata
ChapterList
ReadingEngine
PageRenderer
PageFlip
ReadingControls
ReadingSettings
CoinBalance
CoinPurchase
LibraryShelf
WriterShell
AdminShell
ChapterEditor
MediaManager
PublishingPanel
AnalyticsView
Avoid giant monolithic components.
________________________________________
77. ROUTING
Separate application routes logically.
Conceptually:
/
 /discover
 /books
 /book/:id
 /read/:bookId/:chapterId
 /library
 /wallet
 /profile

 /writer
 /writer/books
 /writer/books/:id
 /writer/books/:id/chapters
 /writer/books/:id/chapters/:chapterId/edit
 /writer/media
 /writer/analytics

 /admin
 /admin/users
 /admin/writers
 /admin/books
 /admin/chapters
 /admin/moderation
 /admin/payments
 /admin/coins
 /admin/analytics
 /admin/settings
Do not hide these interfaces inside user settings.
________________________________________
78. ROLE-BASED ACCESS
The UI should reflect permissions.
Reader cannot access writer tools.
Writer cannot access admin operations unless explicitly granted both roles.
Admin can manage platform operations.
Future multi-role users should be supported.
________________________________________
79. WRITER + ADMIN FOR CURRENT OWNER
The current owner may possess:
ADMIN
+
WRITER
Provide a clean application switcher where appropriate.
Example:
SOMI Reader
SOMI Writer
SOMI Admin
Do not merge all three interfaces.
________________________________________
80. FINAL VISUAL TARGET
The final product should resemble a combination of:
Premium digital bookstore
+
immersive ebook reader
+
professional publishing studio
+
modern content administration platform
but should NOT visually copy any competitor.
Take inspiration from the strongest interaction patterns of platforms such as MoboReader, Wattpad and Webnovel while creating an original SOMI identity.
________________________________________
81. PRIORITY ORDER FOR THIS REDESIGN
Implement improvements in this order:
P0 — Critical
1.	Fullscreen immersive reading
2.	Correct page-flip interaction
3.	Edge-to-edge mobile reading
4.	Light/Sepia/Dark themes
5.	Remove unnecessary reading cards
6.	Proper reader/writer/admin separation
7.	Complete writer navigation
8.	Rich chapter editor
9.	Responsive architecture
10.	Functional admin application
P1 — High priority
11.	Book discovery redesign
12.	Library redesign
13.	Writer publishing workflow
14.	Cover/media management
15.	Chapter management
16.	Reader settings
17.	Offline reading UX
18.	Wallet/coin UX
P2 — Refinement
19.	Analytics
20.	Animations
21.	Advanced editorial discovery
22.	Advanced writer analytics
23.	Advanced moderation
24.	Micro-interactions
________________________________________
82. IMPORTANT IMPLEMENTATION RULE
DO NOT modify one screen at a time without considering the complete application.
Before making changes:
1.	Audit all existing routes.
2.	Audit all existing screens.
3.	Audit current components.
4.	Audit existing navigation.
5.	Identify duplicated components.
6.	Identify broken flows.
7.	Identify missing routes.
8.	Identify inconsistent design patterns.
Then perform the redesign systematically.
________________________________________
83. DO NOT BREAK EXISTING FUNCTIONALITY
Preserve existing:
•	Authentication
•	Book data
•	Chapter data
•	Wallet logic
•	Coin logic
•	Reading functionality
•	Existing APIs
•	Existing working interactions
unless a change is explicitly required to support the new architecture.
The goal is:
Refactor + improve + complete
not:
delete + recreate a visual mockup.
________________________________________
84. VALIDATION REQUIREMENTS
After implementation, test at minimum:
Reader
•	Discover book
•	Open book
•	Read free chapter
•	Register
•	Login
•	Purchase coins
•	Unlock chapter
•	Flip pages
•	Go backward
•	Go forward
•	Bookmark
•	Change theme
•	Change font size
•	Resume reading
•	Offline reading
Writer
•	Enter writer application
•	Create book
•	Upload cover
•	Edit metadata
•	Create chapter
•	Edit rich content
•	Insert illustration
•	Preview
•	Set price
•	Mark free
•	Schedule
•	Publish
•	Navigate previous/next chapter
•	View analytics
Admin
•	Enter admin application
•	Manage users
•	Manage writers
•	Manage books
•	Manage chapters
•	Moderate reports
•	Configure coins
•	View transactions
•	View analytics
•	Manage homepage
•	Manage notifications
•	Review audit logs
Responsive
Test:
•	320px mobile
•	375px mobile
•	390px mobile
•	430px mobile
•	tablet portrait
•	tablet landscape
•	laptop
•	1440px desktop
•	large desktop
________________________________________
85. FINAL INSTRUCTION TO FIGMA MAKE
Do not merely make SOMI "look better."
Transform the current application into a coherent product.
The most important experience is:
A reader opens a story → the interface disappears → the book occupies the screen → the reader physically flips pages → the story becomes the interface.
The second most important experience is:
A writer enters SOMI Writer → creates and edits a book → formats chapters → adds illustrations → previews the exact reader experience → sets pricing → schedules/releases chapters.
The third is:
An administrator enters SOMI Admin → manages the platform, users, writers, books, content, payments, coins and analytics without interfering with the writing experience.
SOMI must feel like a real product built by a professional product team, not a collection of AI-generated screens.
Prioritize:
Immersion > decoration
Typography > cards
Books > dashboards
Content > containers
Interaction quality > visual gimmicks
Physical page behavior > simple 3D rotation
Contextual navigation > isolated screens
Professional publishing workflow > generic CRUD
Responsive architecture > desktop squeezed onto mobile
SOMI's identity > imitation of competitors
Before finishing, inspect every major route and ensure there are no dead ends, placeholder screens, fake buttons, inaccessible sections, inconsistent navigation patterns or unfinished admin/writer functionality.

