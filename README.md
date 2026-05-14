# Project Setup

A unified Node.js and React application implementing a UI that **doesn't suck** for SearXNG.

## Preview

| Home Screen | Autocomplete |
| :---: | :---: |
| ![Home](https://cf-cdn.noemt.dev/img/Looko-Home.png) | ![Autocomplete](https://cf-cdn.noemt.dev/img/Looko-Autocomplete.png) |
| **Search Results** | **Image Search** |
| ![Results](https://cf-cdn.noemt.dev/img/Looko-Results.png) | ![Images](https://cf-cdn.noemt.dev/img/Looko-Images.png) |

## Prerequisites

* **Node.js** (v18.x or higher)
* **SearXNG** (Must be running somewhere)

---

## 1. SearXNG Configuration (Required)

For the API to communicate with SearXNG, the **JSON format** must be enabled in your instance settings.

1. Open your SearXNG `settings.yml`.
2. Add `json` to the `formats` list under the `search` section:

```yaml
search:
    formats:
        - html
        - json
```

3. Restart SearXNG. By default, it should be accessible at `http://127.0.0.1:8888`.

---

## 2. Environment Variables

Rename the `.env.local.example` file in the project root to `.env.local`:

```text
PORT=37837
SEARXNG_URL=http://127.0.0.1:8888
```

---

## 3. Installation

**Install all dependencies:**

```bash
npm install
```

**Build the frontend:**

```bash
npm run build
```

**Run the Application:**

```bash
node index.js
```

---

## 4. Production Deployment & Upkeep

For a production environment, you shouldn't run the app with `node index.js` plainly. You need a process manager to handle restarts and background execution.

### Option A: Using PM2 (Recommended)

PM2 is the industry standard for Node.js process management. It will automatically restart your app if it crashes or if the server reboots.

**1. Install PM2 globally:**

```bash
npm install pm2 -g
```

**2. Start the application:**

```bash
pm2 start index.js --name "looko-app"
```

**3. Useful Commands:**

* `pm2 list` — View running processes.
* `pm2 logs` — View real-time error/output logs.
* `pm2 restart looko-app` — Restart the app after code changes.
* `pm2 save` — Saves the process list for automatic start on server reboot.

---

### Option B: Using Systemd (Linux Servers)

If you want to manage your app like a native system service on Ubuntu/Debian/CentOS without extra tools:

1. Create a service file: `sudo nano /etc/systemd/system/looko.service`
2. Paste the following configuration:

```ini
[Unit]
Description=Node.js SearXNG App
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/node /path/to/your/project/index.js
Restart=on-failure
Environment=PORT=37837
Environment=SEARXNG_URL=http://your-instance:8888

[Install]
WantedBy=multi-user.target
```

3. **Enable and Start:**

```bash
sudo systemctl enable looko
sudo systemctl start looko
```

---

## 5. Maintenance & Logs

* **Standard Logs:** If using PM2, logs are stored in `~/.pm2/logs/`.
* **Updating:** To update the app, pull the latest changes, run `npm install`, rebuild the frontend, and restart the process:

```bash
git pull
npm install
npm run build
pm2 restart looko-app
```

* **SearXNG Check:** If the app returns 500 errors, verify that your SearXNG instance is still reachable and that the `json` format hasn't been disabled in its `settings.yml`.