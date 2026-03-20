export default class Hooks {
  clientSelect = null;

  formatDate(data) {
    const d = new Date(data);

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();

    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  }

  loadUsersInScreen(users) {
    const container = document.querySelector("#account_users");
    let usersArray = Array.isArray(users) ? users : [users];

    usersArray.sort((a, b) => new Date(a.data) - new Date(b.data));

    usersArray.forEach((data) => {
      let userName = data.user || "Usuário Desconhecido";
      const dataFormatada = this.formatDate(data.data);
      userName = userName.replace(/[ï¿½]/g, "").replace(/_/g, " ").trim();

      let userElement = document.getElementById(data.id_user);

      if (!userElement) {
        const userHtml = `
      <div id="${data.id_user}" class="user-card">
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
  }
}
