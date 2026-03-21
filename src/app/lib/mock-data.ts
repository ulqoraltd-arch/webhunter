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
  { id: '1', name: 'SaaS Competitors - UK', status: 'Completed', emails: 4231, domains: 12000, date: '2024-03-20' },
  { id: '2', name: 'Real Estate Leads - Miami', status: 'Running', progress: 65, emails: 2100, domains: 8500, date: '2024-03-21' },
  { id: '3', name: 'E-commerce Platforms - EU', status: 'Paused', emails: 890, domains: 4500, date: '2024-03-19' },
  { id: '4', name: 'Tech Agencies - London', status: 'Completed', emails: 1240, domains: 5200, date: '2024-03-18' },
];

export const notifications = [
  { id: '1', title: 'Campaign Completed', description: 'SaaS Competitors - UK campaign has finished.', time: '2 mins ago', unread: true },
  { id: '2', title: 'Export Ready', description: 'Your export for Miami Leads is ready for download.', time: '1 hour ago', unread: true },
  { id: '3', title: 'System Warning', description: 'API 3 is currently experiencing higher latency.', time: '5 hours ago', unread: false },
  { id: '4', title: 'New Admin Added', description: 'User "Sarah Miller" was added as an administrator.', time: '1 day ago', unread: false },
];

export const chartData = [
  { name: 'Mon', emails: 4200 },
  { name: 'Tue', emails: 3800 },
  { name: 'Wed', emails: 5100 },
  { name: 'Thu', emails: 4600 },
  { name: 'Fri', emails: 6200 },
  { name: 'Sat', emails: 3100 },
  { name: 'Sun', emails: 2400 },
];

export const activityLog = [
  { id: '1', action: 'Scraped', target: 'digitalocean.com', result: '3 emails found', time: '12:04:31' },
  { id: '2', action: 'Validated', target: 'contact@stripe.com', result: 'Valid', time: '12:04:22' },
  { id: '3', action: 'Failed', target: 'private-domain.net', result: '403 Forbidden', time: '12:04:15' },
  { id: '4', action: 'Scraped', target: 'vercel.com', result: '12 emails found', time: '12:04:05' },
];