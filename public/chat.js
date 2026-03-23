let USER_ID;
const adminID = 1;
const role = "admin";
const socket = io("/suport");
import Hooks from "/hook";

const hooks = new Hooks();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#msg_form");

  socket.on("connect", () => {
    if (!USER_ID) hooks.setEmptyState();

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
  document.addEventListener("click", async function (event) {
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
          socket.emit("request:message", { userID: card.id });
          socket.emit("request:connections", { userID: card.id });
          document.getElementById("name_user").innerHTML =
            res.load_user[0].user == ""
              ? "Usuário desconhecido"
              : res.load_user[0].user;
        });
      }
    }

    // Recupara todas as mensagens do Usuario clicado
    socket.on("update:message", async (message) => {
      hooks.updateMessagesOnScreen(message);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    console.log(USER_ID);

    if (!USER_ID) {
      alert("Selecione um usuario!");
      return;
    }

    const message = document.forms["msg_form"]["msg"].value;

    if (message.trim() == "") {
      alert("A mensagem não pode ser vazia!");
      return;
    }

    document.forms["msg_form"]["msg"].value = "";

    socket.emit(
      "insert:msg",
      { userID: USER_ID, message, status: "admin" },
      (res) => {
        socket.emit("request:message", { userID: USER_ID });
        if (res.status) {
        }
      },
    );
  });
});

socket.on("update:connections", async (status_users) => {
  const user = status_users.find((u) => u.userId === USER_ID);

  console.log(USER_ID);
  console.log(status_users);

  let status_user = "offline";
  if (user) {
    status_user = "online";
  }

  let status = document.getElementById("status");

  status.innerHTML = status_user;
  status.className = status_user == "online" ? "text-success" : "text-danger";
});
