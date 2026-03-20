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
  cors: {
    origin: "*",
  },
});

// FUNCIONAMENTO DO SOCKET

const chats = {};
let onlineUsers = [];
let allUser = [];
let mapRooms;

const suportNamespace = io.of("/suport");
const users = new Users();

suportNamespace.on("connection", (socket) => {
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

  socket.on("request:user", ({ userID }, callback) => {
    try {
      if (userID == "") throw new Error("ID do usuario incorreto ou vazio!");

      if (!mapRooms.get(userID)) throw new Error("Usuario não tem sala!");

      socket.leave();
      socket.join(userID);

      callback({
        id: userID,
        status: true,
        room: socket.id,
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

  // ALUNO/PROFISSIONAL
  // Definir sala para o usuario(Aluno/funcionario)
  socket.on("room:user", ({ userID }, callback) => {
    try {
      console.log(userID);

      if (userID == "" || !userID)
        throw new Error("ID do usuario incorreto ou vazio!");

      if (mapRooms.get(userID))
        throw new Error("Usuario já entrou em uma sala!");
      socket.join(userID);

      if (!mapRooms.get(userID)) throw new Error("Usuario não entrou na sala!");

      callback({
        id: userID,
        status: true,
        room: socket.id,
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

  // suportNamespace.to("room1").emit("hola", "sucesso!" + socket.id);
  mapRooms = socket.adapter.rooms;
});

io.on("connection1", (socket) => {
  console.log("client conectado" + socket.id);

  // socket.on("disconnect", () => {
  //   console.log("client desconectou" + socket.id);
  // });

  //

  // socket.on("disconnect", (e) => {
  //   const user = onlineUsers.find((u) => u.socket === socket.id);

  //   if (!user) return;

  //   onlineUsers = onlineUsers.filter((u) => u.socket !== socket.id);

  //   io.to("admin").emit("send_connection", {
  //     userId: user.userId,
  //     status: "offline",
  //   });
  // });

  // socket.on("join_chat", async ({ userId, role }) => {
  //   let room;

  //   if (userId != null && userId !== "") {
  //     room = `user_${userId}`;

  //     console.log(role);
  //     if (role == "user") {
  //       let loadUSer = await loadUser(userId);

  //       if (loadUSer == [] || loadUSer.length == 0) {
  //         await saveUser(userId);
  //       }

  //       onlineUsers.push({
  //         userId: userId,
  //         socket: socket.id,
  //       });

  //       if (userId) {
  //         if (onlineUsers.length == 0) {
  //           io.to("admin").emit("send_connection", {
  //             status: "offline",
  //           });
  //         } else {
  //           onlineUsers.map((userStatus) => {
  //             if (userStatus.userId == Number(userId)) {
  //               io.to("admin").emit("send_connection", {
  //                 userId: userId,
  //                 status: "online",
  //               });
  //             } else {
  //               io.to("admin").emit("send_connection", {
  //                 userId: userId,
  //                 status: "offline",
  //               });
  //             }
  //           });
  //         }
  //       }
  //     }

  //     console.log(mapRooms);
  //     if (role == "admin") {
  //       socket.join("admin");

  //       if (userId) {
  //         socket.join(room);
  //       }
  //     }

  //     chats[room] = await loadMessages(userId);
  //     socket.emit("update_msg", chats[room]);
  //   }

  //   if (role == "admin") {
  //     socket.emit("sendUser", await loadAllUser());

  //     if (userId != null && userId !== "") {
  //       socket.emit("send_userSelect", await loadUser(userId));
  //     }
  //   }
  // });

  // socket.on("recoveredMessage", async ({ userId }) => {
  //   const room = `user_${userId}`;

  //   const message = await loadMessages(userId);

  //   chats[room] = message;

  //   if (!chats[room]) chats[room] = [];

  //   io.to(room).emit("update_msg", chats[room]);
  //   io.to("admin").emit("sendUser", await loadAllUser());
  // });

  // socket.on("new_msg", async ({ userId }) => {
  //   loadAndSendData(userId, socket);
  // });

  // socket.on("admin_msg", async ({ userId }) => {
  //   loadAndSendData(userId, socket);
  // });
});

async function loadAndSendData(userId, socket) {
  const room = `user_${userId}`;

  if (chats[room] == undefined) {
    socket.emit("update_msg", { erro: "sala não localizada!" });
    return;
  }

  const messages = await loadMessages(userId);
  chats[room] = messages;

  io.to(room).emit("update_msg", chats[room]);

  const users = await loadAllUser();

  // console.log(socket);

  io.to("admin").emit("sendUser", users);
}

// ========== FETCH API ===================

async function loadMessages(userId) {
  try {
    const res = await fetch(
      `https://ipa-edu.com.br/ipasis/adm/get_messages.php?user_id=${userId}`,
    );

    if (!res.ok) {
      throw new Error("Erro HTTP");
    }

    return await res.json();
  } catch (err) {
    console.error("Erro ao carregar mensagens:", err);

    return [];
  }
}

async function loadUser(userId) {
  try {
    const res = await fetch(
      `https://ipa-edu.com.br/ipasis/adm/get_user.php?user_id=${userId}`,
    );

    if (!res.ok) {
      throw new Error("Erro HTTP");
    }

    return await res.json();
  } catch (err) {
    console.error("Erro ao carregar usuario:", err);

    return [];
  }
}

async function saveUser(userId) {
  await fetch("https://ipa-edu.com.br/ipasis/adm/send_user.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  const user = await loadUser(userId);
  return user;
}
