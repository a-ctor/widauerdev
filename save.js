// Adapted from https://stackoverflow.com/questions/13405129/javascript-create-and-save-file
function saveAs(data, filename, type) {
    const file = new Blob([data], {type: type});
    const url = URL.createObjectURL(file);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    a.click();
    
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);  
    }, 0); 
}