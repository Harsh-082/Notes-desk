const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const playerSection = document.getElementById("playerSection");
const player = document.getElementById("player");

// Supabase Edge Function
const API_URL = "https://wixxzokylitlxpqfvqpo.supabase.co/functions/v1/quick-service";

// Supabase Publishable Key
const SUPABASE_KEY = "sb_publishable_rU1Nnu-Uab-XCIYOH1SCBg__6E8ZJNs";

async function searchSongs() {
    const query = searchInput.value.trim();

    if (!query) {
        results.textContent = "Please enter a song name.";
        return;
    }

    results.textContent = "Searching songs...";

    try {
        const response = await fetch(
            `${API_URL}?q=${encodeURIComponent(query)}`,
            {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed: ${response.status}`);
        }

        results.innerHTML = "";

        if (!data.items || data.items.length === 0) {
            results.textContent = "No songs found.";
            return;
        }

        data.items.forEach(song => {
            const card = document.createElement("div");
            card.className = "song-card";

            const title = document.createElement("h3");
            title.textContent = song.title;

            const artist = document.createElement("p");
            artist.textContent = song.channelTitle;

            const button = document.createElement("button");
            button.textContent = "▶ Play";

            button.addEventListener("click", () => {
                playSong(song.videoId);
            });

            card.append(title, artist, button);
            results.appendChild(card);
        });

    } catch (error) {
        results.textContent = "Error: " + error.message;
        console.log(error);
    }
}

function playSong(videoId) {
    playerSection.hidden = false;

    player.innerHTML = `
        <iframe
            src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1"
            title="YouTube music player"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;

    playerSection.scrollIntoView({
        behavior: "smooth"
    });
}

searchBtn.addEventListener("click", searchSongs);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchSongs();
    }
});