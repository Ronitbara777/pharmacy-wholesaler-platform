const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('../2.PDF');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('test-pdf-output.txt', data.text, 'utf-8');
    console.log("Written to test-pdf-output.txt");
}).catch(function(error) {
    console.error("Error parsing PDF:", error);
});
