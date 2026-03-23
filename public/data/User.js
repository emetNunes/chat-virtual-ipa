class User {
  userID;

  constructor(userID) {
    this.userID = userID;
  }

  async loadUser() {
    try {
      const res = await fetch(
        `https://ipa-edu.com.br/ipasis/adm/get_user.php?user_id=${this.userID}`,
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

  async saveMessage(message, status) {
    try {
      const res = await fetch(
        `https://ipa-edu.com.br/ipasis/adm/send_message.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: this.userID,
            message,
            status,
          }),
        },
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

  async loadMessages() {
    try {
      const res = await fetch(
        `https://ipa-edu.com.br/ipasis/adm/get_messages.php?user_id=${this.userID}`,
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
  // Pegar o Usuario Pelo ID;
  // Adicionar um usuario;
  // Pegar todas as mensagens desse usuario;
}

module.exports = User;
