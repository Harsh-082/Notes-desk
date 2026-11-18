const SUPABASE_URL = "https://wixxzokylitlxpqfvqpo.supabase.co";
const SUPABASE_KEY = "sb_publishable_rU1Nnu-Uab-XCIYOH1SCBg__6E8ZJNs";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("NotesDesk connected!");

const fileGrid = document.getElementById("fileGrid");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");

let files = [];
let currentCategory = "All";
const uploadsTitle = document.getElementById("uploadsTitle");

function formatSize(bytes) {
    if (!bytes) return "Unknown size";
    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getFileType(file) {
    const extension = file.file_name.split(".").pop().toLowerCase();

    const types = {
        pdf: ["PDF", "📄"],
        doc: ["DOC", "📄"],
        docx: ["DOCX", "📄"],
        ppt: ["PPT", "📊"],
        pptx: ["PPTX", "📊"],
        xls: ["EXCEL", "📊"],
        xlsx: ["EXCEL", "📊"],
        mp4: ["VIDEO", "🎬"],
        mp3: ["AUDIO", "🎧"],
        jpg: ["IMAGE", "🖼️"],
        jpeg: ["IMAGE", "🖼️"],
        png: ["IMAGE", "🖼️"],
        zip: ["ZIP", "📦"],
        txt: ["TXT", "📝"]
    };

    return types[extension] || ["FILE", "📁"];
}

function displayFiles(list) {
    fileGrid.innerHTML = "";
    emptyMessage.hidden = list.length !== 0;

    list.forEach(file => {
        const card = document.createElement("article");
        card.className = "file-card";

        const [type, icon] = getFileType(file);

        const fileIcon = document.createElement("div");
        fileIcon.className = "file-type blue";
        fileIcon.textContent = icon;

        const title = document.createElement("h3");
        title.textContent = file.title;

        const description = document.createElement("p");
        description.textContent =
            `${file.category} • ${type} • ${formatSize(file.file_size)}`;

        const publicUrl = supabaseClient.storage
            .from("notesdesk-files")
            .getPublicUrl(file.file_path).data.publicUrl;

        const isAudio =
            file.category.toLowerCase() === "audio" ||
            (file.file_type || "").startsWith("audio/") ||
            /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.file_name);

        card.append(fileIcon, title, description);

        if (isAudio) {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.preload = "none";
            audio.src = publicUrl;
            audio.style.width = "100%";
            audio.style.marginTop = "12px";

            card.appendChild(audio);
        }

        const footer = document.createElement("div");
        footer.className = "file-footer";

        const date = document.createElement("span");
        date.textContent =
            new Date(file.created_at).toLocaleDateString();

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.gap = "10px";

        if (!isAudio) {
            const preview = document.createElement("a");
            preview.className = "download-btn";
            preview.textContent = "Preview";
            preview.href = publicUrl;
            preview.target = "_blank";
            preview.rel = "noopener noreferrer";
            actions.appendChild(preview);
        }

        const download = document.createElement("a");
        download.className = "download-btn";
        download.textContent = "Download ↓";
        download.href = publicUrl + "?download=" +
            encodeURIComponent(file.file_name);

        actions.appendChild(download);

        footer.append(date, actions);
        card.appendChild(footer);

        fileGrid.appendChild(card);
    });
}

function searchFiles() {
    const query = searchInput.value.toLowerCase().trim();

    const results = files.filter(file => {
        const matchesSearch =
            file.title.toLowerCase().includes(query) ||
            (file.description || "").toLowerCase().includes(query) ||
            file.category.toLowerCase().includes(query) ||
            file.file_name.toLowerCase().includes(query);

        const matchesCategory =
            currentCategory === "All" ||
            file.category === currentCategory;

        return matchesSearch && matchesCategory;
    });

    displayFiles(results);
}

function filterFiles(category) {
    currentCategory = category;
    uploadsTitle.textContent = category + " Library";
    searchFiles();

    document.getElementById("uploads")
        .scrollIntoView({ behavior: "smooth" });
}

function showAll() {
    currentCategory = "All";
    uploadsTitle.textContent = "Latest Uploads";
}

async function loadFiles() {
    fileGrid.innerHTML = "<p>Loading resources...</p>";

    const { data, error } = await supabaseClient
        .from("resources")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

    if (error) {
        fileGrid.innerHTML = "";
        emptyMessage.hidden = false;
        emptyMessage.textContent = "Could not load files: " + error.message;
        console.error(error);
        return;
    }

    files = data || [];
    searchFiles();
}

searchInput.addEventListener("input", searchFiles);

loadFiles();