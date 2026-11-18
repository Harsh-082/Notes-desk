const SUPABASE_URL = "https://wixxzokylitlxpqfvqpo.supabase.co";
const SUPABASE_KEY = "sb_publishable_rU1Nnu-Uab-XCIYOH1SCBg__6E8ZJNs";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const loginBox = document.getElementById("login");
const dashboard = document.getElementById("dashboard");
const message = document.getElementById("message");
const uploadForm = document.getElementById("uploadForm");

// ADMIN LOGIN
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    message.textContent = "Checking login...";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        message.textContent = error.message;
        return;
    }

    const { data: admin, error: adminError } =
        await supabaseClient
            .from("admins")
            .select("user_id")
            .eq("user_id", data.user.id)
            .maybeSingle();

    if (adminError || !admin) {
        await supabaseClient.auth.signOut();
        message.textContent = "Access denied: You are not an admin.";
        return;
    }

    loginBox.style.display = "none";
    dashboard.style.display = "block";
    message.textContent = "Welcome Admin!";
});

// UPLOAD RESOURCE - MULTIPLE FILES
uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const batchTitle = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const selectedFiles = Array.from(
        document.getElementById("file").files
    );

    if (selectedFiles.length === 0) {
        message.textContent = "Please select at least one file.";
        return;
    }

    const uploadButton = uploadForm.querySelector(
        'button[type="submit"]'
    );

    uploadButton.disabled = true;

    let uploadedCount = 0;
    const failedFiles = [];

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        message.textContent =
            `Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}`;

        const safeFileName = file.name.replace(/[^\w.-]/g, "_");
        const filePath = crypto.randomUUID() + "-" + safeFileName;

        try {
            // Upload file to Supabase Storage
            const { error: uploadError } = await supabaseClient
                .storage
                .from("notesdesk-files")
                .upload(filePath, file);

            if (uploadError) {
                failedFiles.push(file.name + ": " + uploadError.message);
                continue;
            }

            // Generate individual title
            const fileNameWithoutExtension =
                file.name.replace(/\.[^/.]+$/, "");

            const resourceTitle =
                selectedFiles.length === 1
                    ? batchTitle
                    : `${batchTitle} - ${fileNameWithoutExtension}`;

            // Save file information in database
            const { error: databaseError } = await supabaseClient
                .from("resources")
                .insert({
                    title: resourceTitle,
                    description: description,
                    category: category,
                    file_name: file.name,
                    file_path: filePath,
                    file_type: file.type || null,
                    file_size: file.size,
                    is_public: true
                });

            if (databaseError) {
                await supabaseClient
                    .storage
                    .from("notesdesk-files")
                    .remove([filePath]);

                failedFiles.push(file.name + ": " + databaseError.message);
                continue;
            }

            uploadedCount++;

        } catch (error) {
            failedFiles.push(file.name + ": " + error.message);
        }
    }

    uploadButton.disabled = false;

    if (failedFiles.length === 0) {
        message.textContent =
            `Success! ${uploadedCount} files uploaded successfully.`;
        uploadForm.reset();
    } else {
        message.textContent =
            `Uploaded ${uploadedCount} of ${selectedFiles.length}. Failed: ` +
            failedFiles.join(" | ");
    }
});
// LOGOUT
document.getElementById("logoutBtn")
    .addEventListener("click", async function () {
        await supabaseClient.auth.signOut();

        dashboard.style.display = "none";
        loginBox.style.display = "block";
        loginForm.reset();

        message.textContent = "Logged out successfully.";
    });