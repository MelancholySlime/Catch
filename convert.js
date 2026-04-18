const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ===== CONFIG =====
const inputFile = process.argv[2] || "input.json";
const outputDir = process.argv[3] || "./output";

// ===== INIT =====
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

// ===== HELPERS =====
function clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, v));
}

function toHex(r, g, b) {
    const to255 = (v) => Math.round(clamp(v) * 255);
    return (
        "#" +
        [r, g, b]
            .map((v) => to255(v).toString(16).padStart(2, "0"))
            .join("")
    );
}

// 🔥 UNIQUE NAME GENERATOR
function uniqueName(base) {
    const timestamp = Date.now();
    const rand = crypto.randomBytes(4).toString("hex");
    return `${base}_${timestamp}_${rand}`;
}

// ===== FORMAT DETECT =====
function detectFormat(palette) {
    if (palette.Palette) return "HACKSAW";
    if (palette.value) return "ALLSAMPLES";
    return "UNKNOWN";
}

// ===== TRANSFORM =====
function transformHackSaw(palette) {
    return palette.Palette.map((c) => {
        const [r, g, b, a] = c.vec4 || [0, 0, 0, 1];

        return {
            r: clamp(r),
            g: clamp(g),
            b: clamp(b),
            a: clamp(a),
            time: c.time ?? 0,
            hex: toHex(r, g, b),
        };
    });
}

function transformAllSamples(palette) {
    return palette.value.map((c) => {
        let [r = 0, g = 0, b = 0, aRaw] = c.color || [];

        // normalize RGB
        r /= 255;
        g /= 255;
        b /= 255;

        // alpha logic (ưu tiên opacity)
        let a;
        if (c.opacity !== undefined) {
            a = c.opacity / 100;
        } else if (aRaw !== undefined) {
            a = aRaw / 255;
        } else {
            a = 1;
        }

        // normalize time
        const time = (c.time ?? 0) / 100;

        return {
            r: clamp(r),
            g: clamp(g),
            b: clamp(b),
            a: clamp(a),
            time: clamp(time),
            hex: toHex(r, g, b),
        };
    });
}

// ===== MAIN =====
data.forEach((palette, index) => {
    const format = detectFormat(palette);

    let colors = [];

    if (format === "HACKSAW") {
        colors = transformHackSaw(palette);
    } else if (format === "ALLSAMPLES") {
        colors = transformAllSamples(palette);
    } else {
        console.warn(`⚠ Unknown format at index ${index}`);
        return;
    }

    const newPalette = {
        name: palette.Name || palette.name || `palette_${index}`,
        mode: "random",
        created: new Date().toISOString(),
        colors,
    };

    // ===== SAFE + UNIQUE FILE NAME =====
    const baseName = newPalette.name.replace(/[^\w\d]/g, "_");
    const fileName = uniqueName(baseName) + ".json";

    fs.writeFileSync(
        path.join(outputDir, fileName),
        JSON.stringify(newPalette, null, 2)
    );

    console.log(`✔ Exported: ${fileName} (${format})`);
});

console.log("Done.");