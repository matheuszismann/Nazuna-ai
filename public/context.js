(() => {
    const clearButton = document.getElementById("clearChat");
    const userId = localStorage.getItem("nazunaUserId");
    const API_URL = "https://nazuna-ai.onrender.com";

    if (!clearButton || !userId) return;

    clearButton.addEventListener("click", async () => {
        try {
            const response = await fetch(`${API_URL}/api/chat/context`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "remover" })
            });

            if (!response.ok) {
                console.error("Não foi possível remover o contexto do PostgreSQL.");
                return;
            }

            console.log("🧹 [CONTEXT] Contexto removido do usuário.");
        } catch (error) {
            console.error("❌ [CONTEXT] Falha ao enviar remover:", error);
        }
    });
})();
