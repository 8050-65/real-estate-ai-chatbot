/**
 * Leadrat AI Chatbot - Embeddable Widget Script
 *
 * Add to any website:
 * <script>
 *   window.LeadratChatConfig = {
 *     apiUrl: "https://real-estate-api-dev.onrender.com/api/v1/chat/message",
 *     botName: "Aria",
 *     tenantId: "dubai11",
 *     primaryColor: "#6C63FF"
 *   };
 * </script>
 * <script src="https://real-estate-ai-chatbot.pages.dev/chatbot-embed.js" async></script>
 */

interface LeadratChatConfig {
  apiUrl: string;
  botName?: string;
  botSubtitle?: string;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  tenantId?: string;
}

class LeadratChat {
  private config: LeadratChatConfig;
  private frameId = "leadrat-chat-frame";
  private launcherId = "leadrat-chat-launcher";
  private isOpen = false;

  constructor() {
    this.config = (window as any).LeadratChatConfig || {};
    this.config.botName = this.config.botName || "AI Assistant";
    this.config.botSubtitle = this.config.botSubtitle || "Powered by Leadrat";
    this.config.primaryColor = this.config.primaryColor || "#6C63FF";
    this.config.position = this.config.position || "bottom-right";
    this.config.tenantId = this.config.tenantId || "dubai11";

    if (!this.config.apiUrl) {
      console.error("LeadratChat: apiUrl is required in window.LeadratChatConfig");
      return;
    }

    this.init();
  }

  private init(): void {
    this.injectStyles();
    this.createLauncher();
    this.createIframe();
    this.setupListeners();
  }

  private injectStyles(): void {
    const styleId = "leadrat-chat-styles";
    if (document.getElementById(styleId)) return;

    const styles = document.createElement("style");
    styles.id = styleId;
    styles.textContent = `
      #${this.launcherId} {
        position: fixed;
        ${this.config.position === "bottom-left" ? "left" : "right"}: 24px;
        bottom: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(108, 99, 255, 0.4);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        padding: 0;
      }

      #${this.launcherId}:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(108, 99, 255, 0.5);
      }

      #${this.launcherId}:active {
        transform: scale(0.95);
      }

      #${this.frameId} {
        position: fixed;
        ${this.config.position === "bottom-left" ? "left" : "right"}: 24px;
        bottom: 90px;
        width: 370px;
        height: 580px;
        border: none;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
        z-index: 999998;
        background: white;
        animation: slideUp 0.3s ease-out;
      }

      #${this.frameId}.hidden {
        display: none;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 480px) {
        #${this.frameId} {
          width: 100%;
          height: 100%;
          ${this.config.position === "bottom-left" ? "left" : "right"}: 0;
          bottom: 0;
          border-radius: 0;
        }

        #${this.launcherId} {
          ${this.config.position === "bottom-left" ? "left" : "right"}: 16px;
          bottom: 16px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  private createLauncher(): void {
    if (document.getElementById(this.launcherId)) return;

    const launcher = document.createElement("button");
    launcher.id = this.launcherId;
    launcher.innerHTML = "💬";
    launcher.setAttribute("aria-label", "Open chat");
    launcher.addEventListener("click", () => this.toggleChat());

    document.body.appendChild(launcher);
  }

  private createIframe(): void {
    if (document.getElementById(this.frameId)) return;

    const iframe = document.createElement("iframe");
    iframe.id = this.frameId;
    iframe.className = "hidden";
    iframe.setAttribute("allow", "camera; microphone");

    // Use data URL to inline chat-ui.html or reference CDN
    // For CDN, this would be: iframe.src = "https://cdn.leadrat.com/chat-ui.html";
    // For now, we'll set it dynamically after build
    iframe.src = this.getChatUIUrl();

    document.body.appendChild(iframe);

    // Wait for iframe to load, then send config
    iframe.addEventListener("load", () => {
      setTimeout(() => {
        this.sendConfigToIframe();
      }, 100);
    });
  }

  private getChatUIUrl(): string {
    // Check if custom iframe URL is provided
    if ((window as any).LeadratChatUIUrl) {
      return (window as any).LeadratChatUIUrl;
    }

    // Auto-detect CDN base URL from this script's src attribute
    const currentScript = document.currentScript as HTMLScriptElement;
    if (currentScript && currentScript.src) {
      const scriptUrl = new URL(currentScript.src);
      const baseUrl = scriptUrl.origin; // e.g., https://leadrat-chat-widget.pages.dev
      return `${baseUrl}/chat-ui.html`;
    }

    // Fallback: try to derive from API URL (old method, for backward compatibility)
    const fallback = this.config.apiUrl.replace('/api/v1/chat', '/embed');
    return fallback;
  }

  private sendConfigToIframe(): void {
    const iframe = document.getElementById(this.frameId) as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        type: "INIT",
        config: this.config,
      },
      "*"
    );
  }

  private setupListeners(): void {
    window.addEventListener("message", (event) => {
      // In production, verify event.origin
      const iframe = document.getElementById(this.frameId) as HTMLIFrameElement;

      switch (event.data.type) {
        case "CLOSE":
          this.closeChat();
          break;

        case "OPEN_LINK":
          if (event.data.url) {
            window.open(event.data.url, "_blank");
          }
          break;

        case "RESIZE":
          if (iframe && event.data.height) {
            iframe.style.height = event.data.height + "px";
          }
          break;
      }
    });
  }

  private toggleChat(): void {
    const iframe = document.getElementById(this.frameId);
    if (!iframe) return;

    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  private openChat(): void {
    const iframe = document.getElementById(this.frameId) as HTMLIFrameElement;
    if (!iframe) return;

    iframe.classList.remove("hidden");
    this.isOpen = true;

    // Focus input after a short delay
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "FOCUS" }, "*");
      }
    }, 300);
  }

  private closeChat(): void {
    const iframe = document.getElementById(this.frameId) as HTMLIFrameElement;
    if (!iframe) return;

    iframe.classList.add("hidden");
    this.isOpen = false;
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new LeadratChat();
  });
} else {
  new LeadratChat();
}

// Export for module usage
(window as any).LeadratChat = LeadratChat;
