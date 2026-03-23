const express = require("express");
const app = express();
const path = require("path");
const socketIO = require("socket.io");
const Users = require("./public/data/Users");
const User = require("./public/data/User");

app.use("/", express.static(path.join(__dirname, "public/widget")));

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.js"));
});
app.get("/hook", (req, res) => {
  res.sendFile(path.join(__dirname, "public/hooks", "Hooks.js"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

const server = app.listen(3000, () => {
  console.log("run app");
});

const io = socketIO(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "*",
  },
});

// FUNCIONAMENTO DO SOCKET

const chats = {};
let onlineUsers = [];
let mapRooms;

const suportNamespace = io.of("/suport");
const users = new Users();

suportNamespace.on("connection", (socket) => {
  socket.on("disconnect", (e) => {
    const user = onlineUsers.find((u) => u.socket === socket.id);

    if (!user) return;

    onlineUsers = onlineUsers.filter((u) => u.socket !== socket.id);
    suportNamespace.to("admin").emit("update:connections", onlineUsers);
  });

  // ADMIN
  socket.on("room:admin", async (adminID, callback) => {
    try {
      if (adminID == "" || !adminID)
        throw new Error("ID do admin incorreto ou vazio!");

      socket.join("admin");

      if (!mapRooms.get("admin"))
        throw new Error("Admin não entrou na sala do painel!");

      callback({
        status: true,
        room: socket.id,
      });
    } catch ({ message }) {
      callback({
        status: false,
        msg: message,
      });
    }
  });

  // Enviar todos os usuarios cadastrados.
  socket.on("request:users", async () => {
    suportNamespace.to("admin").emit("update:users", await users.loadAllUser());
  });

  // Enviar todos os usuarios onlines cadastrados.
  socket.on("request:connections", () => {
    suportNamespace.to("admin").emit("update:connections", onlineUsers);
  });

  socket.on("request:user", async ({ userID }, callback) => {
    try {
      socket.leave();

      if (userID == "") throw new Error("ID do usuario incorreto ou vazio!");

      const user = new User(userID);
      const load_user = await user.loadUser();

      if (load_user.user === "")
        throw new Error("Falha ao carregar informações do usuario!");

      const roomUser = !mapRooms.get(userID);
      socket.join(userID);

      callback({
        id: userID,
        status: true,
        room: roomUser ? "Usuario não tem sala!" : socket.id,
        load_user,
      });
    } catch ({ message }) {
      callback({
        id: userID,
        room: roomUser ? "Usuario não tem sala!" : socket.id,
        status: false,
        msg: message,
        load_user,
      });
    }
  });

  // ------------------------------------------------------------------------
  // GLOBAL
  // Enviar mensagem para o USUARIO/ADMIN
  socket.on("insert:msg", async ({ userID, message, status }, callback) => {
    try {
      if (userID == "") throw new Error("ID do usuario incorreto ou vazio!");

      if (message.trim() == "")
        throw new Error("A mensagem não pode ser vazia!");

      if (status.trim() == "") throw new Error("Status não informado!");

      const user = new User(userID);
      const save_message = await user.saveMessage(message, status);

      suportNamespace
        .to(userID)
        .emit("update:message", await user.loadMessages());

      suportNamespace
        .to("admin")
        .emit("update:users", await users.loadAllUser());

      if (save_message.status !== "ok")
        throw new Error("Falha ao salvar a mensagem!");

      callback({
        id: userID,
        status: true,
        msg_data: {
          userID,
          message,
        },
      });
    } catch ({ message }) {
      callback({
        id: userID,
        status: false,
        msg: message,
        msg_data: {
          userID,
          message,
        },
      });
    }
  });

  // ------------------------------------------------------------------------
  // ALUNO/PROFISSIONAL
  // Definir sala para o usuario(Aluno/funcionario)

  socket.on("room:user", async ({ userID }, callback) => {
    try {
      if (userID == "" || !userID)
        throw new Error("ID do usuario incorreto ou vazio!");

      socket.join(userID);

      onlineUsers.push({
        userId: userID,
        socket: socket.id,
      });

      const user = new User(userID);
      const load_user = await user.loadUser();

      suportNamespace.to("admin").emit("update:connections", onlineUsers);

      if (!mapRooms.get(userID)) throw new Error("Usuario não entrou na sala!");

      callback({
        id: userID,
        status: true,
        room: socket.id,
        load_user,
      });
    } catch ({ message }) {
      callback({
        id: userID,
        room: socket.id,
        status: false,
        msg: message,
      });
    }
  });

  socket.on("request:message", async ({ userID }) => {
    const user = new User(userID);
    socket.emit("update:message", await user.loadMessages());
  });

  mapRooms = socket.adapter.rooms;
});
