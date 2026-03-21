
# WebHunter Pro - Ubuntu VPS Hardening Guide (Contabo)

Follow these steps on your Ubuntu server to secure the environment before deployment.

## 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Firewall (UFW) Configuration
Strictly control inbound traffic.
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

## 3. Fail2Ban Installation
Protects against brute-force attacks by banning suspicious IPs.
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 4. Node.js & PM2 Installation
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 5. Redis Security
Ensure Redis is only listening on localhost.
```bash
# Check config
sudo nano /etc/redis/redis.conf
# Ensure line "bind 127.0.0.1" is present
# Add a password if needed: "requirepass YOUR_STRONG_PASSWORD"
sudo systemctl restart redis-server
```

## 6. Nginx Reverse Proxy
```bash
sudo apt install nginx -y
# Copy docs/nginx.conf to /etc/nginx/sites-available/webhunter
# Symlink and reload
sudo ln -s /etc/nginx/sites-available/webhunter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```
