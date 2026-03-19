const express = require("express");
const app = express();
const path = require("path");
const socketIO = require("socket.io");

app.use("/", express.static(path.join(__dirname, "public/widget")));

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.js"));
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

suportNamespace.on("connection", (socket) => {
  mapRooms = socket.adapter.rooms;

  socket.on("disconnecting", () => {
    console.log("client desconectou do servidor:" + socket.id);
  });

  socket.join("room1");

  suportNamespace.to("room1").emit("hola", "sucesso!" + socket.id);
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

async function loadAllUser() {
  try {
    const res = await fetch(
      `https://ipa-edu.com.br/ipasis/adm/get_all_users.php`,
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
