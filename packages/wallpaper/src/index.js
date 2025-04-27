import images from './wallpapers.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get the desired wallpaper category from environment variable, if set
const category = process.env.DESKTOP_CATEGORY;

let filteredImages = images;

// Filter images by category if specified, otherwise use all images
if (category) {
    filteredImages = images.filter(image => image.category === category);
}

// Select a random image from the filtered list to ensure variety
const randomImage = filteredImages[Math.floor(Math.random() * filteredImages.length)];

// Download the selected image using fetch API (requires Node.js 18+ or polyfill)
const response = await fetch(randomImage.url);
if (!response.ok) {
    // Fail fast if the image cannot be fetched, to avoid writing corrupt files
    throw new Error(`Failed to fetch image: ${response.statusText}`);
}
const imageBlob = await response.blob();
const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

// ESM modules do not have __dirname; compute it using fileURLToPath for compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Save the downloaded image to a fixed location for use as wallpaper
const outputPath = path.join(__dirname, '../Wallpaper.jpg');
fs.writeFileSync(outputPath, imageBuffer);

// Set the wallpaper in GNOME desktop environment using gsettings
// This command updates the background for light mode
exec(`gsettings set org.gnome.desktop.background picture-uri "file://${outputPath}"`, (error) => {
    if (error) {
        // Log errors but do not throw, as the process may still succeed for dark mode
        console.error(`Error setting wallpaper: ${error.message}`);
        return;
    }
    console.log('Wallpaper set successfully');
});
// Set the wallpaper for dark mode, if supported by the desktop environment
exec(`gsettings set org.gnome.desktop.background picture-uri-dark "file://${outputPath}"`, (error) => {
    if (error) {
        // Log errors for dark mode separately
        console.error(`Error setting dark wallpaper: ${error.message}`);
        return;
    }
    console.log('Dark wallpaper set successfully');
});