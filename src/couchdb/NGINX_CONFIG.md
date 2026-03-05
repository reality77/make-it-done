# Note about nginx config

In the `location` part, add this 
```
    location / {
        proxy_pass http://getitdone:5984;
        proxy_cookie_flags ~ secure samesite=none;
    }
```