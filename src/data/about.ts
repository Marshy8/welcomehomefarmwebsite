import ashleyPortrait from "../assets/ashley-portrait.webp";
import farmPortrait from "../assets/farm-portrait.webp";

export interface AboutPanel {
  title: string;
  text: string;
  image: string;
  alt: string;
  /** CSS object-position, so the crop keeps the subject in frame. */
  imagePosition: string;
}

// Shown side by side on wide screens, in this order.
export const ABOUT_PANELS: AboutPanel[] = [
  {
    title: "About Ashley",
    text: "Welcome Home Farm was built by the body and heart of Ashley Harris. At age 15, she dreamed of owning a farm. She interned on farms and received a BS in Biology in 2009. She married and had five children, while continuing to garden extensively and dream. In 2025, she became a proud graduate of the University of Arkansas CAFF (Center for Arkansas Food and Farming) extension program. Her CAFF experiences gave her the support she needed to launch Welcome Home Farm. Ashley’s passion is reconnecting with the land’s native food and the act of harvesting. She hopes everyone feels welcomed to greater connection at the farm.",
    image: ashleyPortrait,
    alt: "Ashley Harris smiling while harvesting in the garden",
    imagePosition: "center 20%",
  },
  {
    title: "About the Farm",
    text: "Welcome Home Farm launched on rented land in 2025, and found its permanent home in The Orchards neighborhood of Bentonville in 2026. We grow seasonal vegetables and 6 native fruits for U-Pick, CSA, and educational experiences for our community.",
    image: farmPortrait,
    alt: "Aerial view of the farm's planted rows, with someone waving from between them",
    imagePosition: "center 75%",
  },
];
