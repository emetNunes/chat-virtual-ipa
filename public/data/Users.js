class Users {
  // Pegar todos os usuarios;
  async loadAllUser() {
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
}

module.exports = Users;
