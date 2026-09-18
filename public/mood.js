(() => {
    const STORAGE_KEY = "nazunaMoodDoDia";
    const today = new Date().toLocaleDateString("sv-SE");
    const moods = [
        { id: "lazy", title: "Com preguiça", description: "Hoje prefiro papos mais curtos.", react: "😴", color: "#9d7cff" },
        { id: "tsundere", title: "Irritadiça", description: "Estou meio implicante hoje...", react: "🙄", color: "#ff8fa3" },
        { id: "happy", title: "De bom humor", description: "Estou curiosa e com vontade de conversar!", react: "✨", color: "#ffd166" },
        { id: "sleepy", title: "Sonolenta", description: "Respostas tranquilas e alguns bocejos.", react: "🌙", color: "#78a9ff" }
    ];

    // Mantém somente o registro do dia atual no navegador da pessoa.
    const oldData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const mood = moods[
        (new Date().getFullYear() * 10000
            + (new Date().getMonth() + 1) * 100
            + new Date().getDate()) % moods.length
    ];

    const data = oldData?.date === today
        ? oldData
        : { date: today, mood, events: [] };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function recordEvent(type, text) {
        if (!text || typeof text !== "string") return;

        data.events.push({
            type,
            text: text.trim().slice(0, 500),
            time: new Date().toISOString()
        });

        // Evita deixar o localStorage crescer indefinidamente.
        data.events = data.events.slice(-100);
        saveData();
    }

    // Disponível para outras partes do frontend, sem banco ou API.
    window.NazunaMood = {
        get: () => data,
        recordEvent
    };

    const root = document.createElement("section");
    root.className = "mood-card";
    root.style.setProperty("--mood-color", mood.color);
    root.setAttribute("aria-label", "Mood do dia");
    root.innerHTML = `
        <span class="mood-emoji">${mood.react}</span>
        <div>
            <strong>Mood da Nazuna: ${mood.title}</strong>
            <small>${mood.description}</small>
            <small>${data.events.length} acontecimento(s) hoje</small>
        </div>`;
    document.body.appendChild(root);

    // Registra as mensagens exibidas hoje no LocalStorage.
    const messages = document.getElementById("messages");
    if (messages) {
        const observer = new MutationObserver(records => {
            records.forEach(record => {
                record.addedNodes.forEach(node => {
                    if (!(node instanceof HTMLElement) || !node.classList.contains("message")) return;
                    const text = node.querySelector(".message-text")?.textContent;
                    const type = node.classList.contains("user") ? "user" : "nazuna";
                    recordEvent(type, text);
                });
            });
        });
        observer.observe(messages, { childList: true });
    }
})();
