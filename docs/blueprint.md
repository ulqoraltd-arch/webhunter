# **App Name**: WebHunter Pro

## Core Features:

- Dashboard Analytics & Notifications: Comprehensive analytics dashboard displaying key scraping metrics, campaign performance charts, and real-time activity logs. Includes a global notification system with a bell icon, unread bubble count, and a popover dropdown showing recent system events.
- Advanced Campaign Builder with AI Keywords: Create new scraping campaigns using a structured form to define keywords, TLDs, categories, countries, and target result counts. An integrated AI tool suggests long-tail and short-tail keywords for auto-filling inputs.
- Real-time Scraping Progress Monitor: Live tracking of active campaign progress, including total URLs, processed count, remaining tasks, and valid domains, updated in real-time using Socket.IO for immediate feedback.
- Extracted Data Management & Export: Browse scraped domain results in a table, with detailed views available via a sliding sheet, displaying emails and page URLs. Provides options for exporting data per domain or bulk exporting entire datasets.
- Email Validation & Categorization: Dedicated page to view and manage extracted emails, automatically splitting and displaying them as 'Valid Emails' or 'Flagged Emails' based on MX record validation logic.
- SaaS Admin Panel & Permissions: Centralized control panel for managing admin users (create, edit, delete), setting page-specific permissions, and maintaining foundational data like TLDs, categories, and countries while preventing duplicates.
- Scalable Data Persistence & Storage: Leverages Firestore for efficient and reliable storage of all campaign configurations, user management data, and extracted scraping results, ensuring data integrity and scalability for a production SaaS platform.

## Style Guidelines:

- The visual design draws inspiration from concepts of precision, data analytics, and modern technology. The chosen dark color scheme aims for a sophisticated and professional appearance, reducing eye strain for prolonged use.
- Primary Color: A vibrant, deep indigo (#4747EB) was selected for its association with reliability and innovation. It provides a striking contrast against the dark background, highlighting interactive elements and key data points.
- Background Color: A subtle, dark charcoal with a hint of the primary hue (#14141F) creates a premium backdrop, ensuring optimal readability and focusing user attention on content and functional elements.
- Accent Color: A bright cyan-blue (#5AD4FF) is used as an accent. Its distinct hue and brightness provide an energetic highlight for notifications, status indicators, and important calls to action, ensuring clarity and drawing immediate attention.
- Headline font: 'Space Grotesk' (sans-serif) for its modern, techy, and slightly condensed appearance, ideal for dashboard titles and campaign names. Body font: 'Inter' (sans-serif) for its neutrality, readability, and clean lines, perfect for tables, logs, and general body text.
- Code snippets and monospaced text, particularly for any regex or configuration examples, will use 'Source Code Pro' (monospace sans-serif) to ensure clarity and standard coding readability.
- Utilize a consistent set of clean, minimalist line-art or filled icons, complementing the modern aesthetic of Shadcn UI components. Icons should clearly communicate their function and be easily discernible on a dark background.
- Adopt a classic SaaS dashboard layout with a fixed, collapsed sidebar navigation and a sticky top header containing key stats and the notification system. The main content area will feature well-spaced 'modern cards' for data visualization and feature grouping, adhering to a responsive grid system.
- Implement subtle and fluid animations to enhance user experience, such as smooth transitions for navigation changes, data loading states, interactive chart updates, and element hover effects. Avoid excessive or distracting animations to maintain a professional and efficient feel.