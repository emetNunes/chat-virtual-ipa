class User {
  userID;

  constructor(userID) {
    this.userID = userID;
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
