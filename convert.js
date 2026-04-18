const fs = require("fs");
const path = require("path");

// ===== CONFIG =====
const inputFile = "SampleDB.json";
const outputDir = "./output";

// ===== CREATE OUTPUT FOLDER =====
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// ===== LOAD DATA =====
const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

// ===== HELPER: RGB -> HEX =====
function toHex(r, g, b) {
    const to255 = (v) => Math.round(v * 255);
    return (
        "#" +
        [r, g, b]
            .map((v) => to255(v).toString(16).padStart(2, "0"))
            .join("")
    );
}

// ===== TRANSFORM =====
data.forEach((palette, index) => {
    const newPalette = {
        name: palette.Name || `palette_${index}`,
        mode: "random",
        created: new Date().toISOString(),
        colors: palette.Palette.map((c) => {
            const [r, g, b, a] = c.vec4;

            return {
                r,
                g,
                b,
                a,
                time: c.time ?? 0,
                hex: toHex(r, g, b)
            };
        })
    };

    // ===== UNIQUE FILE NAME =====
    const safeName = newPalette.name.replace(/[^\w\d]/g, "_");
    const fileName = `${safeName}_${index}.json`;

    fs.writeFileSync(
        path.join(outputDir, fileName),
        JSON.stringify(newPalette, null, 2)
    );

    console.log(`✔ Exported: ${fileName}`);
});

console.log("Done.");