const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('hyperconverged_infra_dar_Evaluation_Report.pdf');

pdf(dataBuffer).then(function(data) {
    console.log('=== PDF TEXT CONTENT ===');
    console.log(data.text);
    console.log('\n=== PAGE COUNT ===');
    console.log(data.numpages);
}).catch(err => {
    console.error('Error:', err);
});
