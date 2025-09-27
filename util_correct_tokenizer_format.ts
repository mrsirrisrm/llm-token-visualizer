import fs from 'fs';

const j = JSON.parse(fs.readFileSync("./public/models/smollm2-135-onnx/tokenizer.json", 'utf-8'))
j.model.merges = j.model.merges.map(([a,b]) => `${a} ${b}`)
fs.writeFileSync("./public/models/smollm2-135-onnx/tokenizer2.json", JSON.stringify(j, null, 2), 'utf-8')