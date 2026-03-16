const express = require("express");
const app = express();
const path = require("path");
const socketIO = require("socket.io");

app.use("/", express.static(path.join(__dirname, "public")));

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

const chats = {};
let onlineUsers = [];
let allUser = [];

let socketAdmin;

let admin = io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    const user = onlineUsers.find((u) => u.socket === socket.id);

    if (!user) return;

    onlineUsers = onlineUsers.filter((u) => u.socket !== socket.id);

    io.to("admin").emit("send_connection", {
      userId: user.userId,
      status: "offline",
    });
  });

  socket.join("admin");

  const refere = socket.handshake.headers.referer;
  const routerAdmin = "http://localhost:3000/admin";

  if (refere == routerAdmin) {
    const mapRooms = socket.adapter.rooms;
    socketAdmin = mapRooms.get("admin");
  }

  socket.on("join_chat", async ({ userId, role }) => {
    socket.userId = userId;
    socket.role = role;

    if (userId != null && userId !== "") {
      const room = `user_${userId}`;

      socket.leaveAll();
      socket.join(room);

      chats[room] = await loadMessages(userId);

      if (role === "admin") {
        socket.emit("send_userSelect", await loadUser(userId));
        socket.emit("update_msg", chats[room]);
      } else {
        let user = await loadUser(userId);

        if (!user || user.length === 0) {
          await saveUser(userId);
        }

        chats[room] = await loadMessages(userId);

        if (!chats[room]) chats[room] = [];

        socket.emit("send_userSelect", await loadUser(userId));
        socket.emit("update_msg", chats[room]);

        onlineUsers.push({
          userId: userId,
          socket: socket.id,
        });

        io.to("admin").emit("send_connection", {
          userId: userId,
          status: "online",
        });
      }
    }

    socket.emit("sendUser", await loadAllUser());
    if (userId) {
      if (onlineUsers.length == 0) {
        io.to("admin").emit("send_connection", {
          status: "offline",
        });
      } else {
        onlineUsers.map((userStatus) => {
          if (userStatus.userId == Number(userId)) {
            io.to("admin").emit("send_connection", {
              userId: userId,
              status: "online",
            });
          } else {
            io.to("admin").emit("send_connection", {
              userId: userId,
              status: "offline",
            });
          }
        });
      }
    }
  });

  socket.on("recoveredMessage", async ({ userId }) => {
    const room = `user_${userId}`;

    const message = await loadMessages(userId);

    chats[room] = message;

    if (!chats[room]) chats[room] = [];

    io.to(room).emit("update_msg", chats[room]);
    io.to(socketAdmin).emit("sendUser", await loadAllUser());
  });

  socket.on("new_msg", async ({ userId }) => {
    loadAndSendData(userId, socket);
  });

  socket.on("admin_msg", async ({ userId }) => {
    loadAndSendData(userId, socket);
  });
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

  console.log(socket);

  io.to("admin").emit("sendUser", users);
}

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
