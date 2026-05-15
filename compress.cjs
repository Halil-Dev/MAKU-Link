const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const compressDir = async (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const input = path.join(dir, file);
      const output = path.join(dir, file.replace(/\.(png|jpg|jpeg)$/, '.webp'));
      console.log(`Compressing ${input} to ${output}`);
      
      let pipeline = sharp(input);
      
      const metadata = await pipeline.metadata();
      // Resize avatars to something reasonable like 256px
      if (metadata.width > 256 && !file.includes('logo')) {
        pipeline = pipeline.resize({ width: 256 });
      } else if (metadata.width > 512 && file.includes('logo')) {
        pipeline = pipeline.resize({ width: 512 });
      }
      
      await pipeline.webp({ quality: 80 }).toFile(output);
      fs.unlinkSync(input); // remove original
    }
  }
};

const run = async () => {
  await compressDir('./src/assets');
  await compressDir('./public');
  console.log('Done!');
}

run();
