# Leadrat AI Chatbot Widget Integration

## Overview
The Leadrat AI Chatbot widget is a lightweight, embeddable iframe-based chatbot for real estate websites. It supports multitenancy and dynamic configuration.

## Installation

### Basic Setup (Hardcoded Tenant)
```html
<!-- Add this script before closing </body> tag -->
<script async src="https://leadrat-crm-frontend.pages.dev/chatbot-embed.js"></script>
```

### Advanced Setup (Dynamic Multitenancy & Custom Backend)
```html
<script async src="https://leadrat-crm-frontend.pages.dev/chatbot-embed.js"
  data-tenant-id="dubait11"
  data-api-url="https://leadrat-crm-backend.onrender.com"
  data-chatbot-url="https://leadrat-crm-frontend.pages.dev"
  data-position="bottom-right"
  data-theme="dark">
</script>
```

## Configuration Attributes

### Required Attributes
- **`data-tenant-id`** (default: `dubait11`)
  - Identifies which tenant/organization the chatbot belongs to
  - Used for multitenancy support
  - Example: `data-tenant-id="company-a"`, `data-tenant-id="dubait11"`

- **`data-api-url`** (default: `https://leadrat-crm-backend.onrender.com`)
  - Backend API endpoint URL
  - Should point to your deployed Spring Boot + FastAPI backend
  - Example: `data-api-url="https://your-backend.onrender.com"`
  - **IMPORTANT**: Must be a static/stable URL, not `localhost`

### Optional Attributes
- **`data-chatbot-url`** (default: `https://real-estate-ai-chatbot-frontend.pages.dev`)
  - Frontend URL where the chatbot UI is hosted
  - Change if using a custom domain
  - Example: `data-chatbot-url="https://chatbot.mycompany.com"`

- **`data-position`** (default: `bottom-right`)
  - Position of chat button on screen
  - Options: `bottom-right`, `bottom-left`, `top-right`, `top-left`
  - Example: `data-position="bottom-left"`

- **`data-theme`** (default: `dark`)
  - Visual theme
  - Options: `dark`, `light`
  - Example: `data-theme="light"`

## Usage Examples

### Single Tenant Website
```html
<!DOCTYPE html>
<html>
<head>
  <title>Real Estate Company</title>
</head>
<body>
  <h1>Welcome to our properties</h1>
  
  <!-- Simple widget setup -->
  <script async src="https://leadrat-crm-frontend.pages.dev/chatbot-embed.js"
    data-tenant-id="mycompany"
    data-api-url="https://api.mycompany.com">
  </script>
</body>
</html>
```

### Multi-Tenant SaaS Platform
```html
<!-- Dynamic configuration based on current organization -->
<script>
  // Determine current tenant from URL, logged-in user, or environment
  const tenantId = window.location.hostname.split('.')[0]; // e.g., 'company-a' from 'company-a.example.com'
  
  // Create script element dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://leadrat-crm-frontend.pages.dev/chatbot-embed.js';
  script.setAttribute('data-tenant-id', tenantId);
  script.setAttribute('data-api-url', 'https://leadrat-crm-backend.onrender.com');
  script.setAttribute('data-position', 'bottom-right');
  script.setAttribute('data-theme', 'dark');
  document.body.appendChild(script);
</script>
```

### Custom Styling per Tenant
```html
<script>
  // Get tenant-specific theme colors
  const tenantThemes = {
    'dubait11': { color: '#6C63FF', theme: 'dark' },
    'company-b': { color: '#FF6B6B', theme: 'light' },
    'company-c': { color: '#4ECDC4', theme: 'dark' }
  };
  
  const tenantId = 'dubait11'; // Your tenant ID
  const theme = tenantThemes[tenantId];
  
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://leadrat-crm-frontend.pages.dev/chatbot-embed.js';
  script.setAttribute('data-tenant-id', tenantId);
  script.setAttribute('data-api-url', 'https://leadrat-crm-backend.onrender.com');
  script.setAttribute('data-theme', theme.theme);
  document.body.appendChild(script);
</script>
```

## Programmatic API

Once loaded, the widget exposes a JavaScript API:

```javascript
// Open the chat window
window.leadratChatbot.open();

// Close the chat window
window.leadratChatbot.close();

// Toggle the chat window
window.leadratChatbot.toggle();
```

Example:
```html
<button onclick="window.leadratChatbot.open()">Chat with us!</button>
```

## Backend Configuration

The widget communicates with two endpoints:

### FastAPI Backend (Port 8000)
- Processes chat messages
- Endpoint: `POST /api/v1/chat/message`
- Handles: Intent classification, CRM data retrieval, responses

### Spring Boot Backend (Port 8080)
- Manages leads, properties, projects, scheduling
- Endpoints: `/api/leads`, `/api/properties`, `/api/projects`, `/api/scheduling`

**Deployment:**
- Backend should be deployed to a static URL (Render, AWS, Google Cloud, etc.)
- NOT localhost
- Example: `https://leadrat-crm-backend.onrender.com`

## Customization

### Change Widget Colors
The widget CSS uses CSS variables. To customize colors, add this before the widget script:

```html
<style>
  :root {
    --leadrat-primary: #YOUR_COLOR;
    --leadrat-primary-dark: #YOUR_DARKER_COLOR;
  }
</style>
<script async src="https://leadrat-crm-frontend.pages.dev/chatbot-embed.js"></script>
```

## Troubleshooting

### Widget not appearing
- Check browser console for errors
- Verify `data-api-url` is correct and accessible
- Ensure CORS is configured on backend
- Check `data-tenant-id` is valid

### Chat messages not sending
- Verify backend API URL is correct
- Check network tab in DevTools for failed requests
- Ensure tenant ID exists in backend database
- Verify backend services are running

### CORS Errors
- Backend must be configured to accept requests from widget domain
- Add to backend CORS configuration:
  ```
  ALLOWED_ORIGINS=https://your-website.com,https://leadrat-crm-frontend.pages.dev
  ```

## Support
For issues or questions, contact: support@leadrat.com

