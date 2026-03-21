export const stats = [
  { label: 'Total Campaigns', value: '124', change: '+12%', icon: 'Folder' },
  { label: 'Active Campaigns', value: '3', change: 'Live', icon: 'Play', color: 'text-accent' },
  { label: 'Emails Extracted', value: '84,231', change: '+24%', icon: 'Mail' },
  { label: 'Valid Emails', value: '72,109', change: '85.6%', icon: 'CheckCircle' },
  { label: 'Flagged Emails', value: '12,122', change: '14.4%', icon: 'AlertTriangle', color: 'text-destructive' },
  { label: 'Domains Scraped', value: '412,098', change: '+8%', icon: 'Globe' },
  { label: 'Success Rate', value: '92.4%', change: '+2.1%', icon: 'Target' },
  { label: 'System Status', value: 'Running', change: 'Idle', icon: 'Cpu', color: 'text-accent' },
];

export const recentCampaigns = [
  { id: '1', name: 'SaaS Competitors - UK', status: 'Completed', emails: 4231, domains: 12000, date: '2024-03-20', progress: 100 },
  { id: '2', name: 'Real Estate Leads - Miami', status: 'Running', progress: 65, emails: 2100, domains: 8500, date: '2024-03-21' },
  { id: '3', name: 'E-commerce Platforms - EU', status: 'Paused', emails: 890, domains: 4500, date: '2024-03-19', progress: 32 },
  { id: '4', name: 'Tech Agencies - London', status: 'Completed', emails: 1240, domains: 5200, date: '2024-03-18', progress: 100 },
];

export const notifications = [
  { id: '1', title: 'Campaign Started', description: 'Miami Leads - Expansion engine has been initialized.', time: 'Just now', unread: true, type: 'campaignStarted' },
  { id: '2', title: 'Export Completed', description: 'SaaS Competitors - UK CSV is ready for download.', time: '12 mins ago', unread: true, type: 'exportCompleted' },
  { id: '3', title: 'System Warning', description: 'API Node #4 is experiencing higher than usual latency.', time: '1 hour ago', unread: false, type: 'error' },
  { id: '4', title: 'Campaign Completed', description: 'Real Estate Leads - Miami has reached its 2000 domain quota.', time: '2 hours ago', unread: false, type: 'campaignCompleted' },
];

export const chartData = [
  { name: 'Mon', emails: 4200, domains: 12000 },
  { name: 'Tue', emails: 3800, domains: 10500 },
  { name: 'Wed', emails: 5100, domains: 15000 },
  { name: 'Thu', emails: 4600, domains: 13200 },
  { name: 'Fri', emails: 6200, domains: 18000 },
  { name: 'Sat', emails: 3100, domains: 9000 },
  { name: 'Sun', emails: 2400, domains: 7500 },
];

export const activityLog = [
  { id: '1', action: 'Scraped', target: 'digitalocean.com', result: '3 emails found', time: '12:04:31' },
  { id: '2', action: 'Validated', target: 'contact@stripe.com', result: 'Valid', time: '12:04:22' },
  { id: '3', action: 'Failed', target: 'private-domain.net', result: '403 Forbidden', time: '12:04:15' },
  { id: '4', action: 'Scraped', target: 'vercel.com', result: '12 emails found', time: '12:04:05' },
  { id: '5', action: 'Queued', target: 'amazon.com', result: 'Batch #882', time: '12:03:55' },
];
