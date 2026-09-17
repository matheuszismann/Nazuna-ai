(() => {
    const root = document.createElement("section");
    root.className = "mood-card mood-loading";
    root.setAttribute("aria-live", "polite");
    root.innerHTML = "<span>🌙</span><div><strong>Mood do dia</strong><small>carregando...</small></div>";
    document.body.appendChild(root);

    fetch("/api/mood/today")
        .then(response => {
            if (!response.ok) throw new Error("Mood indisponível");
            return response.json();
        })
        .then(({ mood }) => {
            root.style.setProperty("--mood-color", mood.color || "#9d7cff");
            root.classList.remove("mood-loading");
            root.innerHTML = `
                <span class="mood-emoji">${mood.react}</span>
                <div><strong>Mood da Nazuna: ${mood.title}</strong>
                <small>${mood.description}</small></div>`;
        })
        .catch(() => root.remove());
})();
