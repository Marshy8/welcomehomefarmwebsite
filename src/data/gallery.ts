// Every gallery photo in src/assets, by file name. Each is pre-cropped to the
// card's 4:5 shape at 640 × 800; the full-size originals are in originals/.
const FILES = import.meta.glob<string>("../assets/gallery-*.webp", {
  eager: true,
  import: "default",
});

export interface GalleryPhoto {
  src: string;
  alt: string;
}

// Shown left to right in this order. To add a photo, put gallery-N.webp in
// src/assets and add a line here.
const PHOTOS: { file: string; alt: string }[] = [
  { file: "gallery-0.webp", alt: "A basket of fresh figs" },
  { file: "gallery-1.webp", alt: "A pint of red and green okra pods" },
  { file: "gallery-2.webp", alt: "A smiling farmer with pruning shears beside an okra plant in flower" },
  { file: "gallery-3.webp", alt: "A purple passionflower in bloom on the vine" },
  { file: "gallery-4.webp", alt: "Rows of trellised plants stretching across the farm" },
  { file: "gallery-5.webp", alt: "Yellow peppers ripening on the plant" },
  { file: "gallery-6.webp", alt: "A melon growing among tall green plants" },
  { file: "gallery-7.webp", alt: "Eggplants hanging from the plant" },
  { file: "gallery-8.webp", alt: "Red tomatoes ripening on the vine" },
  { file: "gallery-9.webp", alt: "A pile of ground cherries in their papery husks" },
  { file: "gallery-10.webp", alt: "Trays of ground cherries in their husks" },
  { file: "gallery-11.webp", alt: "Two women holding a basket of fresh vegetables" },
  { file: "gallery-12.webp", alt: "A smiling woman holding pints of blackberries and ground cherries" },
  { file: "gallery-13.webp", alt: "A crate of small striped cucamelons" },
  { file: "gallery-14.webp", alt: "A farmer standing among the plants with a fresh harvest" },
  { file: "gallery-15.webp", alt: "A bed of curly kale" },
  { file: "gallery-16.webp", alt: "Raspberries ripening on the cane" },
  { file: "gallery-17.webp", alt: "A harvest of kale, zucchini and snap peas" },
  { file: "gallery-18.webp", alt: "Pints of fresh blackberries" },
  { file: "gallery-19.webp", alt: "Bowls and pints of dark red berries" },
];

export const GALLERY_PHOTOS: GalleryPhoto[] = PHOTOS.flatMap(({ file, alt }) => {
  const src = FILES[`../assets/${file}`];
  return src ? [{ src, alt }] : [];
});
