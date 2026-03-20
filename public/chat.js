let USER_ID;
const adminID = 1;
const role = "admin";
const socket = io("/suport");
import Hooks from "/hook";

const hooks = new Hooks();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#msg_form");

  socket.on("connect", () => {
    if (!USER_ID) setEmptyState();

    socket.emit(
      "room:admin",
      {
        adminID,
      },
      (res) => {
        console.log(res);

        if (res.status) {
          socket.emit("request:users");
        }
      },
    );

    // Recuperar todos os usuarios cadastrados;
    socket.on("update:users", async (users) => {
      hooks.loadUsersInScreen(users);
    });
  });

  // Recupear room do cliente
  document.addEventListener("click", function (event) {
    const card = event.target.closest(".user-card");

    if (card) {
      const card_notSelect = document.querySelectorAll(".user-card.active");

      if (card_notSelect.length !== 0) {
        if (card_notSelect[0] != card) {
          card_notSelect[0].className = "user-card";
        }
      }

      card.className = "user-card active";
      document.querySelector("#messages").innerHTML = "";

      if (card.id.trim() !== "") {
        USER_ID = card.id;

        socket.emit("request:user", { userID: card.id }, (res) => {
          console.log(res);
          if (res.status) {
          }
        });
      }
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!userId) {
      alert("Defina um usuario!");
      return;
    }

    const message = document.forms["msg_form"]["msg"].value;
    document.forms["msg_form"]["msg"].value = "";

    saveMessage(userId, message);

    socket.emit("admin_msg", {
      userId,
    });
  });
});

socket.on("send_userSelect", (user) => {
  const userName = user[0].user;
  document.getElementById("name_user").innerHTML =
    userName == "" ? "Usuário desconhecido" : userName;
});

socket.on("sendUser", (users) => {
  console.log(users);
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
      const sideClass = msg.status == "admin" ? "msg-sent" : "msg-received";
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
  // div_msg.innerHTML = ;
  div_msg.innerHTML = html_content;
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
