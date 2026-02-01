const mergeBtn = document.getElementById("mergeBtn");
const pdfFiles = document.getElementById("pdfFiles");
const fileList = document.getElementById("fileList");
const downloadLink = document.getElementById("downloadLink");
const uploadArea = document.getElementById("uploadArea");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

let filesArray = [];

// Theme Switching
themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    themeLabel.textContent = document.body.classList.contains("dark") ? "Dark Theme" : "Light Theme";
});

// Drag & Drop highlight
uploadArea.addEventListener("dragover", e => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "rgba(255,255,255,0.3)";
});
uploadArea.addEventListener("dragleave", e => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "transparent";
});
uploadArea.addEventListener("drop", e => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "transparent";
    addFiles(e.dataTransfer.files);
});

// Input change
pdfFiles.addEventListener("change", () => { addFiles(pdfFiles.files); });

// Add files
function addFiles(files) {
    for (const file of files) {
        if (file.type === "application/pdf" && !filesArray.includes(file)) {
            filesArray.push(file);
        }
    }
    renderFileList();
}

// Render file list
function renderFileList() {
    fileList.innerHTML = "";
    filesArray.forEach((file, idx) => {
        const li = document.createElement("li");
        li.draggable = true;
        li.innerHTML = `<span>📄 ${file.name} (${(file.size/1024).toFixed(1)} KB)</span>`;
        fileList.appendChild(li);

        // Drag & Drop reorder
        li.addEventListener("dragstart", () => li.classList.add("dragging"));
        li.addEventListener("dragend", () => li.classList.remove("dragging"));
    });

    // Drag sorting
    fileList.addEventListener("dragover", e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(fileList, e.clientY);
        const dragging = document.querySelector(".dragging");
        if (afterElement == null) fileList.appendChild(dragging);
        else fileList.insertBefore(dragging, afterElement);
        // Update filesArray order
        const newOrder = Array.from(fileList.children).map(li => filesArray.find(f => li.innerText.includes(f.name)));
        filesArray = newOrder;
    });
}

// Helper for reordering
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height/2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Merge PDFs
mergeBtn.addEventListener("click", async () => {
    if (filesArray.length === 0) { alert("Please select PDF files!"); return; }

    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of filesArray) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type:"application/pdf" });
    const url = URL.createObjectURL(blob);

    downloadLink.href = url;
    downloadLink.download = "merged.pdf";
    downloadLink.style.display = "inline-block";
    downloadLink.textContent = "Download Merged PDF";
});
