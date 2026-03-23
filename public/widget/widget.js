(function () {
  class ChatWidget {
    documentChat;
    socket;
    constructor(config) {
      this.config = config;
      this.render();
    }

    async render() {
      const html = `
          <div id="chat-widget-container">
  <div id="chat-window" class="overflow-hidden">
    <div class="chat-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <div class="position-relative">
          <div class="agent-avatar shadow-sm">
            <i data-lucide="headset" class="text-white" style="width: 20px"></i>
          </div>
        </div>
        <div class="header-info">
          <h6 class="mb-0 fw-bold">Matheus Nunes</h6>
          <div class="d-flex align-items-center gap-1">
            <small id="msg_welcome" class="text-white-50"></small>
          </div>
        </div>
      </div>
      <button
        type="button"
        class="btn-close-custom"
        onclick="toggleChat()"
        aria-label="Fechar"
      >
        <i data-lucide="x" style="width: 20px; height: 20px"></i>
      </button>
    </div>

    <div id="messages" class="d-flex flex-column"></div>

    <div class="chat-footer">
      <form id="msg_form" name="msg_form">
        <div class="input-container">
          <input
            type="text"
            id="msg"
            name="msg"
            placeholder="Escreva aqui..."
            autocomplete="off"
          />
          <button type="submit" class="btn p-0 ms-2 border-0">
            <i
              data-lucide="send-horizontal"
              style="width: 20px; color: var(--chat-primary)"
            ></i>
          </button>
        </div>
      </form>
    </div>
  </div>

  <div id="chat-bar-toggle" onclick="toggleChat()">
    <div class="d-flex align-items-center gap-2">
      <div class="toggle-icon-wrapper">
        <i data-lucide="message-circle" class="toggle-icon"></i>
        <span id="chat-notification-badge" class="notification-badge">1</span>
      </div>
      <span class="toggle-text">Fale conosco</span>
    </div>
    <i
      data-lucide="chevron-up"
      class="ms-auto opacity-50"
      style="width: 16px"
    ></i>
  </div>
</div>
`;

      document.body.insertAdjacentHTML("beforeend", html);
      this.loadBootstrap();
      this.injectCSS();
      this.toggleChat();
      await this.loadScript("https://unpkg.com/lucide@latest");
      lucide.createIcons();

      await this.loadScript(this.config.socketUrl + "/socket.io/socket.io.js");
      let socket = io(this.config.socketUrl + "/suport");

      const form = document.querySelector("#msg_form");
      const USER_ID = this.config.userId;
      let role = this.config.role;

      // CONEXÃO SOCKET
      socket.on("connect", () => {
        socket.emit(
          "room:user",
          {
            userID: USER_ID,
          },
          (res) => {
            console.log(res.load_user[0]);
            document.querySelector("#msg_welcome").innerHTML =
              "Bem vindo, " + res.load_user[0].user + "!";
            socket.emit("request:message", { userID: USER_ID });
          },
        );

        socket.on("update:message", async (message) => {
          console.log("es");
          updateMessagesOnScreen(message);
        });
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const message = document.forms["msg_form"]["msg"].value;
        document.forms["msg_form"]["msg"].value = "";

        if (message.trim() == "") {
          alert("A mensagem não pode ser vazia!");
          return;
        }

        document.forms["msg_form"]["msg"].value = "";

        socket.emit(
          "insert:msg",
          { userID: USER_ID, message, status: "user" },
          (res) => {
            console.log(res);
            if (res.status) {
              socket.emit("request:message", { userID: USER_ID });
            }
          },
        );
      });

      function updateMessagesOnScreen(msgs) {
        const div_msg = document.querySelector("#messages");

        if (!msgs || msgs.length === 0) return;

        let html_content = "";
        let lastDate = null;
        let welcomeSentForToday = false;

        const today = "16/03/2026";
        const yesterday = "15/03/2026";

        msgs
          .filter((msg) => msg.message && msg.message.trim() !== "")
          .forEach((msg) => {
            let currentDate = "";
            if (msg.data) {
              const [datePart] = msg.data.split(" ");
              const [year, month, day] = datePart.split("-");
              currentDate = `${day}/${month}/${year}`;
            }

            // 1. LÓGICA DE SEPARADOR DE DATA
            if (currentDate !== lastDate) {
              let dateLabel = currentDate;
              if (currentDate === today) dateLabel = "Hoje";
              else if (currentDate === yesterday) dateLabel = "Ontem";

              html_content += `
                <div class="chat-date-separator">
                    <span class="chat-date-text">${dateLabel}</span>
                </div>
              `;
              lastDate = currentDate;
            }

            // 2. LÓGICA DE BOAS-VINDAS (Somente cliente na primeira do dia)
            if (
              currentDate === today &&
              msg.status !== "admin" &&
              !welcomeSentForToday
            ) {
              const name = msg.user || "Usuário";
              html_content += `
          <div class="welcome-badge">
              Bem-vindo, ${name.replace(/[ï¿½_]/g, " ")}
          </div>
        `;
              welcomeSentForToday = true;
            }

            // 3. RENDERIZAÇÃO DA BOLHA
            const sideClass =
              msg.status === "user" ? "msg-sent" : "msg-received";
            const time = msg.data
              ? `<span class="msg-time">${msg.data.slice(11, 16)}</span>`
              : "";

            html_content += `
        <div class="msg-bubble ${sideClass} shadow-sm">
            <div class="msg-text">${msg.message}</div>
            ${time}
        </div>
      `;
          });

        div_msg.innerHTML = html_content;
        // div_msg.insertAdjacentHTML("beforeend", html_content);

        // 4. ROLAGEM FLUIDA
        // O setTimeout de 0 ou 50ms é essencial para o navegador renderizar o HTML
        // antes de calcular a posição do scroll.
        setTimeout(() => {
          div_msg.scrollTo({
            top: div_msg.scrollHeight,
            behavior: "smooth",
          });
        }, 50);
      }
    }

    injectCSS() {
      const css = `


  :root {
    --chat-primary: #29cc5a;
    --chat-secondary: #f4f6f9;
    --chat-text: #333;
  }

   /* Timestamp (Opcional - caso queira adicionar hora depois) */
      .msg-time {
        display: block;
        font-size: 0.7rem;
        margin-top: 4px;
        opacity: 0.7;
        text-align: right;
      }

  #chat-widget-container {
    position: fixed;
    bottom: 0; /* Colado no fundo */
    right: 30px;
    z-index: 2000;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* Janela de Chat */
  #chat-window {
    width: 370px;
    height: 550px;
    display: none;
    flex-direction: column;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
    border: none;
    background: #fff;
    border-radius: 12px 12px 0 0; /* Arredondado só em cima */
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Customização do Toggle */
  #chat-bar-toggle {
    background: linear-gradient(135deg, var(--chat-primary) 0%, #24b34e 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 12px 12px 0 0; /* Arredondado igual ao header */
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    box-shadow: 0 -4px 15px rgba(41, 204, 90, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 220px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: none;
  }

  #chat-bar-toggle:hover {
    transform: translateY(-2px);
    box-shadow: 0 -6px 20px rgba(41, 204, 90, 0.3);
  }

  .toggle-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .toggle-icon {
    width: 20px;
    height: 20px;
  }

  /* Badge de Notificação Estilo iOS */
  .notification-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #ff3b30; /* Vermelho vibrante de alerta */
    color: white;
    font-size: 0.65rem;
    font-weight: bold;
    min-width: 18px;
    height: 18px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--chat-primary);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    animation: bounceIn 0.5s cubic-bezier(0.36, 0, 0.66, -0.56) alternate;
    display: none; /* Escondido por padrão, ative via JS */
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0);
    }
    70% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }

  .toggle-text {
    font-size: 0.9rem;
    letter-spacing: -0.3px;
  }

  /* Cabeçalho */
  /* Refinamento do Cabeçalho */
  .chat-header {
    background: linear-gradient(135deg, var(--chat-primary) 0%, #24b34e 100%);
    padding: 1.25rem 1.5rem;
    color: white;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .agent-avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px; /* Estilo iOS/Moderno */
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .header-info h6 {
    font-size: 0.95rem;
    letter-spacing: -0.2px;
  }

  /* Indicador Pulsante */
  .status-dot-pulse {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    background-color: #ffffff;
    border-radius: 50%;
    border: 2px solid var(--chat-primary);
  }

  .status-dot-pulse::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #fff;
    border-radius: 50%;
    animation: pulse-status 2s infinite;
  }

  @keyframes pulse-status {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(2.5);
      opacity: 0;
    }
  }

  /* Botão Fechar Customizado */
  .btn-close-custom {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    padding: 5px;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-close-custom:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: rotate(90deg);
  }

  .status-text-live {
    width: 6px;
    height: 6px;
    background: #fff;
    border-radius: 50%;
  }

  /* Área de Mensagens */
  #messages {
    flex-grow: 1;
    overflow-y: auto;
    background-color: #ffffff;
    padding: 15px;
  }

  .msg-bubble {
    max-width: 85%;
    padding: 8px 14px;
    margin-bottom: 10px;
    font-size: 0.9rem;
    border-radius: 15px;
  }

  .msg-received {
    background: var(--chat-secondary);
    align-self: flex-start;
  }

  .msg-sent {
    background: var(--chat-primary);
    color: white;
    align-self: flex-end;
  }

  /* Input */
  .chat-footer {
    padding: 12px;
    border-top: 1px solid #eee;
  }

  .input-container {
    background: #f0f2f5;
    border-radius: 20px;
    padding: 5px 15px;
    display: flex;
    align-items: center;
  }

  .input-container input {
    border: none;
    background: transparent;
    outline: none;
    width: 100%;
    font-size: 0.9rem;
  }

  #messages {
    display: flex;
    flex-direction: column;
    gap: 10px; /* Espaço entre as bolhas */
    overflow-y: auto;
  }

  .msg-bubble {
    max-width: 80%;
    padding: 8px 15px;
    border-radius: 18px;
    margin-bottom: 5px;
  }

  .msg-received {
    align-self: flex-start;
    background-color: #f0f2f5;
    color: #333;
    border-bottom-left-radius: 4px; /* Pontinha do balão */
  }

  .msg-sent {
    align-self: flex-end;
    background-color: #29cc5a;
    color: white;
    border-bottom-right-radius: 4px; /* Pontinha do balão */
  }

  /* Divisor de data estilo WhatsApp */
  .chat-date-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
    position: relative;
  }

  .chat-date-text {
    background: rgba(0, 0, 0, 0.05);
    color: #666;
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  /* Mensagem de Boas-vindas */
  .welcome-badge {
    text-align: center;
    margin: 15px auto;
    color: #888;
    font-size: 0.8rem;
    background: rgba(0, 0, 0, 0.03);
    padding: 6px 20px;
    border-radius: 20px;
    width: fit-content;
    border: 1px dashed #ddd;
  }
      `;

      const style = document.createElement("style");
      style.innerHTML = css;
      document.head.appendChild(style);
    }

    toggleChat() {
      const chatWin = document.getElementById("chat-window");
      const chatBar = document.getElementById("chat-bar-toggle");

      if (chatWin.style.display === "none" || chatWin.style.display === "") {
        chatWin.style.display = "flex";
        chatBar.style.display = "none"; // Esconde a barra quando o chat abre
      } else {
        chatWin.style.display = "none";
        chatBar.style.display = "flex"; // Mostra a barra quando o chat fecha
      }
    }

    loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          return resolve();
        }

        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
      });
    }

    loadCSS(href) {
      if (document.querySelector(`link[href="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;

      document.head.appendChild(link);
    }

    loadBootstrap() {
      const link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.href =
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css";
      document.head.appendChild(link);
    }
  }

  // Inicialização
  window.ChatWidget = {
    init(config) {
      new ChatWidget(config);
    },
  };
})();
