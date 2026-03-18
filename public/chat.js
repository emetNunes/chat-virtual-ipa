let userId;
const role = "admin";
const socket = io();

socket.on("send_userSelect", (user) => {
  const userName = user[0].user;
  document.getElementById("name_user").innerHTML =
    userName == "" ? "Usuário desconhecido" : userName;
});

socket.on("sendUser", (users) => {
  console.log(users);
  const container = document.querySelector("#account_users");
  let usersArray = Array.isArray(users) ? users : [users];

  usersArray.sort((a, b) => new Date(a.data) - new Date(b.data));

  usersArray.forEach((data) => {
    let userName = data.user || "Usuário Desconhecido";
    const dataFormatada = formatDate(data.data);
    userName = userName.replace(/[ï¿½]/g, "").replace(/_/g, " ").trim();

    let userElement = document.getElementById(data.id_user);

    if (!userElement) {
      const userHtml = `
      <div id="${data.id_user}" onclick="getClientID(this)" class="user-card">
        <div class="avatar-circle">
          <i data-lucide="user" class="text-muted"></i>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold text-truncate user-name" style="max-width:140px;text-transform:capitalize">
              ${userName.toLowerCase()}
            </h6>
            <small class="text-muted user-date" style="font-size:0.65rem">
              ${dataFormatada}
            </small>
          </div>
          <p class="mb-0 text-muted small text-truncate user-message">
            ${data.message || "Sem mensagens"}
          </p>
        </div>
      </div>`;
      container.insertAdjacentHTML("afterbegin", userHtml);
    } else {
      // Atualiza os dados
      userElement.querySelector(".user-date").textContent = dataFormatada;
      userElement.querySelector(".user-message").textContent =
        data.message || "Sem mensagens";

      // Move para o topo de forma suave
      if (container.firstChild !== userElement) {
        container.prepend(userElement);

        // Adiciona um efeito visual de "piscada" para indicar atualização
        userElement.classList.add("new-update");
        setTimeout(() => userElement.classList.remove("new-update"), 1000);
      }
    }
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

socket.on("send_connection", (data) => {
  let status = document.getElementById("status");
  status.innerHTML = data.status;
  status.className = data.status == "online" ? "text-success" : "text-danger";
});

socket.on("update_msg", (message) => {
  updateMessagesOnScreen(message);
});

function updateMessagesOnScreen(msgs) {
  const div_msg = document.querySelector("#messages");

  // 1. Controle de visibilidade para o Admin
  const header = document.querySelector(".chat-header");
  const footer = document.querySelector(".admin-footer");

  if (userId !== null) {
    if (header) header.classList.remove("hidden-chat-element");
    if (footer) footer.classList.remove("hidden-chat-element");
  }

  console.log(msgs);
  if (!msgs || msgs.length === 0) return;

  let html_content = "";
  let lastDate = null;
  let welcomeSentForToday = false;

  // Datas de referência (16/03/2026)
  const today = "16/03/2026";
  const yesterday = "15/03/2026";

  // 2. FILTRAGEM E LOOP ÚNICO (Removido o loop duplicado do seu código anterior)
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
      const sideClass = msg.status === "admin" ? "msg-sent" : "msg-received";
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

  // 3. ATUALIZAÇÃO DO DOM
  // div_msg.innerHTML = html_content;
  div_msg.insertAdjacentHTML("beforeend", html_content);

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

function setEmptyState() {
  const div_msg = document.querySelector("#messages");
  const header = document.querySelector(".chat-header");
  const footer = document.querySelector(".admin-footer");

  header.classList.add("hidden-chat-element");
  footer.classList.add("hidden-chat-element");

  div_msg.innerHTML = `
        <div class="empty-chat-state">
            <div class="empty-chat-icon">
                <i data-lucide="messages-square" style="width: 40px; height: 40px; color: #29cc5a;"></i>
            </div>
            <h4>Suporte IPAchat</h4>
            <p>Selecione um cliente na lista ao lado para iniciar o atendimento em tempo real.</p>
        </div>
    `;

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

let clientSelect = null;
function getClientID(client) {
  if (clientSelect) {
    if (clientSelect == client) {
      return;
    } else {
      clientSelect.className = "user-card";
    }
  }
  client.className = "user-card active";
  clientSelect = client;

  userId = client.id;
  document.querySelector("#messages").innerHTML = "";
  socket.emit("join_chat", { userId, role });
  console.log("Iniciando chat com:", userId);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#msg_form");

  socket.on("connect", () => {
    if (userId == null || userId == "") {
      setEmptyState();
    }

    socket.emit("join_chat", { userId, role });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!userId) {
      alert("Defina um usuario!");
      return;
    }

    const message = document.forms["msg_form"]["msg"].value;
    document.forms["msg_form"]["msg"].value = "";

    // saveMessage(userId, message);

    // socket.emit("admin_msg", {
    //   userId,
    // });
  });
});

async function saveMessage(userId, message) {
  await fetch("https://ipa-edu.com.br/ipasis/adm/send_message.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      message,
      status: "admin",
    }),
  });

  socket.emit("recoveredMessage", { userId });
}

function formatDate(data) {
  const d = new Date(data);

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();

  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}
