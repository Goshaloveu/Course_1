sudo cat > /etc/nginx/sites-available/yl.com.ru << 'EOL'
# HTTP-сервер (будет автоматически обновлен certbot)
server {
    listen 80;
    server_name yl.com.ru;
    
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

sudo ln -sf /etc/nginx/sites-available/yl.com.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx